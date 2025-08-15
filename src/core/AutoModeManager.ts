/**
 * Auto Mode Manager - Smart execution of actions based on safety levels
 * Following manifesto: comprehensive error handling, input validation, user safety
 */

import * as vscode from 'vscode';
import { ChatAction, ActionSafety, ActionData } from './types';
import { StateManager } from './StateManager';
import { PiggieFileManager } from '../file-operations/PiggieFileManager';
import { TddCodeGenerationCommand } from '../commands/TddCodeGenerationCommand';
import { AgentManager } from '../agents/AgentManager';
import { StorageService } from './StorageService';

export interface AutoModeResult {
    executed: boolean;
    message?: string;
    requiresApproval?: boolean;
    action?: ChatAction;
}

/**
 * Manages automatic execution of actions in auto mode
 */
export class AutoModeManager {
    private stateManager: StateManager;
    private fileManager: PiggieFileManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.fileManager = new PiggieFileManager();
    }

    /**
     * Determine if an action should be auto-executed based on auto mode setting
     * Auto Mode ON = Execute directly (like Cline)
     * Auto Mode OFF = Show action buttons for approval
     * CRITICAL EXCEPTION: Never auto-execute manifesto overwrites
     */
    shouldAutoExecute(action: ChatAction): boolean {
        // CRITICAL SAFETY: Never auto-execute manifesto overwrite without explicit permission
        if (action.command === 'createManifesto') {
            // For manifesto creation, we need to check if file exists
            // This is a synchronous method, so we'll handle the async check in processAction
            // For now, be conservative and require approval for all manifesto actions
            return false;
        }

        // Auto mode determines execution behavior for other actions
        return this.stateManager.isAutoMode;
    }

    /**
     * Execute an action automatically if safe, or return approval requirement
     */
    async processAction(action: ChatAction, agentManager: AgentManager): Promise<AutoModeResult> {
        try {
            if (!this.shouldAutoExecute(action)) {
                return {
                    executed: false,
                    requiresApproval: true,
                    action: action,
                    message: `Action "${action.label}" requires approval (auto mode is OFF)`
                };
            }

            // Auto-execute the action
            const result = await this.executeAction(action, agentManager);
            return {
                executed: true,
                message: result,
                requiresApproval: false
            };

        } catch (error) {
            return {
                executed: false,
                requiresApproval: true,
                action: action,
                message: `Auto-execution failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Execute a specific action
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    async executeAction(action: ChatAction, agentManager: AgentManager): Promise<string> {
        try {
            switch (action.command) {
                case 'createFile':
                    return await this.handleCreateFile(action);
                case 'createManifesto':
                    return await this.handleCreateManifesto(action);
                case 'generateCode':
                    return await this.handleGenerateCode(action);
                case 'editFile':
                    return `⚠️ File editing requires manual approval`;
                case 'lintCode':
                    return `✅ Linting not yet implemented in auto mode`;
                case 'indexCodebase':
                    return `✅ Indexing not yet implemented in auto mode`;
                case 'executeTddWorkflow':
                    if (!action.data?.content) {
                        throw new Error('TDD workflow requires a content prompt in action data.');
                    }
                    const tddCommand = new TddCodeGenerationCommand();
                    return await tddCommand.execute(action.data.content, this.stateManager, agentManager);
                case 'previewManifesto':
                    return await this.handlePreviewManifesto(action);
                default:
                    throw new Error(`Unknown action command: ${action.command}`);
            }
        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Action execution failed:', error);
            throw error;
        }
    }

    /**
     * Handle file creation
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private async handleCreateFile(action: ChatAction): Promise<string> {
        const { fileName, content, fileType } = action.data as ActionData;

        if (!fileName || !content) {
            throw new Error('Missing fileName or content for file creation');
        }

        const operation = {
            path: fileName,
            content: content,
            type: 'create' as const,
            backup: true
        };

        const result = await this.fileManager.writeCodeToFile(operation);

        if (result.success && result.path) {
            try {
                // Open the newly created file in VS Code editor
                const fileUri = vscode.Uri.file(result.path);
                const document = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(document);
            } catch (openError) {
                console.warn(`Auto-Mode: Successfully created ${result.path} but failed to open it in the editor:`, openError);
                // Do not throw; the primary action (file creation) was successful.
            }

            return `✅ **Auto-created:** \`${fileName}\`\n📁 **Location:** ${result.path}`;
        } else {
            throw new Error(`Failed to create ${fileName}: ${result.error}`);
        }
    }

    /**
     * Handle manifesto creation
     */
    private async handleCreateManifesto(action: ChatAction): Promise<string> {
        const { content, type, forceOverwrite, createBackup } = action.data as ActionData;

        // Get the correct manifesto path from StorageService
        const storageService = StorageService.getInstance();
        const manifestoPath = await storageService.getProjectArtifactsPath('manifesto.md');

        // CRITICAL SAFETY CHECK: Never overwrite existing manifesto without explicit permission
        const manifestoExists = await this.fileManager.fileExists(manifestoPath);

        if (manifestoExists && !forceOverwrite) {
            // Read existing manifesto to show user what would be overwritten
            try {
                const existingContent = await this.fileManager.readFile(manifestoPath);

                return `⚠️ **EXISTING MANIFESTO DETECTED** ⚠️\n\n` +
                       `📋 **Current Manifesto Content:**\n` +
                       `\`\`\`markdown\n${existingContent.substring(0, 500)}${existingContent.length > 500 ? '...' : ''}\n\`\`\`\n\n` +
                       `🛡️ **Protection Active:** manifesto.md already exists in your workspace.\n\n` +
                       `**⚠️ CRITICAL:** Overwriting your manifesto could lose important project rules!\n\n` +
                       `**Safe Options:**\n` +
                       `• **Recommended:** Review your existing manifesto first\n` +
                       `• **Backup:** Create a backup before proceeding\n` +
                       `• **Merge:** Manually combine the best of both\n\n` +
                       `**To proceed anyway:** Use the "Create with Backup" option or manually delete the existing file first.`;
            } catch (error) {
                return `⚠️ **EXISTING MANIFESTO DETECTED** ⚠️\n\n` +
                       `🛡️ **Protection Active:** manifesto.md already exists but couldn't read content.\n\n` +
                       `**⚠️ CRITICAL:** Overwriting your manifesto could lose important project rules!\n\n` +
                       `Please manually review your existing manifesto before proceeding.`;
            }
        }

        // Handle backup creation if requested
        if (manifestoExists && forceOverwrite && createBackup) {
            try {
                const existingContent = await this.fileManager.readFile(manifestoPath);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `manifesto.backup.${timestamp}.md`;

                const backupOperation = {
                    path: backupFileName,
                    content: existingContent,
                    type: 'create' as const,
                    backup: false
                };

                const backupResult = await this.fileManager.writeCodeToFile(backupOperation);

                if (!backupResult.success) {
                    throw new Error(`Backup creation failed: ${backupResult.error}`);
                }
            } catch (error) {
                throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Create the new manifesto
        const operation = {
            path: manifestoPath,
            content: content,
            type: manifestoExists ? 'update' as const : 'create' as const,
            backup: false // We handled backup manually above
        };

        const result = await this.fileManager.writeCodeToFile(operation);

        if (result.success && result.path) {
            try {
                // Open the newly created manifesto file in VS Code editor
                const fileUri = vscode.Uri.file(result.path);
                const document = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(document);
            } catch (openError) {
                console.warn(`Auto-Mode: Successfully created ${result.path} but failed to open it in the editor:`, openError);
                // Do not throw; the primary action (file creation) was successful.
            }

            let response = `✅ **${type} Manifesto Created Successfully!**\n\n`;

            if (manifestoExists && createBackup) {
                response += `📋 **Backup created** for your existing manifesto\n`;
            }

            response += `📁 **File:** ${result.path}\n` +
                       `🎯 **Action:** ${operation.type}\n\n` +
                       `**Next Steps:**\n` +
                       `• Review the manifesto content\n` +
                       `• Customize rules for your specific project\n` +
                       `• Start coding with manifesto compliance!\n\n` +
                       `**💡 Tip:** Use \`/lint\` to check compliance as you code`;

            return response;
        } else {
            throw new Error(`Failed to create manifesto: ${result.error}`);
        }
    }

    /**
     * Handle manifesto preview
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private async handlePreviewManifesto(action: ChatAction): Promise<string> {
        try {
            const { content, type } = action.data as ActionData;

            return `📋 **Full ${type} Manifesto Content:**\n\n\`\`\`markdown\n${content}\n\`\`\`\n\n**💾 Ready to create this manifesto?** Use the "Create manifesto.md" button above.`;
        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Manifesto preview failed:', error);
            throw error;
        }
    }

    /**
     * Handle code generation action
     * MANDATORY: Comprehensive error handling and input validation
     */
    private async handleGenerateCode(action: ChatAction): Promise<string> {
        try {
            // CRITICAL: Input validation
            const actionData = action.data as ActionData;
            if (!actionData || !actionData.fileName || !actionData.code) {
                throw new Error('Missing required data for code generation');
            }

            const { fileName, code, language } = actionData;

            const operation = {
                path: fileName,
                content: code,
                type: 'create' as const,
                backup: true
            };

            const result = await this.fileManager.writeCodeToFile(operation);

            if (result.success) {
                return `✅ **Auto-generated:** \`${fileName}\`\n📁 **Location:** ${result.path}\n💻 **Language:** ${language}`;
            } else {
                throw new Error(`Failed to generate ${fileName}: ${result.error}`);
            }
        } catch (error) {
            // MANDATORY: Comprehensive error handling
            console.error('Code generation failed:', error);
            throw error;
        }
    }


}
