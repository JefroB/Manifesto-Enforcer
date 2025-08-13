/**
 * Auto Mode Manager - Smart execution of actions based on safety levels
 * Following manifesto: comprehensive error handling, input validation, user safety
 */

import * as vscode from 'vscode';
import { ChatAction, ActionSafety, ActionData } from './types';
import { StateManager } from './StateManager';
import { PiggieFileManager } from '../file-operations/PiggieFileManager';

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
    async processAction(action: ChatAction): Promise<AutoModeResult> {
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
            const result = await this.executeAction(action);
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
     */
    async executeAction(action: ChatAction): Promise<string> {
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
            case 'createHelloWorld':
                return await this.handleCreateHelloWorld(action);
            case 'previewManifesto':
                return await this.handlePreviewManifesto(action);
            default:
                throw new Error(`Unknown action command: ${action.command}`);
        }
    }

    /**
     * Handle file creation
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

        if (result.success) {
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

        // CRITICAL SAFETY CHECK: Never overwrite existing manifesto without explicit permission
        const manifestoExists = await this.fileManager.fileExists('manifesto.md');

        if (manifestoExists && !forceOverwrite) {
            // Read existing manifesto to show user what would be overwritten
            try {
                const existingContent = await this.fileManager.readFile('manifesto.md');

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
                const existingContent = await this.fileManager.readFile('manifesto.md');
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
            path: 'manifesto.md',
            content: content,
            type: manifestoExists ? 'update' as const : 'create' as const,
            backup: false // We handled backup manually above
        };

        const result = await this.fileManager.writeCodeToFile(operation);

        if (result.success) {
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
     */
    private async handlePreviewManifesto(action: ChatAction): Promise<string> {
        const { content, type } = action.data as ActionData;

        return `📋 **Full ${type} Manifesto Content:**\n\n\`\`\`markdown\n${content}\n\`\`\`\n\n**💾 Ready to create this manifesto?** Use the "Create manifesto.md" button above.`;
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

    /**
     * Handle Hello World creation action
     * MANDATORY: Comprehensive error handling and input validation
     */
    private async handleCreateHelloWorld(action: ChatAction): Promise<string> {
        try {
            // CRITICAL: Input validation
            const actionData = action.data as ActionData;
            if (!actionData || !actionData.language) {
                throw new Error('Missing language for Hello World creation');
            }

            const { language } = actionData;
            const fileName = `hello.${this.getFileExtension(language)}`;
            const code = this.generateHelloWorldCode(language);

            const operation = {
                path: fileName,
                content: code,
                type: 'create' as const,
                backup: true
            };

            const result = await this.fileManager.writeCodeToFile(operation);

            if (result.success) {
                return `✅ **Hello World in ${language}**\n📁 **File:** ${fileName}\n📍 **Location:** ${result.path}`;
            } else {
                throw new Error(`Failed to create Hello World: ${result.error}`);
            }
        } catch (error) {
            // MANDATORY: Comprehensive error handling
            console.error('Hello World creation failed:', error);
            throw error;
        }
    }

    /**
     * Get file extension for programming language
     */
    private getFileExtension(language: string): string {
        const extensions: { [key: string]: string } = {
            'javascript': 'js',
            'typescript': 'ts',
            'python': 'py',
            'java': 'java',
            'csharp': 'cs',
            'cpp': 'cpp',
            'c': 'c',
            'go': 'go',
            'rust': 'rs',
            'php': 'php',
            'ruby': 'rb'
        };
        return extensions[language.toLowerCase()] || 'txt';
    }

    /**
     * Generate Hello World code for different languages
     */
    private generateHelloWorldCode(language: string): string {
        const templates: { [key: string]: string } = {
            'javascript': 'console.log("Hello, World!");',
            'typescript': 'console.log("Hello, World!");',
            'python': 'print("Hello, World!")',
            'java': 'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
            'csharp': 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
            'cpp': '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
            'c': '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
            'go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
            'rust': 'fn main() {\n    println!("Hello, World!");\n}',
            'php': '<?php\necho "Hello, World!";\n?>',
            'ruby': 'puts "Hello, World!"'
        };
        return templates[language.toLowerCase()] || `// Hello, World! in ${language}\nconsole.log("Hello, World!");`;
    }
}
