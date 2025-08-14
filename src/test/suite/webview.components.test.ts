/**
 * Webview Components Unit Tests
 * Testing individual webview components using VSCode Extension Testing Architecture
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeActionsWebview } from '../../webviews/CodeActionsWebview';
import { ManifestoWebview } from '../../webviews/ManifestoWebview';
import { GlossaryWebview } from '../../webviews/GlossaryWebview';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

suite('Webview Components Unit Tests', () => {
    let context: vscode.ExtensionContext;
    let stateManager: StateManager;
    let agentManager: AgentManager;

    suiteSetup(async () => {
        // Get the extension context from the activated extension
        const extension = vscode.extensions.getExtension('manifesto-enforcer.manifesto-enforcer');
        assert.ok(extension, 'Extension should be available');
        
        if (!extension.isActive) {
            await extension.activate();
        }
        
        context = extension.exports?.context;
        assert.ok(context, 'Extension context should be available');
    });

    setup(async () => {
        try {
            // Initialize StateManager
            stateManager = StateManager.getInstance(context);
            assert.ok(stateManager, 'StateManager should be initialized');

            // Initialize AgentManager
            agentManager = new AgentManager();
            assert.ok(agentManager, 'AgentManager should be initialized');
        } catch (error) {
            assert.fail(`Setup failed: ${error}`);
        }
    });

    suite('CodeActionsWebview', () => {
        test('should initialize with valid parameters', () => {
            try {
                const webview = new CodeActionsWebview(context, stateManager, agentManager);
                assert.ok(webview, 'CodeActionsWebview should be created');
                assert.ok(webview.stateManager, 'StateManager should be accessible');
                assert.ok(webview.agentManager, 'AgentManager should be accessible');
            } catch (error) {
                assert.fail(`CodeActionsWebview initialization failed: ${error}`);
            }
        });

        test('should throw error with invalid parameters', () => {
            assert.throws(() => {
                new CodeActionsWebview(null as any, stateManager, agentManager);
            }, /Invalid parameters provided/);

            assert.throws(() => {
                new CodeActionsWebview(context, null as any, agentManager);
            }, /Invalid parameters provided/);

            assert.throws(() => {
                new CodeActionsWebview(context, stateManager, null as any);
            }, /Invalid parameters provided/);
        });

        test('should setup webview view properly', () => {
            try {
                const webview = new CodeActionsWebview(context, stateManager, agentManager);
                const mockWebviewView = {
                    webview: {
                        options: {},
                        html: '',
                        onDidReceiveMessage: () => ({ dispose: () => {} })
                    }
                } as any;

                webview.setupView(mockWebviewView);
                assert.ok(mockWebviewView.webview.html, 'HTML content should be set');
                assert.ok(mockWebviewView.webview.options.enableScripts, 'Scripts should be enabled');
            } catch (error) {
                assert.fail(`CodeActionsWebview setupView failed: ${error}`);
            }
        });

        test('should handle refresh content', () => {
            try {
                const webview = new CodeActionsWebview(context, stateManager, agentManager);
                webview.refreshContent();
                // Should not throw error
                assert.ok(true, 'refreshContent should execute without error');
            } catch (error) {
                assert.fail(`CodeActionsWebview refreshContent failed: ${error}`);
            }
        });
    });

    suite('ManifestoWebview', () => {
        test('should initialize with valid parameters', () => {
            try {
                const webview = new ManifestoWebview(context, stateManager);
                assert.ok(webview, 'ManifestoWebview should be created');
                assert.ok(webview.stateManager, 'StateManager should be accessible');
            } catch (error) {
                assert.fail(`ManifestoWebview initialization failed: ${error}`);
            }
        });

        test('should throw error with invalid parameters', () => {
            assert.throws(() => {
                new ManifestoWebview(null as any, stateManager);
            }, /Invalid parameters provided/);

            assert.throws(() => {
                new ManifestoWebview(context, null as any);
            }, /Invalid parameters provided/);
        });

        test('should setup webview view properly', () => {
            try {
                const webview = new ManifestoWebview(context, stateManager);
                const mockWebviewView = {
                    webview: {
                        options: {},
                        html: '',
                        onDidReceiveMessage: () => ({ dispose: () => {} })
                    }
                } as any;

                webview.setupView(mockWebviewView);
                assert.ok(mockWebviewView.webview.html, 'HTML content should be set');
                assert.ok(mockWebviewView.webview.options.enableScripts, 'Scripts should be enabled');
            } catch (error) {
                assert.fail(`ManifestoWebview setupView failed: ${error}`);
            }
        });

        test('should handle refresh content', () => {
            try {
                const webview = new ManifestoWebview(context, stateManager);
                webview.refreshContent();
                // Should not throw error
                assert.ok(true, 'refreshContent should execute without error');
            } catch (error) {
                assert.fail(`ManifestoWebview refreshContent failed: ${error}`);
            }
        });
    });

    suite('GlossaryWebview', () => {
        test('should initialize with valid parameters', () => {
            try {
                const webview = new GlossaryWebview(context, stateManager);
                assert.ok(webview, 'GlossaryWebview should be created');
                assert.ok(webview.stateManager, 'StateManager should be accessible');
            } catch (error) {
                assert.fail(`GlossaryWebview initialization failed: ${error}`);
            }
        });

        test('should throw error with invalid parameters', () => {
            assert.throws(() => {
                new GlossaryWebview(null as any, stateManager);
            }, /Invalid parameters provided/);

            assert.throws(() => {
                new GlossaryWebview(context, null as any);
            }, /Invalid parameters provided/);
        });

        test('should setup webview view properly', () => {
            try {
                const webview = new GlossaryWebview(context, stateManager);
                const mockWebviewView = {
                    webview: {
                        options: {},
                        html: '',
                        onDidReceiveMessage: () => ({ dispose: () => {} })
                    }
                } as any;

                webview.setupView(mockWebviewView);
                assert.ok(mockWebviewView.webview.html, 'HTML content should be set');
                assert.ok(mockWebviewView.webview.options.enableScripts, 'Scripts should be enabled');
            } catch (error) {
                assert.fail(`GlossaryWebview setupView failed: ${error}`);
            }
        });

        test('should handle refresh content', () => {
            try {
                const webview = new GlossaryWebview(context, stateManager);
                webview.refreshContent();
                // Should not throw error
                assert.ok(true, 'refreshContent should execute without error');
            } catch (error) {
                assert.fail(`GlossaryWebview refreshContent failed: ${error}`);
            }
        });

        test('should handle glossary operations', () => {
            try {
                const webview = new GlossaryWebview(context, stateManager);

                // Test that webview can access glossary data
                assert.ok(webview.stateManager.projectGlossary, 'Should have access to project glossary');

                // Test that webview initializes with glossary data
                const initialTermCount = webview.stateManager.projectGlossary.size;
                assert.ok(initialTermCount >= 0, 'Should have valid term count');

                // Test refresh content method
                webview.refreshContent();
                assert.ok(true, 'refreshContent should execute without error');

            } catch (error) {
                assert.fail(`GlossaryWebview glossary operations failed: ${error}`);
            }
        });
    });

    suite('Webview Error Handling', () => {
        test('should handle setupView with invalid webview view', () => {
            const webviews = [
                new CodeActionsWebview(context, stateManager, agentManager),
                new ManifestoWebview(context, stateManager),
                new GlossaryWebview(context, stateManager)
            ];

            for (const webview of webviews) {
                assert.throws(() => {
                    webview.setupView(null as any);
                }, /Invalid webview view provided/);
            }
        });

        test('should handle disposal gracefully', () => {
            try {
                const webviews = [
                    new CodeActionsWebview(context, stateManager, agentManager),
                    new ManifestoWebview(context, stateManager),
                    new GlossaryWebview(context, stateManager)
                ];

                for (const webview of webviews) {
                    if (webview.dispose) {
                        webview.dispose();
                    }
                }
                
                assert.ok(true, 'Webview disposal should not throw errors');
            } catch (error) {
                assert.fail(`Webview disposal failed: ${error}`);
            }
        });
    });

    suite('Integration with StateManager', () => {
        test('should access StateManager properties correctly', () => {
            try {
                const webviews = [
                    new CodeActionsWebview(context, stateManager, agentManager),
                    new ManifestoWebview(context, stateManager),
                    new GlossaryWebview(context, stateManager)
                ];

                for (const webview of webviews) {
                    assert.ok(webview.stateManager, 'Should have StateManager reference');
                    assert.ok(webview.stateManager.projectGlossary, 'Should have access to project glossary');
                    assert.ok(typeof webview.stateManager.isManifestoMode === 'boolean', 'Should have access to manifesto mode');
                }
            } catch (error) {
                assert.fail(`StateManager integration test failed: ${error}`);
            }
        });
    });
});
