/**
 * TDD Tests for ManifestoWebview - Red Phase
 * Testing webview button clicks, tab switching, and message handling
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { ManifestoWebview } from '../ManifestoWebview';
import { StateManager } from '../../core/StateManager';

// Mock VSCode API
const mockContext: vscode.ExtensionContext = {
    subscriptions: [],
    extensionUri: vscode.Uri.file('/test'),
    globalState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn().mockReturnValue([])
    } as any,
    workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn().mockReturnValue([])
    } as any,
    secrets: {} as any,
    extensionMode: vscode.ExtensionMode.Test,
    globalStorageUri: vscode.Uri.file('/test/global'),
    logUri: vscode.Uri.file('/test/log'),
    storageUri: vscode.Uri.file('/test/storage'),
    extensionPath: '/test',
    asAbsolutePath: jest.fn().mockImplementation((path: string) => `/test/${path}`),
    environmentVariableCollection: {} as any,
    storagePath: '/test/storage',
    globalStoragePath: '/test/global',
    logPath: '/test/log',
    extension: {} as any,
    languageModelAccessInformation: {} as any
    // extensionKind: vscode.ExtensionKind.Workspace // Not part of ExtensionContext
};

const mockStateManager = {
    getManifestoMode: jest.fn().mockReturnValue('developer'),
    setManifestoMode: jest.fn(),
    getManifestoRules: jest.fn().mockReturnValue([]),
    refreshManifesto: jest.fn(),
    getGlossaryEntries: jest.fn().mockReturnValue({
        entries: [
            { term: 'TDD', definition: 'Test-Driven Development', category: 'methodology' },
            { term: 'Manifesto', definition: 'Development guidelines', category: 'process' }
        ]
    })
} as any;

describe('ManifestoWebview TDD Tests', () => {
    let webview: ManifestoWebview;
    let mockPanel: any;
    let mockWebview: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock webview panel
        mockWebview = {
            html: '',
            onDidReceiveMessage: jest.fn(),
            postMessage: jest.fn(),
            options: {},
            cspSource: 'vscode-webview:'
        };

        mockPanel = {
            webview: mockWebview,
            dispose: jest.fn(),
            onDidDispose: jest.fn(),
            reveal: jest.fn(),
            title: 'Test Panel',
            viewType: 'test'
        };

        // Mock vscode.window.createWebviewPanel
        jest.spyOn(vscode.window, 'createWebviewPanel').mockReturnValue(mockPanel);
        jest.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
        jest.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
    });

    describe('🔴 RED: Tab Switching Tests (Should Fail Initially)', () => {
        test('should handle tab switch to manifesto', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                // Simulate tab switch message
                const message = { command: 'switchTab', tab: 'manifesto' };

                // This should work since switchTab exists
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });

        test('should handle tab switch to glossary', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'switchTab', tab: 'glossary' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });

        test('should handle tab switch to settings', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'switchTab', tab: 'settings' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });
    });

    describe('🔴 RED: Button Click Tests (Should Fail Initially)', () => {
        test('should handle create manifesto button click', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = {
                    command: 'createManifesto',
                    type: 'developer',
                    path: 'new-manifesto.md'
                };

                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });

        test('should handle test connection button click', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'testConnection' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });

        test('should handle discover APIs button click', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'discoverAPIs' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });
    });

    describe('🔴 RED: Mode Switching Tests (Should Fail Initially)', () => {
        test('should handle mode switch to developer', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'switchMode', mode: 'developer' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });

        test('should handle mode switch to qa', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'switchMode', mode: 'qa' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });
    });

    describe('🔴 RED: Rule Filtering Tests (Should Fail Initially)', () => {
        test('should handle rule filtering', async () => {
            try {
                webview = new ManifestoWebview(mockContext, mockStateManager);

                const message = { command: 'filterRules', filter: 'security' };
                webview.handleMessage(message);

                // Verify no error occurred
                expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        });
    });

    describe('🔴 RED: Error Handling Tests', () => {
        test('should handle invalid message format', () => {
            webview = new ManifestoWebview(mockContext, mockStateManager);
            
            expect(() => {
                webview.handleMessage(null);
            }).not.toThrow(); // Should handle gracefully
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });

        test('should handle unknown command', () => {
            webview = new ManifestoWebview(mockContext, mockStateManager);
            
            const message = { command: 'unknownCommand' };
            webview.handleMessage(message);
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Unknown command')
            );
        });
    });
});
