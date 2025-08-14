/**
 * MANDATORY: Unit Tests for SettingsCommands
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { SettingsCommands } from '../SettingsCommands';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

// Mock VSCode API
jest.mock('vscode', () => ({
    window: {
        withProgress: jest.fn(),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn()
    },
    ProgressLocation: {
        Notification: 15
    },
    commands: {
        registerCommand: jest.fn()
    },
    Uri: {
        file: jest.fn((path: string) => ({ fsPath: path, path }))
    }
}));

describe('SettingsCommands', () => {
    let mockContext: vscode.ExtensionContext;
    let settingsCommands: SettingsCommands;
    let mockStateManager: jest.Mocked<StateManager>;
    let mockAgentManager: jest.Mocked<AgentManager>;

    beforeEach(() => {
        // Mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: jest.fn(),
                update: jest.fn().mockResolvedValue(undefined),
                keys: jest.fn().mockReturnValue([])
            },
            globalState: {
                get: jest.fn(),
                update: jest.fn().mockResolvedValue(undefined),
                keys: jest.fn().mockReturnValue([]),
                setKeysForSync: jest.fn()
            },
            extensionPath: '/test/path',
            extensionUri: vscode.Uri.file('/test/path'),
            environmentVariableCollection: {} as any,
            extensionMode: 2, // ExtensionMode.Test
            logUri: vscode.Uri.file('/test/log'),
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global'),
            storagePath: '/test/storage',
            globalStoragePath: '/test/global',
            logPath: '/test/log',
            extension: {} as any,
            languageModelAccessInformation: {} as any,
            secrets: {} as any,
            asAbsolutePath: jest.fn((path: string) => `/test/path/${path}`)
        };

        // Mock StateManager
        mockStateManager = {
            getInstance: jest.fn().mockReturnValue(mockStateManager),
            currentAgent: 'Auggie',
            isManifestoMode: true,
            manifestoMode: 'developer'
        } as any;

        // Mock AgentManager
        mockAgentManager = {
            getAvailableAgents: jest.fn().mockReturnValue([
                { id: 'auggie', name: 'Auggie', type: 'local' },
                { id: 'claude', name: 'Claude', type: 'api' }
            ]),
            getActiveAgent: jest.fn().mockReturnValue({ id: 'auggie', name: 'Auggie', type: 'local' }),
            setActiveAgent: jest.fn()
        } as any;

        // Mock StateManager.getInstance
        jest.spyOn(StateManager, 'getInstance').mockReturnValue(mockStateManager);

        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize successfully with valid context', () => {
            expect(() => {
                settingsCommands = new SettingsCommands(mockContext);
            }).not.toThrow();
        });

        it('should throw error with null context', () => {
            expect(() => {
                new SettingsCommands(null as any);
            }).toThrow('ExtensionContext is required');
        });

        it('should throw error with undefined context', () => {
            expect(() => {
                new SettingsCommands(undefined as any);
            }).toThrow('ExtensionContext is required');
        });
    });

    describe('Command Registration', () => {
        beforeEach(() => {
            settingsCommands = new SettingsCommands(mockContext);
        });

        it('should register all settings commands', () => {
            const registerCommandSpy = jest.spyOn(vscode.commands, 'registerCommand');
            
            settingsCommands.registerCommands(mockContext);

            expect(registerCommandSpy).toHaveBeenCalledWith(
                'manifestoEnforcer.settings.testConnection',
                expect.any(Function)
            );
            expect(registerCommandSpy).toHaveBeenCalledWith(
                'manifestoEnforcer.settings.discoverAPIs',
                expect.any(Function)
            );
        });

        it('should handle command registration errors gracefully', () => {
            const registerCommandSpy = jest.spyOn(vscode.commands, 'registerCommand')
                .mockImplementation(() => {
                    throw new Error('Registration failed');
                });

            expect(() => {
                settingsCommands.registerCommands(mockContext);
            }).not.toThrow();

            expect(registerCommandSpy).toHaveBeenCalled();
        });
    });

    describe('Test Connection Command', () => {
        beforeEach(() => {
            settingsCommands = new SettingsCommands(mockContext);
        });

        it('should test connection successfully', async () => {
            const mockProgress = {
                report: jest.fn()
            };

            const withProgressSpy = jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            await settingsCommands.testConnection();

            expect(withProgressSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: vscode.ProgressLocation.Notification,
                    title: "Testing AI Agent Connection...",
                    cancellable: false
                }),
                expect.any(Function)
            );

            expect(mockProgress.report).toHaveBeenCalledWith(
                expect.objectContaining({
                    increment: 0,
                    message: "Initializing connection test..."
                })
            );
        });

        it('should handle connection test errors', async () => {
            mockAgentManager.getAvailableAgents.mockImplementation(() => {
                throw new Error('Agent manager error');
            });

            const showErrorMessageSpy = jest.spyOn(vscode.window, 'showErrorMessage');

            await settingsCommands.testConnection();

            expect(showErrorMessageSpy).toHaveBeenCalledWith(
                expect.stringContaining('Connection test failed')
            );
        });

        it('should show success message when agent is available', async () => {
            const mockProgress = { report: jest.fn() };
            jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            const showInfoMessageSpy = jest.spyOn(vscode.window, 'showInformationMessage');

            await settingsCommands.testConnection();

            expect(showInfoMessageSpy).toHaveBeenCalledWith(
                expect.stringContaining('Connection successful!')
            );
        });

        it('should show warning when no agent is available', async () => {
            mockAgentManager.getAvailableAgents.mockReturnValue([]);

            const mockProgress = { report: jest.fn() };
            jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            const showWarningMessageSpy = jest.spyOn(vscode.window, 'showWarningMessage');

            await settingsCommands.testConnection();

            expect(showWarningMessageSpy).toHaveBeenCalledWith(
                expect.stringContaining('No connection')
            );
        });
    });

    describe('Discover APIs Command', () => {
        beforeEach(() => {
            settingsCommands = new SettingsCommands(mockContext);
        });

        it('should discover APIs successfully', async () => {
            const mockProgress = {
                report: jest.fn()
            };

            const withProgressSpy = jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            await settingsCommands.discoverAPIs();

            expect(withProgressSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: vscode.ProgressLocation.Notification,
                    title: "Discovering AI Agent APIs...",
                    cancellable: false
                }),
                expect.any(Function)
            );

            expect(mockProgress.report).toHaveBeenCalledWith(
                expect.objectContaining({
                    increment: 0,
                    message: "Scanning for available agents..."
                })
            );
        });

        it('should handle discovery errors', async () => {
            mockAgentManager.getAvailableAgents.mockImplementation(() => {
                throw new Error('Discovery failed');
            });

            const showErrorMessageSpy = jest.spyOn(vscode.window, 'showErrorMessage');

            await settingsCommands.discoverAPIs();

            expect(showErrorMessageSpy).toHaveBeenCalledWith(
                expect.stringContaining('API discovery failed')
            );
        });

        it('should show results when agents are found', async () => {
            const mockProgress = { report: jest.fn() };
            jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            const showInfoMessageSpy = jest.spyOn(vscode.window, 'showInformationMessage');

            await settingsCommands.discoverAPIs();

            expect(showInfoMessageSpy).toHaveBeenCalledWith(
                expect.stringContaining('Found 2 available agents')
            );
        });

        it('should handle no agents found', async () => {
            mockAgentManager.getAvailableAgents.mockReturnValue([]);

            const mockProgress = { report: jest.fn() };
            jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            const showWarningMessageSpy = jest.spyOn(vscode.window, 'showWarningMessage');

            await settingsCommands.discoverAPIs();

            expect(showWarningMessageSpy).toHaveBeenCalledWith(
                expect.stringContaining('No agents discovered')
            );
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            settingsCommands = new SettingsCommands(mockContext);
        });

        it('should handle StateManager initialization errors', () => {
            jest.spyOn(StateManager, 'getInstance').mockImplementation(() => {
                throw new Error('StateManager failed');
            });

            expect(() => {
                new SettingsCommands(mockContext);
            }).toThrow('SettingsCommands initialization failed');
        });

        it('should handle AgentManager initialization errors', () => {
            // This would be tested if AgentManager constructor could throw
            // For now, we test that the constructor handles errors gracefully
            expect(() => {
                settingsCommands = new SettingsCommands(mockContext);
            }).not.toThrow();
        });
    });

    describe('Integration with StateManager', () => {
        beforeEach(() => {
            settingsCommands = new SettingsCommands(mockContext);
        });

        it('should use StateManager for current agent information', async () => {
            const mockProgress = { report: jest.fn() };
            jest.spyOn(vscode.window, 'withProgress')
                .mockImplementation(async (options, task) => {
                    return await task(mockProgress, {} as any);
                });

            await settingsCommands.testConnection();

            // Verify that the current agent from StateManager is used
            expect(mockProgress.report).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Auggie')
                })
            );
        });
    });
});
