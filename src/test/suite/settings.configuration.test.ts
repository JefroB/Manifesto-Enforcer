/**
 * Settings Configuration Integration Tests (Mocha + VSCode Extension Testing Framework)
 * Tests admin commands settings integration using real VSCode APIs
 * 
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 * MANDATORY: All public functions require JSDoc documentation (manifesto requirement)
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { StateManager } from '../../core/StateManager';

/**
 * Test suite for Settings Configuration using VSCode Extension Testing Framework
 * Tests real VSCode integration rather than mocked APIs
 */
suite('Settings Configuration Integration Tests', () => {
    let stateManager: StateManager;
    let mockContext: vscode.ExtensionContext;

    /**
     * Setup before each test
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    setup(async () => {
        try {
            // Create mock extension context for testing
            mockContext = {
                subscriptions: [],
                workspaceState: {
                    get: () => undefined,
                    update: async () => {},
                    keys: () => []
                },
                globalState: {
                    get: () => undefined,
                    update: async () => {},
                    keys: () => [],
                    setKeysForSync: () => {}
                },
                extensionPath: '',
                storagePath: '',
                globalStoragePath: '',
                logPath: '',
                extensionUri: vscode.Uri.file(''),
                globalStorageUri: vscode.Uri.file(''),
                logUri: vscode.Uri.file(''),
                storageUri: vscode.Uri.file(''),
                secrets: {} as any,
                environmentVariableCollection: {} as any,
                extensionMode: vscode.ExtensionMode.Test,
                extension: {} as any,
                asAbsolutePath: (relativePath: string) => relativePath,
                languageModelAccessInformation: {} as any
            };

            stateManager = new StateManager(mockContext);
        } catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });

    /**
     * Cleanup after each test
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    teardown(async () => {
        try {
            if (stateManager) {
                await stateManager.dispose();
            }
        } catch (error) {
            console.error('Teardown failed:', error);
        }
    });

    /**
     * Test suite for new settings properties
     */
    suite('New Settings Properties', () => {
        /**
         * Test manifestoMode enum setting
         */
        test('should support manifestoEnforcer.manifestoMode enum setting', async () => {
            try {
                // Test default value
                assert.strictEqual(stateManager.manifestoMode, 'developer');

                // Test setting valid values
                stateManager.manifestoMode = 'qa';
                assert.strictEqual(stateManager.manifestoMode, 'qa');

                stateManager.manifestoMode = 'solo';
                assert.strictEqual(stateManager.manifestoMode, 'solo');

                stateManager.manifestoMode = 'developer';
                assert.strictEqual(stateManager.manifestoMode, 'developer');
            } catch (error) {
                console.error('manifestoMode test failed:', error);
                throw error;
            }
        });

        /**
         * Test devManifestoPath setting
         */
        test('should support manifestoEnforcer.devManifestoPath setting', async () => {
            try {
                // Test default value
                assert.strictEqual(stateManager.devManifestoPath, 'manifesto-dev.md');

                // Test setting custom value
                stateManager.devManifestoPath = 'custom-dev-manifesto.md';
                assert.strictEqual(stateManager.devManifestoPath, 'custom-dev-manifesto.md');
            } catch (error) {
                console.error('devManifestoPath test failed:', error);
                throw error;
            }
        });

        /**
         * Test qaManifestoPath setting
         */
        test('should support manifestoEnforcer.qaManifestoPath setting', async () => {
            try {
                // Test default value
                assert.strictEqual(stateManager.qaManifestoPath, 'manifesto-qa.md');

                // Test setting custom value
                stateManager.qaManifestoPath = 'custom-qa-manifesto.md';
                assert.strictEqual(stateManager.qaManifestoPath, 'custom-qa-manifesto.md');
            } catch (error) {
                console.error('qaManifestoPath test failed:', error);
                throw error;
            }
        });
    });

    /**
     * Test suite for admin commands settings integration
     */
    suite('Admin Commands Settings Integration', () => {
        /**
         * Test connection command registration
         */
        test('should register settings.testConnection command', async () => {
            try {
                // Get all registered commands
                const commands = await vscode.commands.getCommands(true);
                
                // Check if our settings command is registered
                const hasSettingsTestCommand = commands.includes('manifestoEnforcer.settings.testConnection');
                
                // For now, this will fail until we implement the command registration
                // This is proper TDD - test first, then implement
                assert.strictEqual(hasSettingsTestCommand, true, 
                    'manifestoEnforcer.settings.testConnection command should be registered');
            } catch (error) {
                console.error('Command registration test failed:', error);
                throw error;
            }
        });

        /**
         * Test API discovery command registration
         */
        test('should register settings.discoverAPIs command', async () => {
            try {
                // Get all registered commands
                const commands = await vscode.commands.getCommands(true);
                
                // Check if our settings command is registered
                const hasSettingsDiscoverCommand = commands.includes('manifestoEnforcer.settings.discoverAPIs');
                
                // For now, this will fail until we implement the command registration
                // This is proper TDD - test first, then implement
                assert.strictEqual(hasSettingsDiscoverCommand, true, 
                    'manifestoEnforcer.settings.discoverAPIs command should be registered');
            } catch (error) {
                console.error('API discovery command registration test failed:', error);
                throw error;
            }
        });

        /**
         * Test connection command execution
         */
        test('should execute settings.testConnection command', async () => {
            try {
                // Execute the command and expect structured result
                const result = await vscode.commands.executeCommand('manifestoEnforcer.settings.testConnection');
                
                // Verify result structure
                assert.ok(result, 'Command should return a result');
                assert.ok(typeof result === 'object', 'Result should be an object');
                assert.ok('success' in (result as any), 'Result should have success property');
                assert.ok('message' in (result as any), 'Result should have message property');
                assert.ok('agentStatus' in (result as any), 'Result should have agentStatus property');
            } catch (error) {
                console.error('Connection test command execution failed:', error);
                throw error;
            }
        });

        /**
         * Test API discovery command execution
         */
        test('should execute settings.discoverAPIs command', async () => {
            try {
                // Execute the command and expect structured result
                const result = await vscode.commands.executeCommand('manifestoEnforcer.settings.discoverAPIs');
                
                // Verify result structure
                assert.ok(result, 'Command should return a result');
                assert.ok(typeof result === 'object', 'Result should be an object');
                assert.ok('success' in (result as any), 'Result should have success property');
                assert.ok('apis' in (result as any), 'Result should have apis property');
                assert.ok(Array.isArray((result as any).apis), 'APIs should be an array');
            } catch (error) {
                console.error('API discovery command execution failed:', error);
                throw error;
            }
        });
    });

    /**
     * Test suite for settings UI integration
     */
    suite('Settings UI Integration', () => {
        /**
         * Test that admin commands are moved to settings panel
         */
        test('should move admin commands to settings panel only', async () => {
            try {
                const commands = await vscode.commands.getCommands(true);
                
                // Old commands should not exist in main command palette
                const hasOldTestCommand = commands.includes('manifestoEnforcer.testConnection');
                const hasOldDiscoverCommand = commands.includes('piggie.discoverAPIs');
                
                // New settings commands should exist
                const hasNewTestCommand = commands.includes('manifestoEnforcer.settings.testConnection');
                const hasNewDiscoverCommand = commands.includes('manifestoEnforcer.settings.discoverAPIs');
                
                assert.strictEqual(hasOldTestCommand, false, 
                    'Old testConnection command should be removed from main palette');
                assert.strictEqual(hasOldDiscoverCommand, false, 
                    'Old discoverAPIs command should be removed from main palette');
                assert.strictEqual(hasNewTestCommand, true, 
                    'New settings.testConnection command should exist');
                assert.strictEqual(hasNewDiscoverCommand, true, 
                    'New settings.discoverAPIs command should exist');
            } catch (error) {
                console.error('Settings UI integration test failed:', error);
                throw error;
            }
        });
    });
});
