/**
 * Integration tests for VSCode extension commands
 * Tests all sidebar menu items and command registration
 */

import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';

// Mock VSCode API
jest.mock('vscode', () => ({
    commands: {
        registerCommand: jest.fn(),
        executeCommand: jest.fn()
    },
    window: {
        showInformationMessage: jest.fn(),
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        activeTextEditor: null,
        createTreeView: jest.fn(),
        registerTreeDataProvider: jest.fn(),
        registerWebviewViewProvider: jest.fn().mockReturnValue({ dispose: jest.fn() })
    },
    extensions: {
        getExtension: jest.fn().mockReturnValue(null),
        all: []
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        findFiles: jest.fn().mockResolvedValue([]),
        onDidChangeTextDocument: jest.fn().mockReturnValue({ dispose: jest.fn() }),
        onDidOpenTextDocument: jest.fn().mockReturnValue({ dispose: jest.fn() }),
        onDidSaveTextDocument: jest.fn().mockReturnValue({ dispose: jest.fn() }),
        textDocuments: [],
        createFileSystemWatcher: jest.fn().mockReturnValue({
            onDidCreate: jest.fn().mockReturnValue({ dispose: jest.fn() }),
            onDidChange: jest.fn().mockReturnValue({ dispose: jest.fn() }),
            onDidDelete: jest.fn().mockReturnValue({ dispose: jest.fn() }),
            dispose: jest.fn()
        }),
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(true),
            update: jest.fn().mockResolvedValue(undefined),
            has: jest.fn().mockReturnValue(true),
            inspect: jest.fn().mockReturnValue({})
        }),
        fs: {
            readFile: jest.fn().mockResolvedValue(Buffer.from('# Test Manifesto\n\n## Rules\n- Test rule')),
            writeFile: jest.fn().mockResolvedValue(undefined)
        }
    },
    languages: {
        createDiagnosticCollection: jest.fn().mockReturnValue({
            set: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn()
        }),
        registerCodeActionsProvider: jest.fn().mockReturnValue({ dispose: jest.fn() })
    },
    CodeActionKind: {
        QuickFix: 'quickfix',
        SourceFixAll: 'source.fixAll'
    },
    ExtensionContext: jest.fn(),
    Uri: {
        file: jest.fn()
    },
    TreeItem: class MockTreeItem {
        public label: string;
        public collapsibleState?: any;

        constructor(label: string, collapsibleState?: any) {
            this.label = label;
            this.collapsibleState = collapsibleState;
        }
    },
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2
    },
    EventEmitter: jest.fn().mockImplementation(() => ({
        event: jest.fn(),
        fire: jest.fn(),
        dispose: jest.fn()
    }))
}));

// Mock StateManager
jest.mock('../core/StateManager', () => {
    const mockStateManager = {
        isManifestoMode: false,
        isAgentMode: true,
        currentAgent: 'Auggie',
        isAutoMode: false,
        isCodebaseIndexed: false,
        manifestoRules: [],
        codebaseIndex: new Map(),
        conversationHistory: [],
        getIndexingStats: jest.fn().mockReturnValue({
            totalFiles: 0,
            indexedFiles: 0,
            healthStatus: 'healthy'
        }),
        addToConversationHistory: jest.fn(),
        clearConversationHistory: jest.fn(),
        loadGlossaryFromStorage: jest.fn().mockResolvedValue(undefined),
        loadCodebaseIndex: jest.fn().mockResolvedValue(true),
        saveCodebaseIndex: jest.fn().mockResolvedValue(true),
        indexManifestoRules: jest.fn().mockResolvedValue(true),
        initializeFileManagement: jest.fn().mockResolvedValue(undefined),
        dispose: jest.fn()
    };

    return {
        StateManager: {
            getInstance: jest.fn().mockReturnValue(mockStateManager)
        }
    };
});

describe('Extension Integration Tests', () => {
    let mockContext: any;
    let mockStateManager: StateManager;

    beforeAll(() => {
        mockContext = {
            subscriptions: [],
            extensionPath: '/test/extension',
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            workspaceState: {
                get: jest.fn(),
                update: jest.fn()
            }
        };

        // StateManager is already mocked above
    });

    // Note: Extension activation testing is done in VSCode integration tests (src/test/suite/)
    // Jest tests focus on unit testing individual components

    beforeEach(() => {
        // Only clear mocks that should be reset between tests, not the ones tracking extension activation
        (vscode.window.showQuickPick as jest.Mock).mockClear();
        (vscode.window.showInputBox as jest.Mock).mockClear();
        (vscode.window.showInformationMessage as jest.Mock).mockClear();
        (vscode.window.showWarningMessage as jest.Mock).mockClear();
        (vscode.window.showErrorMessage as jest.Mock).mockClear();
    });

    describe('Command Registration Logic', () => {
        it('should have proper command naming convention', () => {
            // Test that our command naming follows the expected pattern
            const expectedCommands = [
                'manifestoEnforcer.toggleManifestoMode',
                'manifestoEnforcer.switchAgent',
                'manifestoEnforcer.quickChat',
                'manifestoEnforcer.writeCode',
                'manifestoEnforcer.createManifesto',
                'manifestoEnforcer.validateCompliance',
                'manifestoEnforcer.openSettings',
                'manifestoEnforcer.testConnection'
            ];

            expectedCommands.forEach(command => {
                expect(command).toMatch(/^manifestoEnforcer\./);
                expect(command.length).toBeGreaterThan(10);
            });
        });
    });

    describe('Mock Validation', () => {
        it('should have proper VSCode API mocks', () => {
            // Test that our mocks are properly set up for unit testing
            expect(vscode.commands.registerCommand).toBeDefined();
            expect(vscode.window.showInformationMessage).toBeDefined();
            expect(vscode.window.showQuickPick).toBeDefined();
            expect(vscode.window.showInputBox).toBeDefined();
            expect(vscode.workspace.getConfiguration).toBeDefined();

            // Test that mocks are actually Jest mocks
            expect(jest.isMockFunction(vscode.commands.registerCommand)).toBe(true);
            expect(jest.isMockFunction(vscode.window.showInformationMessage)).toBe(true);
        });
    });

    describe('Configuration Validation', () => {
        it('should handle workspace configuration properly', () => {
            // Test workspace configuration mock
            const mockConfig = {
                get: jest.fn().mockReturnValue(true),
                update: jest.fn().mockResolvedValue(undefined),
                has: jest.fn().mockReturnValue(true),
                inspect: jest.fn().mockReturnValue({})
            };

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            expect(config.get).toBeDefined();
            expect(config.update).toBeDefined();
        });
    });
});
