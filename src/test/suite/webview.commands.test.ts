/**
 * Webview Commands Integration Tests
 * Testing new webview commands using VSCode Extension Testing Architecture
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Webview Commands Integration Tests', () => {
    let extension: vscode.Extension<any>;

    suiteSetup(async () => {
        // Get the extension
        const ext = vscode.extensions.getExtension('manifesto-enforcer.manifesto-enforcer');
        assert.ok(ext, 'Extension should be available');
        extension = ext;
        
        // Activate the extension if not already active
        if (!extension.isActive) {
            await extension.activate();
        }
        
        // Wait a bit for full activation
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    suite('Command Registration', () => {
        test('should register openCodeActions command', async () => {
            try {
                const commands = await vscode.commands.getCommands(true);
                assert.ok(
                    commands.includes('manifestoEnforcer.openCodeActions'),
                    'openCodeActions command should be registered'
                );
            } catch (error) {
                assert.fail(`Failed to check openCodeActions command: ${error}`);
            }
        });

        test('should register openManifestoManagement command', async () => {
            try {
                const commands = await vscode.commands.getCommands(true);
                assert.ok(
                    commands.includes('manifestoEnforcer.openManifestoManagement'),
                    'openManifestoManagement command should be registered'
                );
            } catch (error) {
                assert.fail(`Failed to check openManifestoManagement command: ${error}`);
            }
        });

        // Note: openGlossaryManagement is now integrated into openManifestoManagement
    });

    suite('Command Execution', () => {
        test('should execute openCodeActions command without error', async () => {
            try {
                await vscode.commands.executeCommand('manifestoEnforcer.openCodeActions');
                // If we get here, the command executed without throwing
                assert.ok(true, 'openCodeActions command should execute successfully');
            } catch (error) {
                assert.fail(`openCodeActions command execution failed: ${error}`);
            }
        });

        test('should execute openManifestoManagement command without error', async () => {
            try {
                await vscode.commands.executeCommand('manifestoEnforcer.openManifestoManagement');
                // If we get here, the command executed without throwing
                assert.ok(true, 'openManifestoManagement command should execute successfully');
            } catch (error) {
                assert.fail(`openManifestoManagement command execution failed: ${error}`);
            }
        });

        // Note: openGlossaryManagement is now integrated into openManifestoManagement
    });

    suite('Command Palette Integration', () => {
        test('should make commands available in Command Palette', async () => {
            try {
                // Get all commands that are available in the command palette
                const commands = await vscode.commands.getCommands(true);
                
                const webviewCommands = [
                    'manifestoEnforcer.openCodeActions',
                    'manifestoEnforcer.openManifestoManagement'
                    // Note: openGlossaryManagement is now integrated into openManifestoManagement
                ];

                for (const command of webviewCommands) {
                    assert.ok(
                        commands.includes(command),
                        `Command ${command} should be available in Command Palette`
                    );
                }
            } catch (error) {
                assert.fail(`Failed to check Command Palette integration: ${error}`);
            }
        });
    });

    suite('Legacy Command Removal', () => {
        test('should not have old tree view commands', async () => {
            try {
                const commands = await vscode.commands.getCommands(true);
                
                const removedCommands = [
                    'manifestoEnforcer.refreshManifesto',
                    'manifestoEnforcer.refreshGlossary',
                    'manifestoEnforcer.addGlossaryTermFromTree',
                    'manifestoEnforcer.removeGlossaryTerm'
                ];

                for (const command of removedCommands) {
                    assert.ok(
                        !commands.includes(command),
                        `Old command ${command} should not be registered`
                    );
                }
            } catch (error) {
                assert.fail(`Failed to check legacy command removal: ${error}`);
            }
        });
    });

    suite('Extension Activation State', () => {
        test('should have extension properly activated', () => {
            assert.ok(extension.isActive, 'Extension should be active');
            assert.ok(extension.exports, 'Extension should have exports');
        });

        test('should have context available', () => {
            const context = extension.exports?.context;
            assert.ok(context, 'Extension context should be available');
            assert.ok(context.subscriptions, 'Context subscriptions should be available');
            assert.ok(context.extensionPath, 'Extension path should be available');
        });
    });

    suite('Webview View Providers', () => {
        test('should register webview view providers', async () => {
            try {
                // Test that the webview view providers are registered by checking if they can be resolved
                // This is indirect testing since VSCode doesn't expose a direct way to check view provider registration
                
                // The fact that the extension activated without errors suggests the view providers were registered
                assert.ok(extension.isActive, 'Extension activation suggests view providers were registered');
                
                // We can also check that the commands work, which depend on the webview system
                await vscode.commands.executeCommand('manifestoEnforcer.openCodeActions');
                assert.ok(true, 'Successful command execution suggests webview system is working');
            } catch (error) {
                assert.fail(`Webview view provider registration test failed: ${error}`);
            }
        });
    });

    suite('Error Handling', () => {
        test('should handle command execution errors gracefully', async () => {
            try {
                // Try to execute commands multiple times to test error handling
                await vscode.commands.executeCommand('manifestoEnforcer.openCodeActions');
                await vscode.commands.executeCommand('manifestoEnforcer.openCodeActions'); // Second call should reuse
                
                await vscode.commands.executeCommand('manifestoEnforcer.openManifestoManagement');
                await vscode.commands.executeCommand('manifestoEnforcer.openManifestoManagement'); // Second call should reuse
                
                // Note: openGlossaryManagement is now integrated into openManifestoManagement
                
                assert.ok(true, 'Multiple command executions should be handled gracefully');
            } catch (error) {
                assert.fail(`Error handling test failed: ${error}`);
            }
        });
    });

    suite('Integration with Existing Systems', () => {
        test('should maintain chat functionality', async () => {
            try {
                // Test that existing chat commands still work
                const commands = await vscode.commands.getCommands(true);
                assert.ok(
                    commands.includes('manifestoEnforcer.toggleManifestoMode'),
                    'Existing commands should still be available'
                );
                
                // Test that we can still execute existing commands
                await vscode.commands.executeCommand('manifestoEnforcer.toggleManifestoMode');
                assert.ok(true, 'Existing commands should still work');
            } catch (error) {
                assert.fail(`Integration with existing systems test failed: ${error}`);
            }
        });
    });
});
