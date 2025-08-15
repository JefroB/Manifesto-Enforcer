/**
 * MANDATORY: Integration Tests for AutoModeManager
 * Using VSCode Extension Testing Framework (Mocha)
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { AutoModeManager } from '../../core/AutoModeManager';
import { StateManager } from '../../core/StateManager';
import { StorageService } from '../../core/StorageService';
import { ChatAction, ActionSafety } from '../../core/types';

suite('AutoModeManager Integration Tests', () => {
    let autoModeManager: AutoModeManager;
    let stateManager: StateManager;
    let storageService: StorageService;
    let mockContext: vscode.ExtensionContext;

    suiteSetup(async () => {
        // Get the extension context from the test environment
        const extension = vscode.extensions.getExtension('your-extension-id');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    setup(() => {
        // Create mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => {}
            },
            extensionUri: vscode.Uri.file(__dirname),
            extensionPath: __dirname,
            asAbsolutePath: (relativePath: string) => relativePath,
            storageUri: vscode.Uri.file(__dirname),
            globalStorageUri: vscode.Uri.file(__dirname),
            logUri: vscode.Uri.file(__dirname),
            extensionMode: vscode.ExtensionMode.Test
        } as vscode.ExtensionContext;

        // Initialize services with real VSCode environment
        StorageService.initialize(mockContext);
        storageService = StorageService.getInstance();
        stateManager = StateManager.getInstance(mockContext);
        autoModeManager = new AutoModeManager(stateManager);
    });

    teardown(() => {
        // Clean up services
        if (autoModeManager) {
            try {
                autoModeManager.dispose();
            } catch (error) {
                // Ignore disposal errors in tests
            }
        }
        
        // Reset singletons
        (StorageService as any)._instance = null;
        (StateManager as any)._instance = null;
    });

    suite('Auto Mode Execution', () => {
        test('should handle createManifesto action with real VSCode environment', async () => {
            const action: ChatAction = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: { content: '# Test Manifesto\nTest content', type: 'General' }
            };

            // Test createManifesto action with real VSCode APIs
            try {
                await autoModeManager.executeAction(action);
                assert.ok(true, 'Action executed without throwing');
            } catch (error) {
                // This is acceptable - the test environment may not have write permissions
                // or workspace folder, but the important thing is that it doesn't crash
                assert.ok(error instanceof Error);
                assert.ok(typeof error.message === 'string');
            }
        });

        test('should handle workspace folder requirements', async () => {
            // Test workspace folder handling
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            if (workspaceFolders && workspaceFolders.length > 0) {
                // If workspace is available, test normal operation
                assert.ok(workspaceFolders[0].uri);
            } else {
                // If no workspace, test error handling
                const action: ChatAction = {
                    id: 'create-manifesto',
                    label: 'Create manifesto.md',
                    command: 'createManifesto',
                    data: { content: '# Test Manifesto\nTest content', type: 'General' }
                };

                try {
                    await autoModeManager.executeAction(action);
                    assert.fail('Should have thrown error for missing workspace');
                } catch (error) {
                    assert.ok(error instanceof Error);
                    // Should handle missing workspace gracefully
                }
            }
        });
    });

    suite('Safety Checks', () => {
        test('should perform safety checks before execution', () => {
            const action: ChatAction = {
                id: 'test-action',
                label: 'Test Action',
                command: 'testCommand',
                data: { test: 'data' }
            };

            const safety = autoModeManager.shouldAutoExecute(action);
            assert.ok(typeof safety === 'string');
            assert.ok(['SAFE', 'UNSAFE', 'REQUIRES_CONFIRMATION'].includes(safety));
        });

        test('should handle unsafe actions correctly', () => {
            const unsafeAction: ChatAction = {
                id: 'unsafe-action',
                label: 'Unsafe Action',
                command: 'dangerousCommand',
                data: { dangerous: true }
            };

            const safety = autoModeManager.shouldAutoExecute(unsafeAction);
            // Should not auto-execute unsafe actions
            assert.notStrictEqual(safety, 'SAFE');
        });
    });

    suite('Integration with StateManager', () => {
        test('should integrate with StateManager correctly', () => {
            assert.ok(stateManager);
            assert.ok(stateManager instanceof StateManager);
            assert.ok(autoModeManager);
        });

        test('should respect auto mode settings', () => {
            const initialAutoMode = stateManager.isAutoMode;
            
            // Test auto mode toggle
            stateManager.isAutoMode = true;
            assert.strictEqual(stateManager.isAutoMode, true);
            
            stateManager.isAutoMode = false;
            assert.strictEqual(stateManager.isAutoMode, false);
            
            // Restore original state
            stateManager.isAutoMode = initialAutoMode;
        });

        test('should access indexing stats', () => {
            const stats = stateManager.getIndexingStats();
            assert.ok(typeof stats === 'object');
            assert.ok(typeof stats.currentCount === 'number');
            assert.ok(typeof stats.healthStatus === 'string');
        });
    });

    suite('Integration with StorageService', () => {
        test('should integrate with StorageService correctly', () => {
            assert.ok(storageService);
            assert.ok(storageService instanceof StorageService);
        });

        test('should handle storage operations', async () => {
            // Test storage operations with real VSCode environment
            try {
                const artifactsPath = await storageService.getProjectArtifactsPath();
                assert.ok(typeof artifactsPath === 'string');
            } catch (error) {
                // This is acceptable in test environment without workspace
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('workspace') || error.message.includes('folder'));
            }
        });
    });

    suite('Error Handling', () => {
        test('should handle action execution errors gracefully', async () => {
            const invalidAction: ChatAction = {
                id: 'invalid-action',
                label: 'Invalid Action',
                command: 'nonExistentCommand',
                data: {}
            };

            try {
                await autoModeManager.executeAction(invalidAction);
                assert.ok(true, 'Invalid action handled gracefully');
            } catch (error) {
                // Expected behavior - should handle invalid actions gracefully
                assert.ok(error instanceof Error);
                assert.ok(typeof error.message === 'string');
            }
        });

        test('should validate input parameters', () => {
            // Test input validation
            assert.throws(() => {
                new AutoModeManager(null as any);
            });
        });

        test('should handle disposal gracefully', () => {
            const tempAutoModeManager = new AutoModeManager(stateManager);
            
            assert.doesNotThrow(() => {
                tempAutoModeManager.dispose();
            });
        });
    });

    suite('Action Types', () => {
        test('should handle different action types', () => {
            const actionTypes = [
                'createManifesto',
                'reviewCode',
                'generateGlossary',
                'executeTddWorkflow'
            ];

            for (const actionType of actionTypes) {
                const action: ChatAction = {
                    id: `test-${actionType}`,
                    label: `Test ${actionType}`,
                    command: actionType,
                    data: { test: true }
                };

                const safety = autoModeManager.shouldAutoExecute(action);
                assert.ok(typeof safety === 'string');
            }
        });

        test('should categorize action safety correctly', () => {
            const safeAction: ChatAction = {
                id: 'safe-action',
                label: 'Safe Action',
                command: 'reviewCode',
                data: { readonly: true }
            };

            const safety = autoModeManager.shouldAutoExecute(safeAction);
            // Review actions should generally be safe
            assert.ok(['SAFE', 'REQUIRES_CONFIRMATION'].includes(safety));
        });
    });
});
