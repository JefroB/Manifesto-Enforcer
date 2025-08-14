import * as vscode from 'vscode';
import { StateManager } from '../StateManager';

/**
 * Test suite for Settings Configuration (Phase 1)
 * Tests new settings for manifesto mode system and admin functions
 * MANDATORY: All tests must fail initially - TDD approach
 */
describe('Settings Configuration - Phase 1', () => {
    let mockWorkspaceConfig: any;
    let stateManager: StateManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock VSCode workspace configuration
        mockWorkspaceConfig = {
            get: jest.fn(),
            update: jest.fn(),
            has: jest.fn(),
            inspect: jest.fn()
        };
        
        (vscode.workspace.getConfiguration as jest.Mock) = jest.fn().mockReturnValue(mockWorkspaceConfig);
        
        stateManager = new StateManager();
    });

    describe('New Settings Properties', () => {
        it('should support manifestoEnforcer.manifestoMode enum setting', async () => {
            // This test will fail initially - manifestoMode should be enum, not boolean
            mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
                if (key === 'manifestoMode') {
                    return 'developer'; // Should be enum: developer, qa, solo
                }
                return defaultValue;
            });

            await stateManager.loadSettings();
            
            // Should have manifestoMode as enum, not boolean
            expect(stateManager.manifestoMode).toBe('developer');
            expect(['developer', 'qa', 'solo']).toContain(stateManager.manifestoMode);
        });

        it('should support manifestoEnforcer.devManifestoPath setting', async () => {
            // This test will fail initially - devManifestoPath doesn't exist
            mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
                if (key === 'devManifestoPath') {
                    return 'manifesto-dev.md';
                }
                return defaultValue;
            });

            await stateManager.loadSettings();
            
            expect(stateManager.devManifestoPath).toBe('manifesto-dev.md');
        });

        it('should support manifestoEnforcer.qaManifestoPath setting', async () => {
            // This test will fail initially - qaManifestoPath doesn't exist
            mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
                if (key === 'qaManifestoPath') {
                    return 'manifesto-qa.md';
                }
                return defaultValue;
            });

            await stateManager.loadSettings();
            
            expect(stateManager.qaManifestoPath).toBe('manifesto-qa.md');
        });

        it('should have default values for new manifesto path settings', async () => {
            // This test will fail initially - properties don't exist
            mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => defaultValue);

            await stateManager.loadSettings();
            
            expect(stateManager.devManifestoPath).toBe('manifesto-dev.md');
            expect(stateManager.qaManifestoPath).toBe('manifesto-qa.md');
        });
    });

    describe('Settings Validation', () => {
        it('should validate manifestoMode enum values', async () => {
            // This test will fail initially - validation doesn't exist
            mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
                if (key === 'manifestoMode') {
                    return 'invalid-mode'; // Invalid enum value
                }
                return defaultValue;
            });

            await stateManager.loadSettings();
            
            // Should default to 'developer' for invalid values
            expect(stateManager.manifestoMode).toBe('developer');
        });

        it('should validate manifesto file paths exist', async () => {
            // This test will fail initially - path validation doesn't exist
            mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
                if (key === 'devManifestoPath') {
                    return 'non-existent-file.md';
                }
                return defaultValue;
            });

            const isValid = await stateManager.validateManifestoPath('non-existent-file.md');
            expect(isValid).toBe(false);
        });
    });

    describe('Settings Persistence', () => {
        it('should save new manifesto mode settings', async () => {
            // This test will fail initially - save methods don't handle new properties
            stateManager.manifestoMode = 'qa';
            stateManager.devManifestoPath = 'custom-dev.md';
            stateManager.qaManifestoPath = 'custom-qa.md';

            await stateManager.saveSettings();

            expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('manifestoMode', 'qa', vscode.ConfigurationTarget.Global);
            expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('devManifestoPath', 'custom-dev.md', vscode.ConfigurationTarget.Global);
            expect(mockWorkspaceConfig.update).toHaveBeenCalledWith('qaManifestoPath', 'custom-qa.md', vscode.ConfigurationTarget.Global);
        });
    });
});

/**
 * Test suite for Admin Commands Settings Integration
 * Tests moving admin commands to settings panel
 */
describe('Admin Commands Settings Integration', () => {
    let mockCommands: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockCommands = {
            executeCommand: jest.fn(),
            registerCommand: jest.fn()
        };
        
        (vscode.commands as any) = mockCommands;
    });

    describe('Test Connection Command', () => {
        it('should be accessible from settings panel', async () => {
            // This test will fail initially - settings panel integration doesn't exist
            const testConnectionHandler = jest.fn();
            
            // Should register command for settings panel access
            expect(mockCommands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.settings.testConnection',
                expect.any(Function)
            );
        });

        it('should provide connection test results in settings UI', async () => {
            // This test will fail initially - settings UI doesn't exist
            const connectionResult = await mockCommands.executeCommand('manifestoEnforcer.settings.testConnection');
            
            expect(connectionResult).toHaveProperty('success');
            expect(connectionResult).toHaveProperty('message');
            expect(connectionResult).toHaveProperty('agentStatus');
        });
    });

    describe('Discover APIs Command', () => {
        it('should be accessible from settings panel', async () => {
            // This test will fail initially - settings panel integration doesn't exist
            const discoverAPIsHandler = jest.fn();
            
            expect(mockCommands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.settings.discoverAPIs',
                expect.any(Function)
            );
        });

        it('should provide API discovery results in settings UI', async () => {
            // This test will fail initially - settings UI doesn't exist
            const discoveryResult = await mockCommands.executeCommand('manifestoEnforcer.settings.discoverAPIs');
            
            expect(discoveryResult).toHaveProperty('apis');
            expect(discoveryResult).toHaveProperty('recommendations');
        });
    });

    describe('Settings UI Integration', () => {
        it('should remove admin commands from main UI components', () => {
            // This test will fail initially - commands still exist in main UI
            const mainUICommands = [
                'manifestoEnforcer.testConnection',
                'piggie.discoverAPIs'
            ];
            
            // These commands should no longer be in main UI after Phase 1
            mainUICommands.forEach(command => {
                expect(mockCommands.registerCommand).not.toHaveBeenCalledWith(
                    command,
                    expect.any(Function)
                );
            });
        });
    });
});
