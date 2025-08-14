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
/**
 * Admin Commands Settings Integration - Moved to Mocha Tests
 *
 * The admin commands integration tests have been moved to:
 * src/core/__tests__/SettingsConfiguration.mocha.test.ts
 *
 * This uses the VSCode Extension Testing Framework for real VSCode API integration
 * rather than mocked Jest tests which can't properly test VSCode command registration.
 *
 * Run with: npm run test:mocha
 */
