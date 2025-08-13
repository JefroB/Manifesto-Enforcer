/**
 * 🐐 GOAT PiggieDirectoryManager Tests - Industry Leading Quality
 * Following manifesto: COMPREHENSIVE coverage, BULLETPROOF error handling, EVERY edge case
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { PiggieDirectoryManager } from '../PiggieDirectoryManager';

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        mkdir: jest.fn(),
        readdir: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        unlink: jest.fn(),
        stat: jest.fn()
    }
}));

// Mock path module
jest.mock('path');

describe('🐐 GOAT PiggieDirectoryManager Tests - Industry Leading Quality', () => {
    let piggieManager: PiggieDirectoryManager;
    let mockWorkspaceRoot: string;
    
    // 🎯 PERFECT MOCKS
    const mockFs = fs as jest.Mocked<typeof fs>;
    const mockPath = path as jest.Mocked<typeof path>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        mockWorkspaceRoot = '/test/workspace';
        
        // Setup path mocks
        mockPath.join.mockImplementation((...args) => args.join('/'));
        mockPath.basename.mockImplementation((p) => p.split('/').pop() || '');
        mockPath.extname.mockImplementation((p) => {
            const parts = p.split('.');
            return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
        });
        
        // Default successful mocks
        mockFs.access.mockResolvedValue(undefined);
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue([] as any);
        mockFs.readFile.mockResolvedValue('');
        mockFs.writeFile.mockResolvedValue(undefined);
        mockFs.unlink.mockResolvedValue(undefined);
        mockFs.stat.mockResolvedValue({ 
            mtime: new Date('2023-01-01'),
            isFile: () => true 
        } as any);
    });

    describe('🎯 Constructor - BULLETPROOF Validation', () => {
        it('should create instance with valid workspace root', () => {
            try {
                piggieManager = new PiggieDirectoryManager(mockWorkspaceRoot);
                expect(piggieManager).toBeInstanceOf(PiggieDirectoryManager);
                expect(piggieManager.getPiggieDirectory()).toBe('/test/workspace/.piggie');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should throw error for null workspace root', () => {
            try {
                expect(() => new PiggieDirectoryManager(null as any)).toThrow('Invalid workspace root');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should throw error for undefined workspace root', () => {
            try {
                expect(() => new PiggieDirectoryManager(undefined as any)).toThrow('Invalid workspace root');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should throw error for empty string workspace root', () => {
            try {
                expect(() => new PiggieDirectoryManager('')).toThrow('Invalid workspace root');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should throw error for non-string workspace root', () => {
            try {
                expect(() => new PiggieDirectoryManager(123 as any)).toThrow('Invalid workspace root');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('🎯 Initialize - COMPREHENSIVE Coverage', () => {
        beforeEach(() => {
            piggieManager = new PiggieDirectoryManager(mockWorkspaceRoot);
        });

        it('should initialize successfully when directory exists', async () => {
            try {
                mockFs.access.mockResolvedValue(undefined);
                mockFs.readFile.mockResolvedValue('.piggie/\n');

                await piggieManager.initialize();

                expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/.piggie');
                expect(mockFs.readFile).toHaveBeenCalledWith('/test/workspace/.gitignore', 'utf8');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should create directory when it does not exist', async () => {
            try {
                mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));
                mockFs.readFile.mockResolvedValue('');

                await piggieManager.initialize();

                expect(mockFs.mkdir).toHaveBeenCalledWith('/test/workspace/.piggie', { recursive: true });
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should create .gitignore when it does not exist', async () => {
            try {
                mockFs.readFile.mockRejectedValueOnce(new Error('ENOENT'));

                await piggieManager.initialize();

                expect(mockFs.writeFile).toHaveBeenCalledWith(
                    '/test/workspace/.gitignore',
                    expect.stringContaining('.piggie/'),
                    'utf8'
                );
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should add .piggie to existing .gitignore', async () => {
            try {
                mockFs.readFile.mockResolvedValue('node_modules/\n*.log\n');

                await piggieManager.initialize();

                expect(mockFs.writeFile).toHaveBeenCalledWith(
                    '/test/workspace/.gitignore',
                    expect.stringContaining('node_modules/'),
                    'utf8'
                );
                expect(mockFs.writeFile).toHaveBeenCalledWith(
                    '/test/workspace/.gitignore',
                    expect.stringContaining('.piggie/'),
                    'utf8'
                );
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should not duplicate .piggie entry in .gitignore', async () => {
            try {
                mockFs.readFile.mockResolvedValue('node_modules/\n.piggie/\n*.log\n');

                await piggieManager.initialize();

                // Should not write to .gitignore since .piggie is already there
                expect(mockFs.writeFile).not.toHaveBeenCalledWith(
                    '/test/workspace/.gitignore',
                    expect.anything(),
                    'utf8'
                );
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle directory creation failures gracefully', async () => {
            try {
                mockFs.access.mockRejectedValue(new Error('ENOENT'));
                mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

                await expect(piggieManager.initialize()).rejects.toThrow('Failed to initialize Piggie directory');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle .gitignore write failures gracefully', async () => {
            try {
                mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
                mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

                await expect(piggieManager.initialize()).rejects.toThrow('Failed to initialize Piggie directory');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('🎯 Path Operations - SECURITY First', () => {
        beforeEach(() => {
            piggieManager = new PiggieDirectoryManager(mockWorkspaceRoot);
        });

        it('should return correct Piggie directory path', () => {
            try {
                const result = piggieManager.getPiggieDirectory();
                expect(result).toBe('/test/workspace/.piggie');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should return correct path for valid filename', () => {
            try {
                const result = piggieManager.getPiggiePath('test.txt');
                expect(result).toBe('/test/workspace/.piggie/test.txt');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should reject path traversal attempts with ..', () => {
            try {
                expect(() => piggieManager.getPiggiePath('../evil.txt')).toThrow('Invalid filename');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should reject path traversal attempts with /', () => {
            try {
                expect(() => piggieManager.getPiggiePath('subdir/evil.txt')).toThrow('Invalid filename');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should reject path traversal attempts with \\', () => {
            try {
                expect(() => piggieManager.getPiggiePath('subdir\\evil.txt')).toThrow('Invalid filename');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should reject empty filename', () => {
            try {
                expect(() => piggieManager.getPiggiePath('')).toThrow('Invalid filename');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should reject null filename', () => {
            try {
                expect(() => piggieManager.getPiggiePath(null as any)).toThrow('Invalid filename');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('🎯 Backup Operations - BULLETPROOF', () => {
        beforeEach(() => {
            piggieManager = new PiggieDirectoryManager(mockWorkspaceRoot);
        });

        it('should create backup successfully', async () => {
            try {
                const originalPath = '/test/workspace/src/file.ts';
                const content = 'console.log("test");';

                const backupPath = await piggieManager.createBackup(originalPath, content);

                expect(backupPath).toContain('.piggie');
                expect(backupPath).toContain('file.ts.backup.');
                expect(mockFs.writeFile).toHaveBeenCalledWith(
                    expect.stringContaining('file.ts.backup.'),
                    content,
                    'utf8'
                );
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle backup creation with empty content', async () => {
            try {
                const originalPath = '/test/workspace/src/file.ts';
                const content = '';

                await expect(piggieManager.createBackup(originalPath, content))
                    .rejects.toThrow('Invalid backup parameters');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle backup creation with null originalPath', async () => {
            try {
                await expect(piggieManager.createBackup(null as any, 'content'))
                    .rejects.toThrow('Invalid backup parameters');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle backup creation failures gracefully', async () => {
            try {
                mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

                await expect(piggieManager.createBackup('/test/file.ts', 'content'))
                    .rejects.toThrow('Failed to create backup');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should generate unique backup filenames', async () => {
            try {
                const originalPath = '/test/workspace/src/file.ts';
                const content = 'test content';

                const backup1 = await piggieManager.createBackup(originalPath, content);
                const backup2 = await piggieManager.createBackup(originalPath, content);

                expect(backup1).not.toBe(backup2);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('🎯 Cleanup Operations - COMPREHENSIVE', () => {
        beforeEach(() => {
            piggieManager = new PiggieDirectoryManager(mockWorkspaceRoot);
        });

        it('should cleanup old backups keeping specified number', async () => {
            try {
                const mockFiles = [
                    'file.ts.backup.1640995200000',
                    'file.ts.backup.1640995300000',
                    'file.ts.backup.1640995400000',
                    'file.ts.backup.1640995500000',
                    'file.ts.backup.1640995600000',
                    'file.ts.backup.1640995700000', // Should be kept (newest)
                    'other.js.backup.1640995800000'
                ];

                mockFs.readdir.mockResolvedValue(mockFiles as any);
                mockFs.stat.mockImplementation((filePath) => {
                    const filename = filePath.toString().split('/').pop() || '';
                    const timestamp = parseInt(filename.split('.').pop() || '0');
                    return Promise.resolve({
                        mtime: new Date(timestamp),
                        isFile: () => true
                    } as any);
                });

                await piggieManager.cleanupOldBackups(3);

                // Should delete 3 oldest backups for file.ts (keep 3 newest)
                expect(mockFs.unlink).toHaveBeenCalledTimes(3);
                expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('1640995200000'));
                expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('1640995300000'));
                expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('1640995400000'));
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle cleanup when no backups exist', async () => {
            try {
                mockFs.readdir.mockResolvedValue([] as any);

                await piggieManager.cleanupOldBackups(5);

                expect(mockFs.unlink).not.toHaveBeenCalled();
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle cleanup failures gracefully', async () => {
            try {
                mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

                await expect(piggieManager.cleanupOldBackups(5))
                    .rejects.toThrow('Failed to cleanup old backups');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle file deletion failures gracefully', async () => {
            try {
                const mockFiles = [
                    'file.ts.backup.1640995200000',
                    'file.ts.backup.1640995300000',
                    'file.ts.backup.1640995400000'
                ];

                mockFs.readdir.mockResolvedValue(mockFiles as any);
                mockFs.stat.mockResolvedValue({
                    mtime: new Date(),
                    isFile: () => true
                } as any);
                mockFs.unlink.mockRejectedValue(new Error('File in use'));

                // Should not throw, just log and continue
                await piggieManager.cleanupOldBackups(1);

                expect(mockFs.unlink).toHaveBeenCalled();
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should use default maxBackupsPerFile when not specified', async () => {
            try {
                const mockFiles = Array.from({ length: 10 }, (_, i) =>
                    `file.ts.backup.${1640995200000 + i * 1000}`
                );

                mockFs.readdir.mockResolvedValue(mockFiles as any);
                mockFs.stat.mockImplementation((filePath) => {
                    const filename = filePath.toString().split('/').pop() || '';
                    const timestamp = parseInt(filename.split('.').pop() || '0');
                    return Promise.resolve({
                        mtime: new Date(timestamp),
                        isFile: () => true
                    } as any);
                });

                await piggieManager.cleanupOldBackups(); // Default should be 5

                // Should delete 5 oldest backups (keep 5 newest)
                expect(mockFs.unlink).toHaveBeenCalledTimes(5);
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });

    describe('🎯 Edge Cases - NO STONE UNTURNED', () => {
        beforeEach(() => {
            piggieManager = new PiggieDirectoryManager(mockWorkspaceRoot);
        });

        it('should handle concurrent initialization attempts', async () => {
            try {
                const promises = Array(5).fill(0).map(() => piggieManager.initialize());

                await Promise.all(promises);

                // Should not throw errors
                expect(mockFs.access).toHaveBeenCalled();
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle very long workspace paths', async () => {
            try {
                const longPath = '/very/long/path/that/exceeds/normal/limits/and/tests/edge/cases/in/file/system/operations';
                const manager = new PiggieDirectoryManager(longPath);

                expect(manager.getPiggieDirectory()).toContain('.piggie');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle special characters in workspace path', async () => {
            try {
                const specialPath = '/test/workspace with spaces/and-dashes/under_scores';
                const manager = new PiggieDirectoryManager(specialPath);

                expect(manager.getPiggieDirectory()).toContain('.piggie');
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });

        it('should handle memory pressure scenarios', async () => {
            try {
                // Simulate large number of backup files
                const largeFileList = Array.from({ length: 1000 }, (_, i) =>
                    `file${i}.ts.backup.${Date.now() + i}`
                );

                mockFs.readdir.mockResolvedValue(largeFileList as any);
                mockFs.stat.mockResolvedValue({
                    mtime: new Date(),
                    isFile: () => true
                } as any);

                await piggieManager.cleanupOldBackups(10);

                // Should handle large file lists without issues
                expect(mockFs.readdir).toHaveBeenCalled();
            } catch (error) {
                expect(error).toBeUndefined();
            }
        });
    });
});
