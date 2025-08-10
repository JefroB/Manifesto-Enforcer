/**
 * File Lifecycle Manager - Smart management of AI-generated files
 * Following manifesto: MANDATORY error handling, CRITICAL user consent, comprehensive validation
 */

import * as vscode from 'vscode';
import * as path from 'path';

export interface FileLifecycleOptions {
    fileType: 'glossary' | 'manifesto' | 'security-analysis' | 'code-review' | 'documentation';
    action: 'create-new' | 'append' | 'update' | 'replace';
    requireConfirmation?: boolean;
    backupExisting?: boolean;
}

export interface FileLifecycleResult {
    success: boolean;
    action: string;
    filePath?: string;
    backupPath?: string;
    message: string;
}

/**
 * Manages the lifecycle of AI-generated files with smart cleanup and user consent
 */
export class FileLifecycleManager {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Handle file lifecycle based on type and action
     * MANDATORY: Comprehensive error handling and user consent
     */
    public async handleFileLifecycle(
        fileName: string, 
        content: string, 
        options: FileLifecycleOptions
    ): Promise<FileLifecycleResult> {
        try {
            // MANDATORY: Input validation
            if (!fileName || !content || !options) {
                throw new Error('CRITICAL: Invalid input parameters for file lifecycle management');
            }

            const filePath = path.join(this.workspaceRoot, fileName);

            // CRITICAL: Different strategies based on file type
            switch (options.fileType) {
                case 'manifesto':
                    return await this.handleManifestoLifecycle(filePath, content, options);
                
                case 'glossary':
                    return await this.handleGlossaryLifecycle(filePath, content, options);
                
                case 'security-analysis':
                    return await this.handleAnalysisLifecycle(filePath, content, options);
                
                case 'code-review':
                    return await this.handleAnalysisLifecycle(filePath, content, options);
                
                case 'documentation':
                    return await this.handleDocumentationLifecycle(filePath, content, options);
                
                default:
                    throw new Error(`CRITICAL: Unknown file type: ${options.fileType}`);
            }

        } catch (error) {
            console.error('File lifecycle management failed:', error);
            return {
                success: false,
                action: 'error',
                message: `❌ File lifecycle failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Handle manifesto files - CRITICAL: Multiple warnings before deletion
     * MANDATORY: Heavy user consent required
     */
    private async handleManifestoLifecycle(
        filePath: string, 
        content: string, 
        options: FileLifecycleOptions
    ): Promise<FileLifecycleResult> {
        try {
            const fileExists = await this.fileExists(filePath);

            if (options.action === 'create-new' && fileExists) {
                // CRITICAL: HEAVY warnings for manifesto deletion
                const confirmed = await this.getManifestoDeletionConsent(filePath);
                if (!confirmed) {
                    return {
                        success: false,
                        action: 'cancelled',
                        message: '⚠️ Manifesto creation cancelled - existing manifesto preserved'
                    };
                }

                // Create backup before deletion
                const backupPath = await this.createBackup(filePath, 'manifesto-backup');
                await this.deleteFile(filePath);

                await this.writeFile(filePath, content);
                return {
                    success: true,
                    action: 'replaced-with-backup',
                    filePath,
                    backupPath,
                    message: `✅ New manifesto created. Previous version backed up to: ${backupPath}`
                };
            } else if (options.action === 'append' && fileExists) {
                const existingContent = await this.readFile(filePath);
                const updatedContent = existingContent + '\n\n' + content;
                await this.writeFile(filePath, updatedContent);

                return {
                    success: true,
                    action: 'appended',
                    filePath,
                    message: '✅ Content appended to existing manifesto'
                };
            } else {
                // Create new file
                await this.writeFile(filePath, content);
                return {
                    success: true,
                    action: 'created',
                    filePath,
                    message: '✅ New manifesto created'
                };
            }

        } catch (error) {
            throw new Error(`Manifesto lifecycle failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle glossary files - Allow easy replacement or appending
     */
    private async handleGlossaryLifecycle(
        filePath: string, 
        content: string, 
        options: FileLifecycleOptions
    ): Promise<FileLifecycleResult> {
        try {
            const fileExists = await this.fileExists(filePath);

            if (options.action === 'create-new' && fileExists) {
                // Simple confirmation for glossary replacement
                const confirmed = await this.getSimpleConfirmation(
                    'Replace Existing Glossary',
                    'This will replace the existing glossary. Continue?'
                );

                if (!confirmed) {
                    return {
                        success: false,
                        action: 'cancelled',
                        message: '⚠️ Glossary replacement cancelled'
                    };
                }

                const backupPath = await this.createBackup(filePath, 'glossary-backup');
                await this.writeFile(filePath, content);

                return {
                    success: true,
                    action: 'replaced',
                    filePath,
                    backupPath,
                    message: `✅ Glossary replaced. Previous version backed up.`
                };
            } else if (options.action === 'append' && fileExists) {
                // For JSON glossaries, we need smart merging
                if (filePath.endsWith('.json')) {
                    return await this.mergeJsonGlossary(filePath, content);
                } else {
                    const existingContent = await this.readFile(filePath);
                    const updatedContent = existingContent + '\n\n' + content;
                    await this.writeFile(filePath, updatedContent);

                    return {
                        success: true,
                        action: 'appended',
                        filePath,
                        message: '✅ Content appended to existing glossary'
                    };
                }
            } else {
                await this.writeFile(filePath, content);
                return {
                    success: true,
                    action: 'created',
                    filePath,
                    message: '✅ New glossary created'
                };
            }

        } catch (error) {
            throw new Error(`Glossary lifecycle failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle analysis files - Always replace old ones
     */
    private async handleAnalysisLifecycle(
        filePath: string, 
        content: string, 
        options: FileLifecycleOptions
    ): Promise<FileLifecycleResult> {
        try {
            // For analysis files, always clean up old ones first
            await this.cleanupOldAnalysisFiles(options.fileType);

            await this.writeFile(filePath, content);
            return {
                success: true,
                action: 'created-clean',
                filePath,
                message: `✅ New ${options.fileType} created (old files cleaned up)`
            };

        } catch (error) {
            throw new Error(`Analysis lifecycle failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle documentation files - Usually append or update
     */
    private async handleDocumentationLifecycle(
        filePath: string, 
        content: string, 
        options: FileLifecycleOptions
    ): Promise<FileLifecycleResult> {
        try {
            const fileExists = await this.fileExists(filePath);

            if (options.action === 'append' && fileExists) {
                const existingContent = await this.readFile(filePath);
                const updatedContent = existingContent + '\n\n' + content;
                await this.writeFile(filePath, updatedContent);

                return {
                    success: true,
                    action: 'appended',
                    filePath,
                    message: '✅ Content appended to documentation'
                };
            } else {
                await this.writeFile(filePath, content);
                return {
                    success: true,
                    action: fileExists ? 'replaced' : 'created',
                    filePath,
                    message: `✅ Documentation ${fileExists ? 'updated' : 'created'}`
                };
            }

        } catch (error) {
            throw new Error(`Documentation lifecycle failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get HEAVY user consent for manifesto deletion
     * CRITICAL: Multiple warnings and confirmations
     */
    private async getManifestoDeletionConsent(filePath: string): Promise<boolean> {
        try {
            // First warning
            const firstWarning = await vscode.window.showWarningMessage(
                '⚠️ CRITICAL: You are about to DELETE the existing manifesto!',
                { modal: true },
                'Continue', 'Cancel'
            );

            if (firstWarning !== 'Continue') {
                return false;
            }

            // Second warning with more details
            const secondWarning = await vscode.window.showWarningMessage(
                '🚨 FINAL WARNING: This will permanently replace your manifesto!\n\nThe manifesto is the CORE of your entire development process. This action cannot be undone easily.\n\nAre you absolutely sure?',
                { modal: true },
                'Yes, Replace Manifesto', 'No, Keep Existing'
            );

            if (secondWarning !== 'Yes, Replace Manifesto') {
                return false;
            }

            // Third confirmation with typing requirement
            const typedConfirmation = await vscode.window.showInputBox({
                prompt: 'Type "DELETE MANIFESTO" to confirm (case sensitive)',
                placeHolder: 'DELETE MANIFESTO',
                validateInput: (value) => {
                    return value === 'DELETE MANIFESTO' ? null : 'Must type exactly: DELETE MANIFESTO';
                }
            });

            return typedConfirmation === 'DELETE MANIFESTO';

        } catch (error) {
            console.error('Failed to get manifesto deletion consent:', error);
            return false;
        }
    }

    /**
     * Get simple confirmation for non-critical operations
     */
    private async getSimpleConfirmation(title: string, message: string): Promise<boolean> {
        try {
            const result = await vscode.window.showInformationMessage(
                message,
                { modal: true },
                'Yes', 'No'
            );
            return result === 'Yes';
        } catch (error) {
            console.error('Failed to get user confirmation:', error);
            return false;
        }
    }

    /**
     * Clean up old analysis files of the same type
     */
    private async cleanupOldAnalysisFiles(fileType: string): Promise<void> {
        try {
            const patterns = {
                'security-analysis': 'security-analysis-*.md',
                'code-review': 'code-review-*.md'
            };

            const pattern = patterns[fileType as keyof typeof patterns];
            if (!pattern) {
                return;
            }

            const files = await vscode.workspace.findFiles(pattern);
            for (const file of files) {
                try {
                    await vscode.workspace.fs.delete(file);
                    console.log(`🗑️ Cleaned up old ${fileType}: ${file.fsPath}`);
                } catch (error) {
                    console.warn(`Failed to clean up ${file.fsPath}:`, error);
                }
            }
        } catch (error) {
            console.warn(`Failed to clean up old ${fileType} files:`, error);
        }
    }

    /**
     * Merge JSON glossary content intelligently
     */
    private async mergeJsonGlossary(filePath: string, newContent: string): Promise<FileLifecycleResult> {
        try {
            const existingContent = await this.readFile(filePath);
            const existingGlossary = JSON.parse(existingContent);
            const newGlossary = JSON.parse(newContent);

            // Merge glossaries (new entries override existing ones)
            const mergedGlossary = { ...existingGlossary, ...newGlossary };
            const mergedContent = JSON.stringify(mergedGlossary, null, 2);

            await this.writeFile(filePath, mergedContent);

            return {
                success: true,
                action: 'merged',
                filePath,
                message: '✅ Glossary entries merged successfully'
            };
        } catch (error) {
            throw new Error(`JSON glossary merge failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // MANDATORY: File system utilities with comprehensive error handling
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            return true;
        } catch {
            return false;
        }
    }

    private async readFile(filePath: string): Promise<string> {
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            return Buffer.from(content).toString('utf8');
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async writeFile(filePath: string, content: string): Promise<void> {
        try {
            await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(content, 'utf8'));
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async deleteFile(filePath: string): Promise<void> {
        try {
            await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
        } catch (error) {
            throw new Error(`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async createBackup(filePath: string, prefix: string): Promise<string> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${filePath}.${prefix}.${timestamp}`;

            const content = await this.readFile(filePath);
            await this.writeFile(backupPath, content);

            return backupPath;
        } catch (error) {
            throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
