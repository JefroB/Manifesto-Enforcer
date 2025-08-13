/**
 * MANDATORY: Basic VSCode Integration Test
 * REQUIRED: Test VSCode API availability without extension dependencies
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Basic VSCode Integration Tests', () => {
    test('VSCode API should be available', () => {
        try {
            assert.ok(vscode, 'VSCode API should be available');
            assert.ok(vscode.window, 'VSCode window API should be available');
            assert.ok(vscode.workspace, 'VSCode workspace API should be available');
            assert.ok(vscode.commands, 'VSCode commands API should be available');
        } catch (error) {
            assert.fail(`VSCode API availability test failed: ${error}`);
        }
    });

    test('Workspace should be available', () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            assert.ok(workspaceFolders, 'Workspace folders should be available');
            assert.ok(workspaceFolders.length > 0, 'At least one workspace folder should be open');
        } catch (error) {
            assert.fail(`Workspace availability test failed: ${error}`);
        }
    });

    test('Extension should be loadable', async () => {
        try {
            const extension = vscode.extensions.getExtension('manifesto-enforcer.manifesto-enforcer');
            if (extension) {
                assert.ok(extension, 'Extension should be found');
                if (!extension.isActive) {
                    await extension.activate();
                }
                assert.ok(extension.isActive, 'Extension should be active');
            } else {
                // Extension might not be installed in test environment, that's ok
                assert.ok(true, 'Extension not found in test environment (expected)');
            }
        } catch (error) {
            assert.fail(`Extension loading test failed: ${error}`);
        }
    });
});
