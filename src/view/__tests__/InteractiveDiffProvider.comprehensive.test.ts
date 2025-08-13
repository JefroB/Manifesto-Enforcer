/**
 * Comprehensive Tests for InteractiveDiffProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

// Mock path module BEFORE importing the module that uses it
const mockPath = {
    extname: jest.fn((fileName: string) => {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot >= 0 ? fileName.substring(lastDot) : '';
    }),
    join: jest.fn().mockImplementation((...args) => args.join('/')),
    basename: jest.fn().mockImplementation((p) => p.split('/').pop())
};

jest.doMock('path', () => mockPath);

import { InteractiveDiffProvider } from '../InteractiveDiffProvider';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Mock vscode module
jest.mock('vscode', () => ({
    commands: {
        executeCommand: jest.fn()
    },
    window: {
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showTextDocument: jest.fn()
    },
    workspace: {
        findFiles: jest.fn(),
        openTextDocument: jest.fn(),
        applyEdit: jest.fn(),
        fs: {
            writeFile: jest.fn(),
            readFile: jest.fn()
        }
    },
    Uri: {
        file: jest.fn().mockImplementation((path: string) => ({ fsPath: path, path }))
    },
    ViewColumn: {
        One: 1,
        Two: 2,
        Beside: -2
    },
    Range: jest.fn().mockImplementation((start, end) => ({ start, end })),
    WorkspaceEdit: jest.fn().mockImplementation(() => ({
        replace: jest.fn()
    })),
    Position: jest.fn().mockImplementation((line, character) => ({ line, character }))
}));

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        unlink: jest.fn(),
        readFile: jest.fn()
    }
}));

// Mock path module
jest.mock('path', () => ({
    join: jest.fn().mockImplementation((...args: string[]) => args.join('/')),
    dirname: jest.fn().mockImplementation((p: string) => p.split('/').slice(0, -1).join('/'))
}));

describe('InteractiveDiffProvider', () => {
    let provider: InteractiveDiffProvider;
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock context
        mockContext = {
            globalStorageUri: {
                fsPath: '/test/storage'
            }
        } as any;

        // Create mock StateManager
        const mockStateManager = {} as any;

        provider = new InteractiveDiffProvider(mockContext, mockStateManager);
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with extension context', () => {
            expect(provider).toBeDefined();
            expect((provider as any).context).toBe(mockContext);
        });

        it('should handle missing context gracefully', () => {
            expect(() => {
                new InteractiveDiffProvider(undefined as any, {} as any);
            }).not.toThrow();
        });
    });

    describe('showDiff', () => {
        const originalContent = 'function test() {\n  return "original";\n}';
        const suggestedContent = 'function test() {\n  return "suggested";\n}';
        const fileName = 'test.js';
        const description = 'Update function return value';

        beforeEach(() => {
            // Mock successful file operations
            (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
            (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            // Mock VSCode workspace APIs
            (vscode.workspace.findFiles as jest.Mock).mockResolvedValue([]);
            (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('test content'));
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
            (vscode.window.showTextDocument as jest.Mock).mockResolvedValue(undefined);
            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);
        });

        it('should create diff view successfully', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Apply Changes');
            
            const applyChangesSpy = jest.spyOn(provider as any, 'applyChanges').mockResolvedValue(true);
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(true);
            expect(fs.promises.mkdir).toHaveBeenCalledWith('/test/storage/diffs', { recursive: true });
            expect(fs.promises.writeFile).toHaveBeenCalledTimes(2);
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'vscode.diff',
                expect.any(Object),
                expect.any(Object),
                `${description} - ${fileName}`,
                { preview: true, preserveFocus: false }
            );
            expect(applyChangesSpy).toHaveBeenCalledWith(fileName, suggestedContent);
        });

        it('should handle user rejecting changes', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(false);
        });

        it('should handle manual edit selection', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Edit Manually');
            
            const openForManualEditSpy = jest.spyOn(provider as any, 'openForManualEdit').mockResolvedValue(true);
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(true);
            expect(openForManualEditSpy).toHaveBeenCalledWith(fileName, suggestedContent);
        });

        it('should handle undefined user action', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(false);
        });

        it('should clean up temporary files', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            
            await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
            expect(fs.promises.unlink).toHaveBeenCalledWith('/test/storage/diffs/test.js.original');
            expect(fs.promises.unlink).toHaveBeenCalledWith('/test/storage/diffs/test.js.suggested');
        });

        it('should handle cleanup errors gracefully', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Failed to clean up temp files:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });

        it('should handle file creation errors', async () => {
            (fs.promises.mkdir as jest.Mock).mockRejectedValue(new Error('Directory creation failed'));
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(false);
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to show diff: Directory creation failed');
        });

        it('should handle diff command errors', async () => {
            (vscode.commands.executeCommand as jest.Mock).mockRejectedValue(new Error('Diff command failed'));
            
            const result = await provider.showDiff(originalContent, suggestedContent, fileName, description);
            
            expect(result).toBe(false);
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to show diff: Diff command failed');
        });

        it('should validate input parameters', async () => {
            // Test empty content
            const result1 = await provider.showDiff('', suggestedContent, fileName, description);
            expect(result1).toBe(false);
            
            // Test empty filename
            const result2 = await provider.showDiff(originalContent, suggestedContent, '', description);
            expect(result2).toBe(false);
            
            // Test null parameters
            const result3 = await provider.showDiff(null as any, suggestedContent, fileName, description);
            expect(result3).toBe(false);
        });

        it('should handle special characters in filename', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            
            const specialFileName = 'test-file@2024.js';
            const result = await provider.showDiff(originalContent, suggestedContent, specialFileName, description);
            
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                '/test/storage/diffs/test-file@2024.js.original',
                originalContent,
                'utf8'
            );
        });
    });

    describe('applyChanges', () => {
        it('should apply changes to existing file', async () => {
            const fileName = 'test.js';
            const content = 'new content';

            const mockUri = { fsPath: '/test/test.js' };
            const mockDocument = {
                getText: () => 'old content',
                positionAt: jest.fn().mockReturnValue({ line: 0, character: 0 }),
                save: jest.fn().mockResolvedValue(true)
            };

            (vscode.workspace.findFiles as jest.Mock).mockResolvedValue([mockUri]);
            (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
            (vscode.workspace.applyEdit as jest.Mock).mockResolvedValue(true);
            (vscode.window.showTextDocument as jest.Mock).mockResolvedValue(undefined);

            const result = await (provider as any).applyChanges(fileName, content);

            expect(result).toBe(true);
            expect(vscode.workspace.findFiles).toHaveBeenCalledWith(`**/${fileName}`);
            expect(vscode.workspace.applyEdit).toHaveBeenCalled();
        });

        it('should handle file write errors', async () => {
            const fileName = 'test.js';
            const content = 'new content';

            // Mock file not found scenario
            (vscode.workspace.findFiles as jest.Mock).mockResolvedValue([]);

            const result = await (provider as any).applyChanges(fileName, content);

            expect(result).toBe(false);
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`File ${fileName} not found in workspace`);
        });
    });

    describe('openForManualEdit', () => {
        it('should open file for manual editing', async () => {
            const fileName = 'test.js';
            const content = 'content to edit';
            
            (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue({});
            (vscode.window.showTextDocument as jest.Mock).mockResolvedValue({});
            
            const result = await (provider as any).openForManualEdit(fileName, content);
            
            expect(result).toBe(true);
            expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
                content: content,
                language: 'javascript'
            });
            expect(vscode.window.showTextDocument).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should handle document opening errors', async () => {
            const fileName = 'test.js';
            const content = 'content to edit';
            
            (vscode.workspace.openTextDocument as jest.Mock).mockRejectedValue(new Error('Open failed'));
            
            const result = await (provider as any).openForManualEdit(fileName, content);
            
            expect(result).toBe(false);
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Error opening for manual edit: Open failed');
        });
    });

    describe('Integration and Edge Cases', () => {
        it('should handle concurrent diff operations', async () => {
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            
            const promises = [
                provider.showDiff('content1', 'suggested1', 'file1.js', 'desc1'),
                provider.showDiff('content2', 'suggested2', 'file2.js', 'desc2'),
                provider.showDiff('content3', 'suggested3', 'file3.js', 'desc3')
            ];
            
            const results = await Promise.all(promises);
            
            expect(results.every(r => r === false)).toBe(true); // All rejected
            expect(fs.promises.mkdir).toHaveBeenCalledTimes(3);
        });

        it('should handle large file content', async () => {
            const largeContent = 'x'.repeat(100000);
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            
            const result = await provider.showDiff(largeContent, largeContent + 'y', 'large.js', 'Large file test');
            
            expect(result).toBe(false);
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                expect.any(String),
                largeContent,
                'utf8'
            );
        });

        it('should handle binary file content gracefully', async () => {
            const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47]).toString();
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Reject Changes');
            
            const result = await provider.showDiff(binaryContent, binaryContent, 'binary.png', 'Binary test');
            
            expect(result).toBe(false);
        });
    });
});
