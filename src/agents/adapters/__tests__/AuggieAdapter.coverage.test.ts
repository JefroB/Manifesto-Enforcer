/**
 * AuggieAdapter Coverage Tests
 * 
 * Focused tests to achieve 100% coverage for specific uncovered lines:
 * - Lines 120-144: Extension activation failure scenarios
 * - Lines 173-207: getCapabilities() and dispose() methods  
 * - Line 253: No extension found logging
 * - Lines 274-330: Method 3 and Method 4 fallback scenarios
 */

import { AuggieAdapter } from '../AuggieAdapter';
import { AgentConfig } from '../../../core/types';

// Mock VSCode API with proper structure
jest.mock('vscode', () => ({
    commands: {
        executeCommand: jest.fn(),
        getCommands: jest.fn()
    },
    extensions: {
        getExtension: jest.fn(),
        all: []
    },
    window: {
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showInformationMessage: jest.fn()
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        getConfiguration: jest.fn()
    },
    env: {
        clipboard: {
            writeText: jest.fn()
        },
        openExternal: jest.fn()
    },
    Uri: {
        parse: jest.fn()
    }
}), { virtual: true });

const vscode = require('vscode');

describe('AuggieAdapter Coverage Tests', () => {
    let mockConfig: AgentConfig;

    // All tests now run - no conditional skipping

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockConfig = {
            id: 'auggie',
            name: 'Auggie',
            provider: 'auggie' as any,
            apiKey: '',
            endpoint: '',
            model: 'claude-3-sonnet',
            maxTokens: 8192,
            temperature: 0.7,
            isEnabled: true
        };

        // Setup default mocks
        vscode.extensions.getExtension.mockReturnValue({
            id: 'augment.vscode-augment',
            isActive: true,
            packageJSON: { displayName: 'Augment Code' }
        });
        vscode.commands.getCommands.mockResolvedValue(['augment.openChat']);
    });

    describe('getCapabilities Method (Lines 173-207)', () => {
        it('should return correct capabilities object', () => {
            const adapter = new AuggieAdapter(mockConfig);
            const capabilities = adapter.getCapabilities();

            expect(capabilities).toEqual({
                supportsCodeGeneration: true,
                supportsFileOperations: true,
                supportsStreaming: false,
                maxTokens: 8192,
                supportedLanguages: [
                    'typescript', 'javascript', 'python', 'java', 'csharp', 
                    'cpp', 'rust', 'go', 'php', 'ruby', 'swift', 'kotlin'
                ],
                rateLimits: {
                    requestsPerMinute: 60,
                    tokensPerMinute: 100000,
                    maxConcurrentRequests: 5
                }
            });
        });
    });

    describe('dispose Method (Lines 173-207)', () => {
        it('should dispose resources successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const adapter = new AuggieAdapter(mockConfig);

            await adapter.dispose();

            expect(consoleSpy).toHaveBeenCalledWith('Auggie adapter disposed successfully');
            consoleSpy.mockRestore();
        });

        it('should clear sensitive configuration during disposal', async () => {
            const configWithApiKey = {
                ...mockConfig,
                apiKey: 'test-secret-key'
            };
            const adapter = new AuggieAdapter(configWithApiKey);

            await adapter.dispose();

            expect(adapter.getConfig().apiKey).toBe('');
        });

        it('should handle disposal errors gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const adapter = new AuggieAdapter(mockConfig);
            
            // Force an error during disposal
            (adapter as any).config = undefined;

            await adapter.dispose();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error disposing Auggie adapter:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe('No Extension Found Logging (Line 253)', () => {
        it('should log when no extension found with any known ID', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            // Mock all extension IDs to return undefined
            vscode.extensions.getExtension.mockReturnValue(undefined);
            vscode.extensions.all = [{ id: 'other.extension' }];

            // This should trigger the "no extension found" logging
            new AuggieAdapter(mockConfig);

            expect(consoleSpy).toHaveBeenCalledWith('🐷 AuggieAdapter: No Augment extension found with any known ID');
            consoleSpy.mockRestore();
        });
    });

    describe('Extension Activation Failure (Lines 120-144)', () => {
        it('should handle extension activation timeout with auth prompt', async () => {
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: false,
                packageJSON: { displayName: 'Augment Code' },
                activate: jest.fn().mockImplementation(() => 
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Activation timeout')), 100)
                    )
                )
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);
            vscode.window.showInformationMessage.mockResolvedValue('Open Augment Panel');
            vscode.commands.executeCommand.mockResolvedValue(undefined);

            const adapter = new AuggieAdapter(mockConfig);
            const result = await adapter.validateConnection();

            expect(result).toBe(false);
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                '🐷 Piggie needs you to sign in to Augment Code first!',
                'Open Augment Panel',
                'Learn More'
            );
        });

        it('should handle "Learn More" action and open documentation', async () => {
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: false,
                packageJSON: { displayName: 'Augment Code' },
                activate: jest.fn().mockRejectedValue(new Error('Auth required'))
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);
            vscode.window.showInformationMessage.mockResolvedValue('Learn More');
            vscode.Uri.parse.mockReturnValue('parsed-uri');

            const adapter = new AuggieAdapter(mockConfig);
            await adapter.validateConnection();

            expect(vscode.env.openExternal).toHaveBeenCalledWith('parsed-uri');
            expect(vscode.Uri.parse).toHaveBeenCalledWith('https://docs.augmentcode.com/setup-augment/sign-in');
        });

        it('should fallback to augment.openPanel when workbench command fails', async () => {
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: false,
                packageJSON: { displayName: 'Augment Code' },
                activate: jest.fn().mockRejectedValue(new Error('Auth required'))
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);
            vscode.window.showInformationMessage.mockResolvedValue('Open Augment Panel');
            vscode.commands.executeCommand
                .mockRejectedValueOnce(new Error('workbench command failed'))
                .mockResolvedValueOnce(undefined); // augment.openPanel succeeds

            const adapter = new AuggieAdapter(mockConfig);
            await adapter.validateConnection();

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.view.extension.augment');
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('augment.openPanel');
        });
    });

    describe('Method 3 and Method 4 Fallback Scenarios (Lines 274-330)', () => {
        it('should use Method 3 (UI fallback) when commands succeed', async () => {
            // Mock extension without exports.sendMessage to force fallback
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: true,
                packageJSON: { displayName: 'Augment Code' }
                // No exports.sendMessage - forces fallback to Method 2, then Method 3
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);

            // Mock Method 2 commands to fail, Method 3 to succeed
            vscode.commands.executeCommand
                .mockRejectedValueOnce(new Error('augment.sendMessage failed'))
                .mockRejectedValueOnce(new Error('augment.chat.sendMessage failed'))
                .mockRejectedValueOnce(new Error('augment.executeCommand failed'))
                .mockResolvedValueOnce(undefined) // workbench.view.extension.augment
                .mockResolvedValueOnce(undefined); // augment.openChat

            // Mock setTimeout to execute immediately
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
                callback();
                return 123 as any;
            });

            const adapter = new AuggieAdapter(mockConfig);
            const response = await adapter.sendMessage('Test message');

            expect(response.content).toContain('🤖 **Agent Processing Complete**');
            expect(response.content).toContain('Test message');
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.view.extension.augment');
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('augment.openChat');

            // Restore setTimeout
            setTimeoutSpy.mockRestore();
        });

        it('should use Method 4 (clipboard) when all commands fail', async () => {
            // Mock extension without exports.sendMessage
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: true,
                packageJSON: { displayName: 'Augment Code' }
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);

            // Mock ALL commands to fail
            vscode.commands.executeCommand.mockRejectedValue(new Error('All commands failed'));
            vscode.env.clipboard.writeText.mockResolvedValue(undefined);
            vscode.window.showInformationMessage.mockResolvedValue('Continue');

            const adapter = new AuggieAdapter(mockConfig);
            const response = await adapter.sendMessage('Test clipboard message');

            expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('Test clipboard message');
            expect(response.content).toContain('🤖 **Agent Request Prepared**');
            expect(response.content).toContain('Test clipboard message');
            expect(response.content).toContain('📋 **Next Steps:**');
        });

        it('should handle "Open Augment Code" action in clipboard fallback', async () => {
            // Mock extension without exports.sendMessage
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: true,
                packageJSON: { displayName: 'Augment Code' }
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);

            // Mock ALL commands to fail initially, then succeed for opening Augment
            vscode.commands.executeCommand
                .mockRejectedValueOnce(new Error('augment.sendMessage failed'))
                .mockRejectedValueOnce(new Error('augment.chat.sendMessage failed'))
                .mockRejectedValueOnce(new Error('augment.executeCommand failed'))
                .mockRejectedValueOnce(new Error('workbench.view.extension.augment failed'))
                .mockRejectedValueOnce(new Error('augment.openChat failed'))
                .mockResolvedValueOnce(undefined); // workbench.view.extension.augment for "Open Augment Code"

            vscode.env.clipboard.writeText.mockResolvedValue(undefined);
            vscode.window.showInformationMessage.mockResolvedValue('Open Augment Code');

            const adapter = new AuggieAdapter(mockConfig);
            const response = await adapter.sendMessage('Test open action');

            expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('Test open action');
            expect(response.content).toContain('🤖 **Agent Request Prepared**');
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.view.extension.augment');
        });

        it('should fallback to augment.openPanel when workbench command fails in clipboard action', async () => {
            // Mock extension without exports.sendMessage
            const mockExtension = {
                id: 'augment.vscode-augment',
                isActive: true,
                packageJSON: { displayName: 'Augment Code' }
            };
            vscode.extensions.getExtension.mockReturnValue(mockExtension);

            // Mock commands to fail, then workbench fails but augment.openPanel succeeds
            vscode.commands.executeCommand
                .mockRejectedValue(new Error('Most commands fail'))
                .mockRejectedValueOnce(new Error('workbench.view.extension.augment failed'))
                .mockResolvedValueOnce(undefined); // augment.openPanel succeeds

            vscode.env.clipboard.writeText.mockResolvedValue(undefined);
            vscode.window.showInformationMessage.mockResolvedValue('Open Augment Code');

            const adapter = new AuggieAdapter(mockConfig);

            try {
                await adapter.sendMessage('Test panel fallback');
            } catch (error) {
                // Expected to fail due to mock setup, but we're testing the fallback path
            }

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('augment.openPanel');
        });
    });
});
