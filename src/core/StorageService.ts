/**
 * StorageService - Centralized file storage management
 * Following manifesto: SOLID principles, singleton pattern, comprehensive error handling
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Singleton service responsible for providing all file paths for project artifacts.
 * Project-specific artifacts (manifestos, glossaries) are stored in VS Code's global storage
 * with a separate subdirectory for each project to prevent conflicts.
 */
export class StorageService {
    private static _instance: StorageService | undefined;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Initialize the StorageService singleton with ExtensionContext
     * MANDATORY: Must be called before getInstance() (manifesto requirement)
     */
    public static initialize(context: vscode.ExtensionContext): void {
        if (StorageService._instance) {
            throw new Error('StorageService already initialized');
        }
        StorageService._instance = new StorageService(context);
    }

    /**
     * Get the singleton instance
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public static getInstance(): StorageService {
        if (!StorageService._instance) {
            throw new Error('StorageService not initialized. Call initialize() first.');
        }
        return StorageService._instance;
    }

    /**
     * Get the path for project artifacts (manifestos, glossaries, etc.)
     * Returns a path inside the global storage directory with a unique project identifier
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async getProjectArtifactsPath(fileName: string): Promise<string> {
        try {
            // Validate input
            if (!fileName || typeof fileName !== 'string') {
                throw new Error('fileName must be a non-empty string');
            }

            // Get workspace root path
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder is currently open');
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;

            // Create a stable, unique ID for the workspace using SHA256 hash
            const workspaceHash = crypto
                .createHash('sha256')
                .update(workspaceRoot)
                .digest('hex');

            // Get global storage path
            const globalStoragePath = this.context.globalStorageUri.fsPath;

            // Construct the project-specific directory path
            const projectStorageDir = path.join(globalStoragePath, 'projects', workspaceHash);

            // Ensure the directory exists
            const projectStorageDirUri = vscode.Uri.file(projectStorageDir);
            await vscode.workspace.fs.createDirectory(projectStorageDirUri);

            // Return the full file path
            return path.join(projectStorageDir, fileName);

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get project artifacts path: ${errorMessage}`);
        }
    }

    /**
     * Reset singleton instance (for testing purposes only)
     * CRITICAL: Should only be used in test environments
     */
    public static _resetForTesting(): void {
        StorageService._instance = undefined;
    }
}
