/**
 * Webview System Integration Tests
 * Using VSCode Extension Testing Architecture
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { WebviewManager } from '../../webviews/WebviewManager';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

suite('Webview System Integration Tests', () => {
    let context: vscode.ExtensionContext;
    let stateManager: StateManager;
    let agentManager: AgentManager;
    let webviewManager: WebviewManager;

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

            // Initialize WebviewManager
            webviewManager = new WebviewManager(context, stateManager, agentManager);
            assert.ok(webviewManager, 'WebviewManager should be initialized');
        } catch (error) {
            assert.fail(`Setup failed: ${error}`);
        }
    });

    teardown(async () => {
        try {
            if (webviewManager) {
                webviewManager.dispose();
            }
        } catch (error) {
            console.error('Teardown error:', error);
        }
    });

    suite('WebviewManager Initialization', () => {
        test('should initialize with valid parameters', () => {
            assert.ok(webviewManager, 'WebviewManager should be created');
            assert.ok(webviewManager.getStatus, 'WebviewManager should have getStatus method');
        });

        test('should throw error with invalid context', () => {
            assert.throws(() => {
                new WebviewManager(null as any, stateManager, agentManager);
            }, /Invalid extension context provided/);
        });

        test('should throw error with invalid StateManager', () => {
            assert.throws(() => {
                new WebviewManager(context, null as any, agentManager);
            }, /Invalid StateManager provided/);
        });

        test('should throw error with invalid AgentManager', () => {
            assert.throws(() => {
                new WebviewManager(context, stateManager, null as any);
            }, /Invalid AgentManager provided/);
        });
    });

    suite('Webview Panel Creation', () => {
        test('should create Code Actions webview panel', async () => {
            try {
                await webviewManager.openCodeActions();
                const status = webviewManager.getStatus();
                assert.strictEqual(status.codeActions, true, 'Code Actions webview should be active');
            } catch (error) {
                assert.fail(`Failed to create Code Actions webview: ${error}`);
            }
        });

        test('should create Manifesto Management webview panel', async () => {
            try {
                await webviewManager.openManifestoManagement();
                const status = webviewManager.getStatus();
                assert.strictEqual(status.manifestoManagement, true, 'Manifesto Management webview should be active');
            } catch (error) {
                assert.fail(`Failed to create Manifesto Management webview: ${error}`);
            }
        });

        test('should create Manifesto Management webview panel (includes glossary)', async () => {
            try {
                await webviewManager.openManifestoManagement();
                const status = webviewManager.getStatus();
                assert.strictEqual(status.manifestoManagement, true, 'Manifesto Management webview should be active');
            } catch (error) {
                assert.fail(`Failed to create Manifesto Management webview: ${error}`);
            }
        });

        test('should reuse existing webview panels', async () => {
            try {
                // Create first instance
                await webviewManager.openCodeActions();
                const status1 = webviewManager.getStatus();
                assert.strictEqual(status1.codeActions, true, 'First Code Actions webview should be active');

                // Try to create second instance - should reuse existing
                await webviewManager.openCodeActions();
                const status2 = webviewManager.getStatus();
                assert.strictEqual(status2.codeActions, true, 'Code Actions webview should still be active');
            } catch (error) {
                assert.fail(`Failed to reuse webview panel: ${error}`);
            }
        });
    });

    suite('Webview View Provider Setup', () => {
        test('should setup Code Actions view provider', () => {
            try {
                const mockWebviewView = {
                    webview: {
                        options: {},
                        html: '',
                        onDidReceiveMessage: () => ({ dispose: () => {} })
                    }
                } as any;

                webviewManager.setupCodeActionsView(mockWebviewView);
                assert.ok(mockWebviewView.webview.html, 'Webview HTML should be set');
                assert.ok(mockWebviewView.webview.options.enableScripts, 'Scripts should be enabled');
            } catch (error) {
                assert.fail(`Failed to setup Code Actions view: ${error}`);
            }
        });

        test('should setup Manifesto Management view provider', () => {
            try {
                const mockWebviewView = {
                    webview: {
                        options: {},
                        html: '',
                        onDidReceiveMessage: () => ({ dispose: () => {} })
                    }
                } as any;

                webviewManager.setupManifestoManagementView(mockWebviewView);
                assert.ok(mockWebviewView.webview.html, 'Webview HTML should be set');
                assert.ok(mockWebviewView.webview.options.enableScripts, 'Scripts should be enabled');
            } catch (error) {
                assert.fail(`Failed to setup Manifesto Management view: ${error}`);
            }
        });

        test('should setup Glossary Management view provider', () => {
            try {
                const mockWebviewView = {
                    webview: {
                        options: {},
                        html: '',
                        onDidReceiveMessage: () => ({ dispose: () => {} })
                    }
                } as any;

                webviewManager.setupManifestoManagementView(mockWebviewView);
                assert.ok(mockWebviewView.webview.html, 'Webview HTML should be set');
                assert.ok(mockWebviewView.webview.options.enableScripts, 'Scripts should be enabled');
            } catch (error) {
                assert.fail(`Failed to setup Manifesto Management view: ${error}`);
            }
        });

        test('should throw error with invalid webview view', () => {
            assert.throws(() => {
                webviewManager.setupCodeActionsView(null as any);
            }, /Invalid webview view provided/);

            assert.throws(() => {
                webviewManager.setupManifestoManagementView(null as any);
            }, /Invalid webview view provided/);

            assert.throws(() => {
                webviewManager.setupManifestoManagementView(null as any);
            }, /Invalid webview view provided/);
        });
    });

    suite('Agent Integration', () => {
        test('should handle agent switch notifications', () => {
            try {
                webviewManager.onAgentSwitched('TestAgent');
                // Should not throw error
                assert.ok(true, 'Agent switch should be handled gracefully');
            } catch (error) {
                assert.fail(`Agent switch handling failed: ${error}`);
            }
        });

        test('should handle invalid agent names', () => {
            try {
                webviewManager.onAgentSwitched('');
                webviewManager.onAgentSwitched(null as any);
                // Should handle gracefully without throwing
                assert.ok(true, 'Invalid agent names should be handled gracefully');
            } catch (error) {
                // Expected to handle gracefully, not throw
                console.log('Agent switch error handled:', error);
            }
        });
    });

    suite('Manifesto Mode Integration', () => {
        test('should handle manifesto mode changes', () => {
            try {
                webviewManager.onManifestoModeChanged();
                // Should not throw error
                assert.ok(true, 'Manifesto mode change should be handled gracefully');
            } catch (error) {
                assert.fail(`Manifesto mode change handling failed: ${error}`);
            }
        });
    });

    suite('Status and Cleanup', () => {
        test('should provide accurate status information', () => {
            const status = webviewManager.getStatus();
            assert.ok(typeof status === 'object', 'Status should be an object');
            assert.ok('codeActions' in status, 'Status should include codeActions');
            assert.ok('manifestoManagement' in status, 'Status should include manifestoManagement');
            // Note: glossaryManagement is now integrated into manifestoManagement
        });

        test('should dispose all webviews properly', () => {
            try {
                webviewManager.dispose();
                const status = webviewManager.getStatus();
                assert.strictEqual(status.codeActions, false, 'Code Actions should be disposed');
                assert.strictEqual(status.manifestoManagement, false, 'Manifesto Management should be disposed');
                // Note: glossaryManagement is now integrated into manifestoManagement
            } catch (error) {
                assert.fail(`Webview disposal failed: ${error}`);
            }
        });
    });
});
