/**
 * Piggie Directory Manager - Handles Piggie's file system operations
 * Following manifesto: comprehensive error handling, input validation, security
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';

export class PiggieDirectoryManager {
    private static readonly PIGGIE_DIR_NAME = '.piggie';
    private static readonly GITIGNORE_ENTRY = '\n# Piggie extension files\n.piggie/\n';

    private workspaceRoot: string;
    private piggieDir: string;
    private backupCounter: number = 0;

    constructor(workspaceRoot: string) {
        // MANDATORY: Input validation
        if (!workspaceRoot || typeof workspaceRoot !== 'string') {
            throw new Error('Invalid workspace root: must be non-empty string');
        }
        
        this.workspaceRoot = workspaceRoot;
        this.piggieDir = path.join(workspaceRoot, PiggieDirectoryManager.PIGGIE_DIR_NAME);
    }

    /**
     * Initialize Piggie directory and ensure it's gitignored
     * MANDATORY: Comprehensive error handling
     */
    public async initialize(): Promise<void> {
        try {
            // Create .piggie directory if it doesn't exist
            await this.ensurePiggieDirectory();
            
            // Ensure .piggie is in .gitignore
            await this.ensureGitignoreEntry();
            
            console.log('🐷 Piggie directory initialized successfully');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
            throw new Error(`Failed to initialize Piggie directory: ${errorMessage}`);
        }
    }

    /**
     * Get path to Piggie directory
     */
    public getPiggieDirectory(): string {
        return this.piggieDir;
    }

    /**
     * Get path for a file within Piggie directory
     */
    public getPiggiePath(filename: string): string {
        // CRITICAL: Validate filename to prevent path traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new Error('Invalid filename: must be simple filename without path separators');
        }
        
        return path.join(this.piggieDir, filename);
    }

    /**
     * Create backup file in Piggie directory
     */
    public async createBackup(originalPath: string, content: string): Promise<string> {
        try {
            // MANDATORY: Input validation
            if (!originalPath || !content) {
                throw new Error('Invalid backup parameters: originalPath and content are required');
            }

            await this.ensurePiggieDirectory();

            const filename = path.basename(originalPath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const counter = ++this.backupCounter;
            const backupFilename = `${filename}.backup.${timestamp}.${counter}`;
            const backupPath = this.getPiggiePath(backupFilename);

            await fs.writeFile(backupPath, content, 'utf8');
            
            console.log(`📁 Backup created: ${backupFilename}`);
            return backupPath;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown backup error';
            throw new Error(`Failed to create backup: ${errorMessage}`);
        }
    }

    /**
     * Clean up old backup files (keep only last N backups per file)
     */
    public async cleanupOldBackups(maxBackupsPerFile: number = 5): Promise<void> {
        try {
            await this.ensurePiggieDirectory();
            
            const files = await fs.readdir(this.piggieDir);
            const backupFiles = files.filter(f => f.includes('.backup.'));
            
            // Group backups by original filename
            const backupGroups = new Map<string, string[]>();
            
            for (const file of backupFiles) {
                const originalName = file.split('.backup.')[0];
                if (!backupGroups.has(originalName)) {
                    backupGroups.set(originalName, []);
                }
                backupGroups.get(originalName)!.push(file);
            }
            
            // Clean up old backups for each file
            for (const [originalName, backups] of backupGroups) {
                if (backups.length > maxBackupsPerFile) {
                    // Sort by timestamp (newest first)
                    backups.sort((a, b) => b.localeCompare(a));
                    
                    // Delete old backups
                    const toDelete = backups.slice(maxBackupsPerFile);
                    for (const backup of toDelete) {
                        await fs.unlink(path.join(this.piggieDir, backup));
                        console.log(`🗑️ Cleaned up old backup: ${backup}`);
                    }
                }
            }
            
        } catch (error) {
            // For cleanup operations, log but don't throw - cleanup failures shouldn't break the app
            console.warn('Failed to cleanup old backups:', error);
            // Only throw if it's a critical error like directory access failure or permission issues
            if (error instanceof Error && (
                error.message.includes('ENOENT') ||
                error.message.includes('Permission denied') ||
                error.message.includes('EACCES')
            )) {
                throw new Error(`Failed to cleanup old backups: ${error.message}`);
            }
        }
    }

    /**
     * Ensure .piggie directory exists
     */
    private async ensurePiggieDirectory(): Promise<void> {
        try {
            await fs.access(this.piggieDir);
        } catch {
            // Directory doesn't exist, create it
            await fs.mkdir(this.piggieDir, { recursive: true });
            console.log('📁 Created .piggie directory');
        }
    }

    /**
     * Ensure .piggie is in .gitignore
     */
    private async ensureGitignoreEntry(): Promise<void> {
        const gitignorePath = path.join(this.workspaceRoot, '.gitignore');

        let gitignoreContent = '';
        try {
            gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        } catch (readError) {
            // .gitignore doesn't exist, will create it
            // Only ignore ENOENT errors, re-throw others (like permission errors)
            if (readError instanceof Error && !readError.message.includes('ENOENT')) {
                throw readError;
            }
        }

        // Check if .piggie is already in .gitignore
        if (!gitignoreContent.includes('.piggie/')) {
            gitignoreContent += PiggieDirectoryManager.GITIGNORE_ENTRY;
            try {
                await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
                console.log('📝 Added .piggie/ to .gitignore');
            } catch (writeError) {
                // Re-throw write errors as they indicate serious issues
                throw writeError;
            }
        }
    }
}
