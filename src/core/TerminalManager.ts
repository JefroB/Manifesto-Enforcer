import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * TerminalManager - Centralized terminal execution for code snippets
 * Handles file creation, terminal management, and code execution
 * MANDATORY: Comprehensive error handling and input validation (manifesto requirement)
 */
export class TerminalManager {
    
    /**
     * Execute code in a VSCode terminal with comprehensive error handling
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     * 
     * @param code - The code to execute
     * @param language - The programming language
     * @returns Promise resolving to success message
     */
    public static async executeScriptInTerminal(code: string, language: string): Promise<string> {
        try {
            // CRITICAL: Input validation
            if (!code || typeof code !== 'string') {
                throw new Error('Invalid code provided for execution');
            }

            if (!language || typeof language !== 'string') {
                throw new Error('Invalid language provided for execution');
            }

            // Get workspace root
            const workspaceRoot = this.getWorkspaceRoot();
            
            // Create .piggie directory
            const piggieDir = path.join(workspaceRoot, '.piggie');
            await this.ensureDirectoryExists(piggieDir);

            // Generate filename and write code
            const filename = this.generateFilename(language);
            const filePath = path.join(piggieDir, filename);
            
            await fs.writeFile(filePath, code, 'utf8');

            // Create and configure terminal
            const terminal = vscode.window.createTerminal({
                name: 'Piggie Script Runner',
                cwd: workspaceRoot
            });

            // Generate execution command
            const command = this.getExecutionCommand(language, path.relative(workspaceRoot, filePath));
            
            // Execute in terminal
            terminal.show();
            terminal.sendText(command);

            return `🚀 **Code Executed Successfully**\n\n` +
                   `📁 **File**: \`${filename}\`\n` +
                   `💻 **Language**: ${language}\n` +
                   `⚡ **Command**: \`${command}\`\n\n` +
                   `✅ Script is now running in the "Piggie Script Runner" terminal!`;

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
            console.error('TerminalManager.executeScriptInTerminal failed:', error);
            throw new Error(`Code execution failed: ${errorMessage}`);
        }
    }

    /**
     * Perform safety check on code to determine if auto-execution is safe
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     * 
     * @param code - The code to analyze
     * @param language - The programming language
     * @returns boolean indicating if code is safe for auto-execution
     */
    public static isCodeSafeForAutoExecution(code: string, language: string): boolean {
        try {
            if (!code || !language) {
                return false;
            }

            const normalizedCode = code.toLowerCase();
            const normalizedLanguage = language.toLowerCase();

            // Define dangerous patterns by language
            const dangerousPatterns = this.getDangerousPatterns(normalizedLanguage);
            
            // Check for dangerous patterns
            for (const pattern of dangerousPatterns) {
                if (normalizedCode.includes(pattern)) {
                    console.log(`🚨 Unsafe code detected: contains "${pattern}"`);
                    return false;
                }
            }

            // Additional heuristics
            if (this.containsSuspiciousPatterns(normalizedCode)) {
                return false;
            }

            return true;

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Safety check failed:', error);
            return false; // Fail safe - if we can't check, don't auto-execute
        }
    }

    /**
     * Get dangerous patterns for a specific language
     */
    private static getDangerousPatterns(language: string): string[] {
        const commonDangerous = [
            'rm -rf', 'del /f', 'format c:', 'sudo rm',
            'exec(', 'eval(', 'system(', 'shell_exec(',
            'process.exit', 'os.system', 'subprocess.',
            'import os', 'require("fs")', 'require("child_process")',
            'require("path")', 'fs.unlink', 'fs.rmdir',
            'child_process.exec', 'spawn(', 'fork('
        ];

        const languageSpecific: Record<string, string[]> = {
            'javascript': [
                'require("fs")', 'require("child_process")', 'require("os")',
                'fs.unlink', 'fs.rmdir', 'process.env', 'process.cwd',
                'child_process', '__dirname', '__filename'
            ],
            'typescript': [
                'import * as fs', 'import fs', 'import { exec }',
                'import child_process', 'process.env', 'fs.unlink'
            ],
            'python': [
                'import os', 'import sys', 'import subprocess',
                'os.system', 'os.remove', 'shutil.rmtree',
                'subprocess.call', 'subprocess.run', '__import__'
            ],
            'bash': [
                'rm -', 'sudo', 'chmod', 'chown', 'mv /',
                'cp /', '> /', 'curl', 'wget', 'ssh'
            ],
            'sh': [
                'rm -', 'sudo', 'chmod', 'chown', 'mv /',
                'cp /', '> /', 'curl', 'wget', 'ssh'
            ]
        };

        return [...commonDangerous, ...(languageSpecific[language] || [])];
    }

    /**
     * Check for additional suspicious patterns
     */
    private static containsSuspiciousPatterns(code: string): boolean {
        const suspiciousPatterns = [
            // Network operations
            'http://', 'https://', 'fetch(', 'axios.', 'request(',
            // File system operations
            'write', 'delete', 'remove', 'unlink', 'mkdir', 'rmdir',
            // Process operations
            'kill', 'terminate', 'exit', 'quit',
            // Environment access
            'env', 'environment', 'getenv', 'setenv'
        ];

        let suspiciousCount = 0;
        for (const pattern of suspiciousPatterns) {
            if (code.includes(pattern)) {
                suspiciousCount++;
            }
        }

        // If more than 2 suspicious patterns, consider unsafe
        return suspiciousCount > 2;
    }

    /**
     * Generate appropriate filename for the language
     */
    private static generateFilename(language: string): string {
        const extensions: Record<string, string> = {
            'javascript': '.js',
            'js': '.js',
            'typescript': '.ts',
            'ts': '.ts',
            'python': '.py',
            'py': '.py',
            'java': '.java',
            'c': '.c',
            'cpp': '.cpp',
            'go': '.go',
            'rust': '.rs',
            'php': '.php',
            'bash': '.sh',
            'sh': '.sh'
        };

        const extension = extensions[language.toLowerCase()] || '.txt';
        const timestamp = Date.now();
        return `piggie_exec_${timestamp}${extension}`;
    }

    /**
     * Get execution command for different languages
     */
    private static getExecutionCommand(language: string, filePath: string): string {
        // Platform-aware Python command - Mac typically uses python3
        const pythonCmd = process.platform === 'darwin' ? 'python3' : 'python';

        const commands: Record<string, string> = {
            'javascript': `node "${filePath}"`,
            'js': `node "${filePath}"`,
            'typescript': `npx ts-node "${filePath}"`,
            'ts': `npx ts-node "${filePath}"`,
            'python': `${pythonCmd} "${filePath}"`,
            'py': `${pythonCmd} "${filePath}"`,
            'bash': `bash "${filePath}"`,
            'sh': `bash "${filePath}"`,
            'java': `javac "${filePath}" && java ${path.basename(filePath, '.java')}`,
            'go': `go run "${filePath}"`,
            'php': `php "${filePath}"`
        };

        return commands[language.toLowerCase()] || `echo "Unsupported language: ${language}"`;
    }

    /**
     * Get workspace root path
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private static getWorkspaceRoot(): string {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder found');
            }
            return workspaceFolders[0].uri.fsPath;
        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Failed to get workspace root:', error);
            throw new Error('Cannot execute code without a workspace folder');
        }
    }

    /**
     * Ensure directory exists, create if necessary
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private static async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            const errorMessage = error instanceof Error ? error.message : 'Unknown directory error';
            console.error('Failed to create directory:', error);
            throw new Error(`Directory creation failed: ${errorMessage}`);
        }
    }
}
