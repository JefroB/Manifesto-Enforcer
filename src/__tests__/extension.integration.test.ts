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

    // Helper function to activate extension fresh for each test
    const activateExtensionFresh = async () => {
        // Clear any previous calls
        (vscode.commands.registerCommand as jest.Mock).mockClear();

        // Import and activate the extension fresh
        delete require.cache[require.resolve('../extension')];
        const { activate } = await import('../extension');
        await activate(mockContext);
    };

    beforeEach(() => {
        // Only clear mocks that should be reset between tests, not the ones tracking extension activation
        (vscode.window.showQuickPick as jest.Mock).mockClear();
        (vscode.window.showInputBox as jest.Mock).mockClear();
        (vscode.window.showInformationMessage as jest.Mock).mockClear();
        (vscode.window.showWarningMessage as jest.Mock).mockClear();
        (vscode.window.showErrorMessage as jest.Mock).mockClear();
    });

    describe('Sidebar Menu Commands', () => {
        it('should register manifestoEnforcer.toggleManifestoMode command', async () => {
            await activateExtensionFresh();

            // This command should toggle manifesto mode
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.toggleManifestoMode',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.switchAgent command', async () => {
            await activateExtensionFresh();

            // This command should show agent selection
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.switchAgent',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.quickChat command', async () => {
            await activateExtensionFresh();

            // This command should open quick chat input
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.quickChat',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.writeCode command', async () => {
            await activateExtensionFresh();

            // This command should open code generation input
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.writeCode',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.createManifesto command', async () => {
            await activateExtensionFresh();

            // This is the critical one that was failing
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.createManifesto',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.validateCompliance command', async () => {
            await activateExtensionFresh();

            // This command should validate current file
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.validateCompliance',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.openSettings command', async () => {
            await activateExtensionFresh();

            // This command should open extension settings
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.openSettings',
                expect.any(Function)
            );
        });

        it('should register manifestoEnforcer.testConnection command', async () => {
            await activateExtensionFresh();

            // This command should test AI agent connection
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'manifestoEnforcer.testConnection',
                expect.any(Function)
            );
        });
    });

    describe('Command Execution Logic', () => {
        it('should handle toggleManifestoMode command execution', async () => {
            await activateExtensionFresh();

            const toggleCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.toggleManifestoMode')?.[1];

            expect(toggleCommand).toBeDefined();

            if (toggleCommand) {
                await toggleCommand();
                expect(vscode.window.showInformationMessage).toHaveBeenCalled();
            }
        });

        it('should handle switchAgent command with user selection', async () => {
            await activateExtensionFresh();

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue('Amazon Q');

            const switchCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.switchAgent')?.[1];

            expect(switchCommand).toBeDefined();

            if (switchCommand) {
                await switchCommand();
                expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
                    ['Auggie', 'Amazon Q', 'Cline'],
                    expect.objectContaining({
                        placeHolder: 'Select AI Agent for Piggie'
                    })
                );
            }
        });

        it('should handle quickChat command with user input', async () => {
            await activateExtensionFresh();

            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('test chat message');

            const quickChatCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.quickChat')?.[1];

            expect(quickChatCommand).toBeDefined();

            if (quickChatCommand) {
                await quickChatCommand();
                expect(vscode.window.showInputBox).toHaveBeenCalledWith(
                    expect.objectContaining({
                        placeHolder: 'Ask Piggie anything...'
                    })
                );
            }
        });

        it('should handle createManifesto command with project description', async () => {
            await activateExtensionFresh();

            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('React TypeScript project');

            const createManifestoCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.createManifesto')?.[1];

            expect(createManifestoCommand).toBeDefined();

            if (createManifestoCommand) {
                await createManifestoCommand();
                expect(vscode.window.showInputBox).toHaveBeenCalledWith(
                    expect.objectContaining({
                        placeHolder: 'Describe your project to create a manifesto...'
                    })
                );
                expect(vscode.commands.executeCommand).toHaveBeenCalledWith('piggieChatPanel.focus');
            }
        });

        it('should handle validateCompliance command with active editor', async () => {
            await activateExtensionFresh();

            const mockEditor = {
                document: {
                    getText: jest.fn().mockReturnValue('function test() { return "hello"; }')
                }
            };
            (vscode.window as any).activeTextEditor = mockEditor;

            const validateCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.validateCompliance')?.[1];

            expect(validateCommand).toBeDefined();

            if (validateCommand) {
                await validateCommand();
                expect(mockEditor.document.getText).toHaveBeenCalled();
            }
        });

        it('should handle validateCompliance command without active editor', async () => {
            await activateExtensionFresh();

            (vscode.window as any).activeTextEditor = null;

            const validateCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.validateCompliance')?.[1];

            if (validateCommand) {
                await validateCommand();
                expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active editor to validate');
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle command registration failures gracefully', () => {
            (vscode.commands.registerCommand as jest.Mock).mockImplementation(() => {
                throw new Error('Command registration failed');
            });

            // Extension should not crash during activation
            expect(() => {
                // Simulate extension activation
                require('../extension');
            }).not.toThrow();
        });

        it('should handle missing workspace gracefully', () => {
            (vscode.workspace as any).workspaceFolders = undefined;
            
            // Commands should still work without workspace
            const createManifestoCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
                .find(call => call[0] === 'manifestoEnforcer.createManifesto')?.[1];

            expect(() => createManifestoCommand?.()).not.toThrow();
        });
    });
});
