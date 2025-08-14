/**
 * MANDATORY: File Generation and Editor Integration Tests
 * PURPOSE: Test that generated files are saved to workspace root and open in VS Code editor
 * REQUIREMENT: Use Mocha framework for VS Code integration testing
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as sinon from 'sinon';
import { TddCodeGenerationCommand } from '../../commands/TddCodeGenerationCommand';
import { AutoModeManager } from '../../core/AutoModeManager';
import { StateManager } from '../../core/StateManager';

suite('File Generation and Editor Integration', () => {
    let sandbox: sinon.SinonSandbox;
    let mockStateManager: StateManager;
    let mockAgentManager: any;

    setup(() => {
        sandbox = sinon.createSandbox();
        
        // Create mock StateManager with proper codebase index
        const mockCodebaseIndex = new Map();
        mockCodebaseIndex.set('package.json', {
            content: JSON.stringify({
                dependencies: { react: '^18.0.0' },
                devDependencies: { jest: '^29.0.0' }
            })
        });

        mockStateManager = {
            isCodebaseIndexed: true,
            techStack: 'javascript',
            testFramework: 'jest',
            isUiTddMode: false,
            uiTestFramework: '',
            codebaseIndex: mockCodebaseIndex,
            setTechStack: sandbox.stub(),
            setTestFramework: sandbox.stub(),
            setUiTestFramework: sandbox.stub()
        } as any;

        // Create mock AgentManager
        mockAgentManager = {
            sendMessage: sandbox.stub().resolves('mock generated code')
        };
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should save files to workspace root and open in editor', async () => {
        // Mock workspace folders to return a controlled project path
        const mockWorkspaceRoot = path.resolve('/mock/workspace');
        const mockWorkspaceFolders = [{
            uri: { fsPath: mockWorkspaceRoot },
            name: 'test-workspace',
            index: 0
        }];

        sandbox.stub(vscode.workspace, 'workspaceFolders').value(mockWorkspaceFolders);

        // Mock vscode.window.showTextDocument to verify it gets called
        const showTextDocumentStub = sandbox.stub(vscode.window, 'showTextDocument').resolves({} as any);

        // Mock vscode.workspace.openTextDocument
        const openTextDocumentStub = sandbox.stub(vscode.workspace, 'openTextDocument').resolves({} as any);

        // Mock the file system operations by stubbing the entire fs object
        const mockFs = {
            writeFile: sandbox.stub().resolves(),
            createDirectory: sandbox.stub().resolves()
        };
        sandbox.stub(vscode.workspace, 'fs').value(mockFs);

        // Instantiate and call the TDD command
        const tddCommand = new TddCodeGenerationCommand();

        // Mock the runTests method to avoid terminal creation issues in test environment
        sandbox.stub(tddCommand as any, 'runTests').resolves('failing');

        // Execute the TDD workflow
        const result = await tddCommand.execute('Create a simple function', mockStateManager, mockAgentManager);

        // Assert that vscode.workspace.fs.writeFile was called with a file path that starts with the mock workspace root
        assert.ok(mockFs.writeFile.called, 'vscode.workspace.fs.writeFile should be called');

        const writeFileCall = mockFs.writeFile.getCall(0);
        const fileUri = writeFileCall.args[0] as vscode.Uri;

        // Normalize paths for cross-platform compatibility (case-insensitive on Windows)
        const normalizedFilePath = path.normalize(fileUri.fsPath).toLowerCase();
        const normalizedWorkspaceRoot = path.normalize(mockWorkspaceRoot).toLowerCase();

        // The file path should start with the mock workspace root
        assert.ok(
            normalizedFilePath.startsWith(normalizedWorkspaceRoot),
            `File path should start with workspace root. Expected to start with: ${normalizedWorkspaceRoot}, but got: ${normalizedFilePath}`
        );

        // The file should be in either src/ or tests/ subdirectory
        const relativePath = path.relative(normalizedWorkspaceRoot, normalizedFilePath);
        assert.ok(
            relativePath.startsWith('src' + path.sep) || relativePath.startsWith('tests' + path.sep),
            `File should be in src/ or tests/ subdirectory. Got: ${relativePath}`
        );

        // Assert that vscode.window.showTextDocument was called with the URI of the newly created file
        assert.ok(openTextDocumentStub.called, 'vscode.workspace.openTextDocument should be called');
        assert.ok(showTextDocumentStub.called, 'vscode.window.showTextDocument should be called');

        const showDocumentCall = showTextDocumentStub.getCall(0);
        const documentArg = showDocumentCall.args[0];
        assert.ok(documentArg, 'showTextDocument should be called with a document');
    });

    test('should save files to workspace root in AutoModeManager and open in editor', async () => {
        // Mock workspace folders to return a controlled project path
        const mockWorkspaceRoot = path.resolve('/mock/workspace');
        const mockWorkspaceFolders = [{
            uri: { fsPath: mockWorkspaceRoot },
            name: 'test-workspace',
            index: 0
        }];

        sandbox.stub(vscode.workspace, 'workspaceFolders').value(mockWorkspaceFolders);

        // Mock vscode.window.showTextDocument to verify it gets called
        const showTextDocumentStub = sandbox.stub(vscode.window, 'showTextDocument').resolves({} as any);

        // Mock vscode.workspace.openTextDocument
        const openTextDocumentStub = sandbox.stub(vscode.workspace, 'openTextDocument').resolves({} as any);

        // Mock PiggieFileManager to return success with a path
        const mockFileManager = {
            writeCodeToFile: sandbox.stub().resolves({
                success: true,
                path: path.join(mockWorkspaceRoot, 'src', 'test-file.js')
            })
        };

        // Create AutoModeManager and inject mock file manager
        const autoModeManager = new AutoModeManager(mockStateManager);
        (autoModeManager as any).fileManager = mockFileManager;

        // Create test action
        const testAction = {
            id: 'test-create-file',
            command: 'createFile',
            label: 'Create Test File',
            data: {
                fileName: 'test-file.js',
                content: 'console.log("test");',
                fileType: 'javascript'
            }
        };

        // Execute the action
        const result = await autoModeManager.executeAction(testAction, mockAgentManager);

        // Assert that the file was created successfully
        assert.ok(mockFileManager.writeCodeToFile.called, 'writeCodeToFile should be called');

        // Assert that vscode.window.showTextDocument was called to open the file in editor
        assert.ok(openTextDocumentStub.called, 'vscode.workspace.openTextDocument should be called');
        assert.ok(showTextDocumentStub.called, 'vscode.window.showTextDocument should be called');

        // Verify the file URI passed to openTextDocument
        const openDocumentCall = openTextDocumentStub.getCall(0);
        const fileUri = openDocumentCall.args[0] as vscode.Uri;

        // Normalize paths for cross-platform compatibility (case-insensitive on Windows)
        const normalizedFilePath = path.normalize(fileUri.fsPath).toLowerCase();
        const normalizedWorkspaceRoot = path.normalize(mockWorkspaceRoot).toLowerCase();

        assert.ok(
            normalizedFilePath.startsWith(normalizedWorkspaceRoot),
            `File URI should start with workspace root. Expected to start with: ${normalizedWorkspaceRoot}, but got: ${normalizedFilePath}`
        );
    });

    test('should trigger TDD workflow when executeTddWorkflow action is executed', async () => {
        // Mock workspace folders to return a controlled project path
        const mockWorkspaceRoot = path.resolve('/mock/workspace');
        const mockWorkspaceFolders = [{
            uri: { fsPath: mockWorkspaceRoot },
            name: 'test-workspace',
            index: 0
        }];

        sandbox.stub(vscode.workspace, 'workspaceFolders').value(mockWorkspaceFolders);

        // Create AutoModeManager and inject mock AgentManager
        const autoModeManager = new AutoModeManager(mockStateManager);

        // Create test action for executeTddWorkflow (this is what the "Create Hello World" button should trigger)
        const testAction = {
            id: 'test-execute-tdd-workflow',
            command: 'executeTddWorkflow',
            label: 'Execute TDD Workflow',
            data: {
                content: 'Create a simple "Hello, World!" script in javascript.'
            }
        };

        // Mock TddCodeGenerationCommand to verify it gets called
        const mockTddCommand = {
            execute: sandbox.stub().resolves('TDD workflow completed successfully')
        };

        // Stub the TddCodeGenerationCommand constructor to return our mock
        const TddCodeGenerationCommandStub = sandbox.stub().returns(mockTddCommand);

        // Replace the import with our stub
        const originalTddCommand = require('../../commands/TddCodeGenerationCommand').TddCodeGenerationCommand;
        const moduleCache = require.cache[require.resolve('../../commands/TddCodeGenerationCommand')];
        if (moduleCache && moduleCache.exports) {
            moduleCache.exports.TddCodeGenerationCommand = TddCodeGenerationCommandStub;
        }

        try {
            // Execute the action - this should create a TddCodeGenerationCommand and call its execute method
            const result = await autoModeManager.executeAction(testAction, mockAgentManager);

            // Assert that TddCodeGenerationCommand was instantiated
            assert.ok(TddCodeGenerationCommandStub.called, 'TddCodeGenerationCommand should be instantiated');

            // Assert that the execute method was called with the correct parameters
            assert.ok(mockTddCommand.execute.called, 'TddCodeGenerationCommand.execute should be called');

            const executeCall = mockTddCommand.execute.getCall(0);
            assert.strictEqual(executeCall.args[0], 'Create a simple "Hello, World!" script in javascript.', 'Should pass the content as prompt to execute method');
            assert.strictEqual(executeCall.args[1], mockStateManager, 'Should pass the state manager to execute method');
            assert.strictEqual(executeCall.args[2], mockAgentManager, 'Should pass the agent manager to execute method');

        } finally {
            // Restore the original TddCodeGenerationCommand
            const restoreModuleCache = require.cache[require.resolve('../../commands/TddCodeGenerationCommand')];
            if (restoreModuleCache && restoreModuleCache.exports) {
                restoreModuleCache.exports.TddCodeGenerationCommand = originalTddCommand;
            }
        }
    });
});
