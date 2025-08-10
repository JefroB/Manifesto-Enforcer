import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../core/StateManager';

/**
 * Provides interactive diff functionality for AI-suggested code changes
 * Implements the Traditional UI part of the Duality Principle
 */
export class InteractiveDiffProvider {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, private stateManager: StateManager) {
        this.context = context;
    }

    /**
     * Show a diff view comparing original and AI-suggested code
     * This is the Traditional UI access point for code changes
     */
    async showDiff(
        originalContent: string,
        suggestedContent: string,
        fileName: string,
        description: string
    ): Promise<boolean> {
        try {
            // Create temporary files for diff comparison
            const tempDir = path.join(this.context.globalStorageUri.fsPath, 'diffs');
            await fs.promises.mkdir(tempDir, { recursive: true });

            const originalFile = path.join(tempDir, `${fileName}.original`);
            const suggestedFile = path.join(tempDir, `${fileName}.suggested`);

            // Write content to temporary files
            await fs.promises.writeFile(originalFile, originalContent, 'utf8');
            await fs.promises.writeFile(suggestedFile, suggestedContent, 'utf8');

            // Create URIs for the diff
            const originalUri = vscode.Uri.file(originalFile);
            const suggestedUri = vscode.Uri.file(suggestedFile);

            // Show the diff in VS Code
            await vscode.commands.executeCommand(
                'vscode.diff',
                originalUri,
                suggestedUri,
                `${description} - ${fileName}`,
                {
                    preview: true,
                    preserveFocus: false
                }
            );

            // Show action buttons
            const action = await vscode.window.showInformationMessage(
                `Review the suggested changes for ${fileName}`,
                {
                    modal: true,
                    detail: description
                },
                'Apply Changes',
                'Reject Changes',
                'Edit Manually'
            );

            // Clean up temporary files
            try {
                await fs.promises.unlink(originalFile);
                await fs.promises.unlink(suggestedFile);
            } catch (cleanupError) {
                console.warn('Failed to clean up temp files:', cleanupError);
            }

            if (action === 'Apply Changes') {
                return await this.applyChanges(fileName, suggestedContent);
            } else if (action === 'Edit Manually') {
                return await this.openForManualEdit(fileName, suggestedContent);
            }

            return false; // Changes rejected

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show diff: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    /**
     * Apply the suggested changes to the actual file
     */
    private async applyChanges(fileName: string, newContent: string): Promise<boolean> {
        try {
            // Find the actual file in the workspace
            const files = await vscode.workspace.findFiles(`**/${fileName}`);
            if (files.length === 0) {
                vscode.window.showErrorMessage(`File ${fileName} not found in workspace`);
                return false;
            }

            const fileUri = files[0]; // Use first match
            const document = await vscode.workspace.openTextDocument(fileUri);
            
            // Apply the changes
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            edit.replace(fileUri, fullRange, newContent);

            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                // Save the file
                await document.save();
                vscode.window.showInformationMessage(`✅ Changes applied to ${fileName}`);
                
                // Open the file to show the changes
                await vscode.window.showTextDocument(document);
                return true;
            } else {
                vscode.window.showErrorMessage(`Failed to apply changes to ${fileName}`);
                return false;
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Error applying changes: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    /**
     * Open the file for manual editing with suggested content in a new editor
     */
    private async openForManualEdit(fileName: string, suggestedContent: string): Promise<boolean> {
        try {
            // Create a new untitled document with the suggested content
            const document = await vscode.workspace.openTextDocument({
                content: suggestedContent,
                language: this.getLanguageFromFileName(fileName)
            });

            await vscode.window.showTextDocument(document);
            
            vscode.window.showInformationMessage(
                `Opened suggested changes for manual editing. Save as ${fileName} when ready.`
            );
            
            return true;

        } catch (error) {
            vscode.window.showErrorMessage(`Error opening for manual edit: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    /**
     * Determine the language ID from file extension
     */
    private getLanguageFromFileName(fileName: string): string {
        const ext = path.extname(fileName).toLowerCase();
        const languageMap: { [key: string]: string } = {
            '.ts': 'typescript',
            '.js': 'javascript',
            '.tsx': 'typescriptreact',
            '.jsx': 'javascriptreact',
            '.py': 'python',
            '.java': 'java',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.md': 'markdown',
            '.json': 'json',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less'
        };

        return languageMap[ext] || 'plaintext';
    }

    /**
     * Show a quick diff preview in a new editor (alternative method)
     */
    async showQuickDiff(
        originalContent: string,
        suggestedContent: string,
        fileName: string
    ): Promise<void> {
        try {
            // Create a diff document
            const diffContent = this.createDiffContent(originalContent, suggestedContent, fileName);
            
            const document = await vscode.workspace.openTextDocument({
                content: diffContent,
                language: 'diff'
            });

            await vscode.window.showTextDocument(document, {
                preview: true,
                preserveFocus: false
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show quick diff: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create a unified diff format content
     */
    private createDiffContent(original: string, suggested: string, fileName: string): string {
        const originalLines = original.split('\n');
        const suggestedLines = suggested.split('\n');
        
        let diff = `--- ${fileName} (original)\n`;
        diff += `+++ ${fileName} (suggested)\n`;
        diff += `@@ -1,${originalLines.length} +1,${suggestedLines.length} @@\n`;
        
        // Simple line-by-line diff (could be enhanced with proper diff algorithm)
        const maxLines = Math.max(originalLines.length, suggestedLines.length);
        
        for (let i = 0; i < maxLines; i++) {
            const originalLine = originalLines[i];
            const suggestedLine = suggestedLines[i];
            
            if (originalLine === undefined) {
                diff += `+${suggestedLine}\n`;
            } else if (suggestedLine === undefined) {
                diff += `-${originalLine}\n`;
            } else if (originalLine !== suggestedLine) {
                diff += `-${originalLine}\n`;
                diff += `+${suggestedLine}\n`;
            } else {
                diff += ` ${originalLine}\n`;
            }
        }
        
        return diff;
    }
}
