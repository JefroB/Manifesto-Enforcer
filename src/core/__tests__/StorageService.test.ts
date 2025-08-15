/**
 * StorageService Tests - TDD Implementation
 * Following manifesto: SOLID principles, comprehensive error handling, singleton pattern
 */

import * as vscode from 'vscode';
import { StorageService } from '../StorageService';

// Mock vscode module
jest.mock('vscode', () => ({
    workspace: {
        workspaceFolders: undefined,
        fs: {
            createDirectory: jest.fn()
        }
    },
    Uri: {
        file: jest.fn((path: string) => ({ fsPath: path }))
    }
}));

// Mock crypto module
jest.mock('crypto', () => ({
    createHash: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    }))
}));

describe('StorageService', () => {
    let mockContext: vscode.ExtensionContext;
    let mockWorkspaceFolder: vscode.WorkspaceFolder;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset singleton for testing
        (StorageService as any)._resetForTesting();

        // Mock ExtensionContext
        mockContext = {
            globalStorageUri: {
                fsPath: '/path/to/globalStorage'
            }
        } as any;

        // Mock WorkspaceFolder
        mockWorkspaceFolder = {
            uri: vscode.Uri.file('/Users/dev/my-project'),
            name: 'my-project',
            index: 0
        };
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance when called multiple times', () => {
            // Initialize first
            StorageService.initialize(mockContext);

            const instance1 = StorageService.getInstance();
            const instance2 = StorageService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should throw error if getInstance called before initialize', () => {
            // Reset singleton state if it exists
            (StorageService as any)._instance = undefined;
            
            expect(() => StorageService.getInstance()).toThrow('StorageService not initialized');
        });

        it('should initialize properly with ExtensionContext', () => {
            StorageService.initialize(mockContext);
            const instance = StorageService.getInstance();
            
            expect(instance).toBeDefined();
        });
    });

    describe('getProjectArtifactsPath', () => {
        beforeEach(() => {
            StorageService.initialize(mockContext);
            // Mock workspace folders
            (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];
        });

        it('should return path inside global storage with project hash', async () => {
            // This test will fail because the method doesn't exist yet
            const service = StorageService.getInstance();
            const fileName = 'manifesto.md';

            const result = await service.getProjectArtifactsPath(fileName);

            // Should be in global storage (normalize path separators)
            expect(result.replace(/\\/g, '/')).toContain('/path/to/globalStorage');
            // Should contain projects directory
            expect(result.replace(/\\/g, '/')).toContain('/projects/');
            // Should contain the filename
            expect(result).toContain(fileName);
            // Should contain a hash (64 char hex string for SHA256)
            expect(result.replace(/\\/g, '/')).toMatch(/\/projects\/[a-f0-9]{64}\//);
        });

        it('should create directory if it does not exist', async () => {
            const service = StorageService.getInstance();
            const fileName = 'glossary.json';
            
            await service.getProjectArtifactsPath(fileName);
            
            expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
        });

        it('should return consistent paths for same workspace', async () => {
            const service = StorageService.getInstance();
            
            const path1 = await service.getProjectArtifactsPath('file1.md');
            const path2 = await service.getProjectArtifactsPath('file2.json');
            
            // Should have same project hash directory
            const dir1 = path1.substring(0, path1.lastIndexOf('/'));
            const dir2 = path2.substring(0, path2.lastIndexOf('/'));
            expect(dir1).toBe(dir2);
        });

        it('should throw error when no workspace is open', async () => {
            // Mock no workspace folders
            (vscode.workspace as any).workspaceFolders = undefined;
            
            const service = StorageService.getInstance();
            
            await expect(service.getProjectArtifactsPath('test.md'))
                .rejects.toThrow('No workspace folder is currently open');
        });

        it('should throw error when workspace folders is empty array', async () => {
            // Mock empty workspace folders
            (vscode.workspace as any).workspaceFolders = [];
            
            const service = StorageService.getInstance();
            
            await expect(service.getProjectArtifactsPath('test.md'))
                .rejects.toThrow('No workspace folder is currently open');
        });
    });
});
