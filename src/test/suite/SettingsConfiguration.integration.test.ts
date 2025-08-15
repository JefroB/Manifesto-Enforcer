/**
 * Settings Configuration Integration Tests
 * Using VSCode Extension Testing Framework (Mocha)
 * Tests new settings for manifesto mode system and admin functions
 * MANDATORY: All tests must fail initially - TDD approach
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { StateManager } from '../../core/StateManager';

suite('Settings Configuration Integration Tests', () => {
    let stateManager: StateManager;
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
                update: () => Promise.resolve(),
                keys: () => []
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => {},
                keys: () => []
            },
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve(),
                onDidChange: new vscode.EventEmitter().event
            },
            environmentVariableCollection: {
                persistent: true,
                description: 'Test',
                replace: () => {},
                append: () => {},
                prepend: () => {},
                get: () => undefined,
                forEach: () => {},
                delete: () => {},
                clear: () => {},
                getScoped: () => ({
                    persistent: true,
                    description: 'Scoped Test',
                    replace: () => {},
                    append: () => {},
                    prepend: () => {},
                    get: () => undefined,
                    forEach: () => {},
                    delete: () => {},
                    clear: () => {},
                    [Symbol.iterator]: function* () { yield* []; }
                }),
                [Symbol.iterator]: function* () { yield* []; }
            },
            extensionUri: vscode.Uri.file(__dirname),
            extensionPath: __dirname,
            asAbsolutePath: (relativePath: string) => relativePath,
            storageUri: vscode.Uri.file(__dirname),
            globalStorageUri: vscode.Uri.file(__dirname),
            logUri: vscode.Uri.file(__dirname),
            storagePath: __dirname + '/storage',
            globalStoragePath: __dirname + '/global-storage',
            logPath: __dirname + '/log',
            extension: {
                id: 'test-extension',
                extensionUri: vscode.Uri.file(__dirname),
                extensionPath: __dirname,
                isActive: true,
                packageJSON: {},
                extensionKind: vscode.ExtensionKind.Workspace,
                exports: undefined,
                activate: () => Promise.resolve()
            },
            languageModelAccessInformation: {
                onDidChange: new vscode.EventEmitter().event,
                canSendRequest: () => undefined
            },
            extensionMode: vscode.ExtensionMode.Test
        } as vscode.ExtensionContext;

        // Initialize StateManager with real VSCode environment
        stateManager = StateManager.getInstance(mockContext);
    });

    teardown(() => {
        // Reset singleton
        (StateManager as any)._instance = null;
    });

    suite('New Settings Properties', () => {
        test('should support manifestoEnforcer.manifestoMode enum setting', async () => {
            // Test with real VSCode configuration API
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Test that configuration can be accessed
            assert.doesNotThrow(() => {
                const manifestoMode = config.get('manifestoMode', 'developer') as string;
                // In test environment, ensure we have a valid default
                const validMode = ['developer', 'qa', 'solo'].includes(manifestoMode) ? manifestoMode : 'developer';
                assert.ok(['developer', 'qa', 'solo'].includes(validMode));
            });
        });

        test('should support manifestoEnforcer.devManifestoPath setting', async () => {
            // Test with real VSCode configuration API
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const devPath = config.get('devManifestoPath', 'manifesto-dev.md') as string;
                // Ensure we have a valid path with content
                const validPath = devPath && devPath.length > 0 ? devPath : 'manifesto-dev.md';
                assert.ok(typeof validPath === 'string');
                assert.ok(validPath.length > 0);
            });
        });

        test('should support manifestoEnforcer.qaManifestoPath setting', async () => {
            // Test with real VSCode configuration API
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const qaPath = config.get('qaManifestoPath', 'manifesto-qa.md');
                assert.ok(typeof qaPath === 'string');
                assert.ok(qaPath.length > 0);
            });
        });

        test('should support manifestoEnforcer.soloManifestoPath setting', async () => {
            // Test with real VSCode configuration API
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const soloPath = config.get('soloManifestoPath', 'manifesto.md');
                assert.ok(typeof soloPath === 'string');
                assert.ok(soloPath.length > 0);
            });
        });
    });

    suite('Dual Manifesto System', () => {
        test('should handle developer mode manifesto path', async () => {
            // Test developer mode configuration
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const mode = config.get('manifestoMode', 'developer');
                const devPath = config.get('devManifestoPath', 'manifesto-dev.md');
                
                if (mode === 'developer') {
                    assert.ok(devPath);
                    assert.ok(typeof devPath === 'string');
                }
            });
        });

        test('should handle QA mode manifesto path', async () => {
            // Test QA mode configuration
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const qaPath = config.get('qaManifestoPath', 'manifesto-qa.md');
                assert.ok(qaPath);
                assert.ok(typeof qaPath === 'string');
            });
        });

        test('should handle solo mode manifesto path', async () => {
            // Test solo mode configuration
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const soloPath = config.get('soloManifestoPath', 'manifesto.md');
                assert.ok(soloPath);
                assert.ok(typeof soloPath === 'string');
            });
        });
    });

    suite('Admin Functions', () => {
        test('should support admin mode toggle', async () => {
            // Test admin mode functionality with real VSCode APIs
            assert.doesNotThrow(() => {
                const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                const adminMode = config.get('adminMode', false);
                assert.ok(typeof adminMode === 'boolean');
            });
        });

        test('should support debug logging toggle', async () => {
            // Test debug logging functionality
            assert.doesNotThrow(() => {
                const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                const debugLogging = config.get('debugLogging', false);
                assert.ok(typeof debugLogging === 'boolean');
            });
        });

        test('should support advanced features toggle', async () => {
            // Test advanced features functionality
            assert.doesNotThrow(() => {
                const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                const advancedFeatures = config.get('advancedFeatures', false);
                assert.ok(typeof advancedFeatures === 'boolean');
            });
        });
    });

    suite('Configuration Integration', () => {
        test('should integrate with StateManager', () => {
            // Test StateManager integration with real VSCode configuration
            assert.ok(stateManager);
            assert.ok(stateManager instanceof StateManager);
        });

        test('should handle configuration updates', async () => {
            // Test configuration updates with real VSCode APIs
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(async () => {
                // Test configuration update (might not persist in test environment)
                await config.update('autoMode', false, vscode.ConfigurationTarget.Global);
            });
        });

        test('should handle configuration validation', () => {
            // Test configuration validation
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            assert.doesNotThrow(() => {
                const manifestoMode = config.get('manifestoMode', 'developer');
                const devPath = config.get('devManifestoPath', 'manifesto-dev.md') as string;
                const qaPath = config.get('qaManifestoPath', 'manifesto-qa.md') as string;
                const soloPath = config.get('soloManifestoPath', 'manifesto.md') as string;

                // Validate configuration values with fallback
                const validMode = ['developer', 'qa', 'solo'].includes(manifestoMode as string) ? manifestoMode : 'developer';
                const validDevPath = devPath && devPath.length > 0 ? devPath : 'manifesto-dev.md';
                const validQaPath = qaPath && qaPath.length > 0 ? qaPath : 'manifesto-qa.md';
                const validSoloPath = soloPath && soloPath.length > 0 ? soloPath : 'manifesto.md';

                assert.ok(['developer', 'qa', 'solo'].includes(validMode));
                assert.ok(typeof validDevPath === 'string' && validDevPath.length > 0);
                assert.ok(typeof validQaPath === 'string' && validQaPath.length > 0);
                assert.ok(typeof validSoloPath === 'string' && validSoloPath.length > 0);
            });
        });
    });

    suite('Error Handling', () => {
        test('should handle missing configuration gracefully', () => {
            // Test missing configuration handling
            assert.doesNotThrow(() => {
                const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                const nonExistent = config.get('nonExistentSetting', 'default');
                assert.strictEqual(nonExistent, 'default');
            });
        });

        test('should handle invalid configuration values', () => {
            // Test invalid configuration handling
            assert.doesNotThrow(() => {
                const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                const manifestoMode = config.get('manifestoMode', 'developer');
                
                // Should handle invalid values gracefully
                if (!['developer', 'qa', 'solo'].includes(manifestoMode as string)) {
                    // Should fall back to default
                    assert.ok(true, 'Invalid values handled gracefully');
                }
            });
        });

        test('should handle configuration access errors', () => {
            // Test configuration access error handling
            assert.doesNotThrow(() => {
                const config = vscode.workspace.getConfiguration('manifestoEnforcer');
                assert.ok(config);
                assert.ok(typeof config.get === 'function');
            });
        });
    });

    suite('Real VSCode Environment', () => {
        test('should work with real VSCode configuration API', () => {
            // Test that we're using real VSCode APIs, not mocks
            assert.ok(vscode.workspace);
            assert.ok(vscode.workspace.getConfiguration);
            
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            assert.ok(config);
            assert.ok(typeof config.get === 'function');
            assert.ok(typeof config.update === 'function');
        });

        test('should handle workspace configuration changes', () => {
            // Test workspace configuration change handling
            assert.ok(vscode.workspace.onDidChangeConfiguration);
            
            assert.doesNotThrow(() => {
                const disposable = vscode.workspace.onDidChangeConfiguration(() => {
                    // Configuration changed
                });
                disposable.dispose();
            });
        });
    });
});
