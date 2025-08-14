/**
 * MANDATORY: TDD Tests for Settings Integration
 * Phase 1: Settings Integration - Write failing tests FIRST
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { StateManager } from '../../core/StateManager';

describe('Settings Integration - TDD Phase 1', () => {
    let mockContext: vscode.ExtensionContext;
    let stateManager: StateManager;

    beforeEach(() => {
        // Mock VSCode configuration with default values
        const mockConfig = {
            get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
                switch (key) {
                    case 'manifestoMode': return defaultValue || 'developer';
                    case 'devManifestoPath': return defaultValue || 'manifesto-dev.md';
                    case 'qaManifestoPath': return defaultValue || 'manifesto-qa.md';
                    case 'defaultMode': return defaultValue || 'chat';
                    case 'autoMode': return defaultValue || false;
                    case 'isTddMode': return defaultValue || false;
                    case 'isUiTddMode': return defaultValue || false;
                    case 'techStack': return defaultValue || '';
                    case 'testFramework': return defaultValue || '';
                    case 'uiTestFramework': return defaultValue || '';
                    case 'fontSize': return defaultValue || 'medium';
                    case 'showEmojis': return defaultValue || true;
                    case 'currentAgent': return defaultValue || 'Auggie';
                    default: return defaultValue;
                }
            }),
            update: jest.fn().mockResolvedValue(undefined),
            has: jest.fn(),
            inspect: jest.fn()
        };

        jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig as any);

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

        stateManager = new StateManager(mockContext);
        jest.clearAllMocks();
    });

    describe('Manifesto Mode Configuration', () => {
        it('should fail: manifestoMode enum validation not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Test that manifestoMode accepts only valid enum values
            await expect(async () => {
                await config.update('manifestoMode', 'invalid-mode', vscode.ConfigurationTarget.Global);
                await stateManager.loadSettings();
            }).rejects.toThrow('Invalid manifesto mode');
        });

        it('should fail: devManifestoPath validation not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Test that devManifestoPath validates file extension
            await expect(async () => {
                await config.update('devManifestoPath', 'invalid.txt', vscode.ConfigurationTarget.Global);
                await stateManager.loadSettings();
            }).rejects.toThrow('Manifesto file must have .md extension');
        });

        it('should fail: qaManifestoPath validation not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Test that qaManifestoPath validates file extension
            await expect(async () => {
                await config.update('qaManifestoPath', 'invalid.json', vscode.ConfigurationTarget.Global);
                await stateManager.loadSettings();
            }).rejects.toThrow('Manifesto file must have .md extension');
        });

        it('should fail: solo mode rule merging not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            config.get = jest.fn().mockImplementation((key: string) => {
                switch (key) {
                    case 'manifestoMode': return 'solo';
                    case 'devManifestoPath': return 'manifesto-dev.md';
                    case 'qaManifestoPath': return 'manifesto-qa.md';
                    default: return undefined;
                }
            });

            await stateManager.loadSettings();
            
            // Should merge rules from both manifestos in solo mode
            const mergedRules = stateManager.manifestoRules;
            expect(mergedRules.length).toBeGreaterThan(0);
            // In solo mode, should have rules from both dev and qa manifestos
            expect(mergedRules.length).toBeGreaterThan(1);
        });
    });

    describe('Admin Commands Settings Integration', () => {
        it('should fail: testConnection settings button not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const testConnectionCommand = vscode.commands.getCommands().then(commands => 
                commands.includes('manifestoEnforcer.settings.testConnection')
            );
            
            expect(await testConnectionCommand).toBe(true);
        });

        it('should fail: discoverAPIs settings button not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const discoverAPIsCommand = vscode.commands.getCommands().then(commands => 
                commands.includes('manifestoEnforcer.settings.discoverAPIs')
            );
            
            expect(await discoverAPIsCommand).toBe(true);
        });

        it('should fail: admin commands removed from main UI not implemented', async () => {
            // This test should FAIL initially - TDD approach
            // Verify that testConnection and discoverAPIs are NOT in main UI commands
            const mainUICommands = vscode.commands.getCommands().then(commands => 
                commands.filter(cmd => 
                    cmd.startsWith('manifestoEnforcer.') && 
                    !cmd.includes('settings.') &&
                    (cmd.includes('testConnection') || cmd.includes('discoverAPIs'))
                )
            );
            
            expect((await mainUICommands).length).toBe(0);
        });
    });

    describe('Settings UI Integration', () => {
        it('should fail: settings UI buttons not registered', async () => {
            // This test should FAIL initially - TDD approach
            // Test that settings UI has proper button integration
            const settingsCommands = [
                'manifestoEnforcer.settings.testConnection',
                'manifestoEnforcer.settings.discoverAPIs'
            ];

            for (const command of settingsCommands) {
                const commandExists = await vscode.commands.getCommands().then(commands => 
                    commands.includes(command)
                );
                expect(commandExists).toBe(true);
            }
        });

        it('should fail: settings validation not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Test comprehensive settings validation
            const invalidSettings = [
                { key: 'manifestoMode', value: 'invalid' },
                { key: 'devManifestoPath', value: '' },
                { key: 'qaManifestoPath', value: 'no-extension' },
                { key: 'devManifestoPath', value: '../../../etc/passwd' } // Path traversal
            ];

            for (const setting of invalidSettings) {
                await expect(async () => {
                    await config.update(setting.key, setting.value, vscode.ConfigurationTarget.Global);
                    await stateManager.loadSettings();
                }).rejects.toThrow();
            }
        });
    });

    describe('Error Handling and Validation', () => {
        it('should fail: comprehensive error handling not implemented', async () => {
            // This test should FAIL initially - TDD approach
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            config.update = jest.fn().mockRejectedValue(new Error('Settings update failed'));

            await expect(stateManager.saveSettings()).rejects.toThrow('Settings update failed');
        });

        it('should fail: input validation not implemented', async () => {
            // This test should FAIL initially - TDD approach
            // Test that all inputs are properly validated
            const invalidInputs = [
                null,
                undefined,
                '',
                '   ',
                '<script>alert("xss")</script>',
                '../../../etc/passwd'
            ];

            for (const input of invalidInputs) {
                await expect(async () => {
                    const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                    await config.update('devManifestoPath', input, vscode.ConfigurationTarget.Global);
                    await stateManager.loadSettings();
                }).rejects.toThrow();
            }
        });
    });
});
