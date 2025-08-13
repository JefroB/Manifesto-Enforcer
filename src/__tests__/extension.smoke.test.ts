/**
 * MANDATORY: Smoke Tests for Extension
 * CRITICAL: Basic functionality verification before complex integration
 * REQUIRED: Following TDD - ensure core features work
 */

import * as vscode from 'vscode';

// MANDATORY: Mock VSCode API
jest.mock('vscode', () => ({
    commands: {
        registerCommand: jest.fn(),
        executeCommand: jest.fn()
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        onWillSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        onDidOpenTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        findFiles: jest.fn().mockResolvedValue([]),
        getConfiguration: jest.fn(() => ({
            get: jest.fn().mockReturnValue(false),
            update: jest.fn(),
            has: jest.fn().mockReturnValue(true),
            inspect: jest.fn()
        })),
        fs: {
            readFile: jest.fn(),
            writeFile: jest.fn(),
            stat: jest.fn(),
            delete: jest.fn()
        },
        textDocuments: [],
        createFileSystemWatcher: jest.fn(() => ({
            onDidCreate: jest.fn(() => ({ dispose: jest.fn() })),
            onDidChange: jest.fn(() => ({ dispose: jest.fn() })),
            onDidDelete: jest.fn(() => ({ dispose: jest.fn() })),
            dispose: jest.fn()
        }))
    },
    window: {
        createTreeView: jest.fn(() => ({ dispose: jest.fn() })),
        registerTreeDataProvider: jest.fn(() => ({ dispose: jest.fn() })),
        registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
        createStatusBarItem: jest.fn(() => ({
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        })),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showInformationMessage: jest.fn(),
        showQuickPick: jest.fn(),
        showInputBox: jest.fn(),
        createTerminal: jest.fn(() => ({
            sendText: jest.fn(),
            dispose: jest.fn()
        }))
    },
    languages: {
        createDiagnosticCollection: jest.fn(() => ({
            set: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn(),
            get: jest.fn()
        })),
        registerCodeActionsProvider: jest.fn(() => ({ dispose: jest.fn() }))
    },
    CodeActionKind: {
        QuickFix: 'quickfix',
        SourceFixAll: 'source.fixAll'
    },
    StatusBarAlignment: { Left: 1, Right: 2 },
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
    Range: jest.fn(),
    Position: jest.fn(),
    Diagnostic: jest.fn(),
    TreeItem: class MockTreeItem {
        constructor(label: string, collapsibleState?: number) {
            this.label = label;
            this.collapsibleState = collapsibleState;
        }
        label: string;
        collapsibleState?: number;
        command?: any;
        tooltip?: string;
        description?: string;
    },
    EventEmitter: class MockEventEmitter {
        constructor() {
            this._listeners = new Map();
        }
        private _listeners: Map<string, Function[]>;

        fire(data?: any): void {
            // Mock implementation
        }

        get event() {
            return jest.fn();
        }

        dispose(): void {
            this._listeners.clear();
        }
    },
    Uri: {
        file: jest.fn((path) => ({ fsPath: path, toString: () => `file://${path}` }))
    },
    extensions: {
        getExtension: jest.fn(() => ({
            id: 'test.extension',
            isActive: true,
            exports: {}
        }))
    },
    env: {
        clipboard: {
            writeText: jest.fn(() => Promise.resolve()),
            readText: jest.fn(() => Promise.resolve(''))
        }
    }
}));

describe('Extension Smoke Tests', () => {
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        // REQUIRED: Reset all mocks
        jest.clearAllMocks();

        // MANDATORY: Mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: jest.fn(),
                update: jest.fn()
            },
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            extensionPath: '/test/extension',
            storagePath: '/test/storage',
            globalStoragePath: '/test/global-storage',
            logPath: '/test/logs'
        } as any;
    });

    describe('Basic Extension Functionality', () => {
        it('should activate extension without errors', async () => {
            try {
                // CRITICAL: Test basic activation
                const { activate } = require('../extension');
                
                const result = await activate(mockContext);

                // MANDATORY: Should not throw and should complete
                expect(result).toBeUndefined(); // activate() returns void
                expect(mockContext.subscriptions.length).toBeGreaterThan(0);

            } catch (error) {
                console.error('Extension activation smoke test failed:', error);
                throw error;
            }
        });

        it('should register core commands', async () => {
            try {
                // REQUIRED: Test command registration
                const { activate } = require('../extension');
                
                await activate(mockContext);

                // CRITICAL: Verify basic commands are registered
                expect(vscode.commands.registerCommand).toHaveBeenCalled();
                
                // MANDATORY: Should have at least these core commands
                const commandCalls = (vscode.commands.registerCommand as jest.Mock).mock.calls;
                const registeredCommands = commandCalls.map(call => call[0]);

                expect(registeredCommands).toContain('manifestoEnforcer.toggleManifestoMode');

            } catch (error) {
                console.error('Command registration smoke test failed:', error);
                throw error;
            }
        });

        it('should initialize core components', async () => {
            try {
                // REQUIRED: Test component initialization
                const { activate } = require('../extension');
                
                await activate(mockContext);

                // CRITICAL: Should register disposables
                expect(mockContext.subscriptions.length).toBeGreaterThan(5);

                // MANDATORY: Should register tree data providers
                expect(vscode.window.registerTreeDataProvider).toHaveBeenCalled();

                // REQUIRED: Should register code actions
                expect(vscode.languages.registerCodeActionsProvider).toHaveBeenCalled();

            } catch (error) {
                console.error('Component initialization smoke test failed:', error);
                throw error;
            }
        });
    });

    describe('ManifestoEnforcementEngine Smoke Tests', () => {
        it('should create ManifestoEnforcementEngine instance', async () => {
            try {
                // CRITICAL: Test enforcement engine creation
                const { ManifestoEnforcementEngine } = require('../core/ManifestoEnforcementEngine');
                const { ManifestoPreCommitHook } = require('../core/ManifestoPreCommitHook');
                const { ManifestoSaveGuard } = require('../core/ManifestoSaveGuard');
                const { TestExecutionEnforcer } = require('../core/TestExecutionEnforcer');
                const { AIComplianceVerifier } = require('../core/AIComplianceVerifier');

                // MANDATORY: Create all components
                const preCommitHook = new ManifestoPreCommitHook();
                const saveGuard = new ManifestoSaveGuard();
                const testEnforcer = new TestExecutionEnforcer();
                const aiVerifier = new AIComplianceVerifier();

                // CRITICAL: Create enforcement engine
                const engine = new ManifestoEnforcementEngine(
                    preCommitHook,
                    saveGuard,
                    testEnforcer,
                    aiVerifier
                );

                // REQUIRED: Should be created successfully
                expect(engine).toBeDefined();
                expect(typeof engine.enforceCompliance).toBe('function');

            } catch (error) {
                console.error('ManifestoEnforcementEngine creation smoke test failed:', error);
                throw error;
            }
        });

        it('should handle basic enforcement actions', async () => {
            try {
                // REQUIRED: Test basic enforcement
                const { ManifestoEnforcementEngine } = require('../core/ManifestoEnforcementEngine');
                const { ManifestoPreCommitHook } = require('../core/ManifestoPreCommitHook');
                const { ManifestoSaveGuard } = require('../core/ManifestoSaveGuard');
                const { TestExecutionEnforcer } = require('../core/TestExecutionEnforcer');
                const { AIComplianceVerifier } = require('../core/AIComplianceVerifier');

                const engine = new ManifestoEnforcementEngine(
                    new ManifestoPreCommitHook(),
                    new ManifestoSaveGuard(),
                    new TestExecutionEnforcer(),
                    new AIComplianceVerifier()
                );

                // CRITICAL: Test basic action (should not throw)
                const testAction = {
                    type: 'test' as const,
                    data: {}
                };

                await expect(engine.enforceCompliance(testAction)).resolves.not.toThrow();

            } catch (error) {
                console.error('Basic enforcement smoke test failed:', error);
                throw error;
            }
        });
    });

    describe('Performance Smoke Tests', () => {
        it('should activate within reasonable time', async () => {
            try {
                // OPTIMIZE: Test activation performance
                const startTime = Date.now();

                const { activate } = require('../extension');
                await activate(mockContext);

                const duration = Date.now() - startTime;

                // REQUIRED: Should activate quickly
                expect(duration).toBeLessThan(2000); // 2 seconds max for smoke test

            } catch (error) {
                console.error('Performance smoke test failed:', error);
                throw error;
            }
        });
    });

    describe('Error Handling Smoke Tests', () => {
        it('should handle missing workspace gracefully', async () => {
            try {
                // MANDATORY: Test error handling
                (vscode.workspace as any).workspaceFolders = null;

                const { activate } = require('../extension');
                
                // REQUIRED: Should not throw even with missing workspace
                expect(() => activate(mockContext)).not.toThrow();

            } catch (error) {
                console.error('Error handling smoke test failed:', error);
                throw error;
            }
        });
    });

    describe('Manifesto Compliance Smoke Tests', () => {
        it('should detect manifesto violations in code', async () => {
            try {
                // CRITICAL: Test manifesto detection
                const { AIComplianceVerifier } = require('../core/AIComplianceVerifier');
                
                const verifier = new AIComplianceVerifier();

                // MANDATORY: Test violation detection
                const badCode = 'element.innerHTML = userInput; // XSS vulnerability';
                const isCompliant = await verifier.verifyAIResponse(badCode);

                // REQUIRED: Should detect violation
                expect(isCompliant).toBe(false);

            } catch (error) {
                console.error('Manifesto compliance smoke test failed:', error);
                throw error;
            }
        });

        it('should allow compliant code', async () => {
            try {
                // REQUIRED: Test compliant code
                const { AIComplianceVerifier } = require('../core/AIComplianceVerifier');
                
                const verifier = new AIComplianceVerifier();

                // MANDATORY: Test compliant code
                const goodCode = 'element.textContent = sanitizedInput; // Safe assignment';
                const isCompliant = await verifier.verifyAIResponse(goodCode);

                // REQUIRED: Should allow compliant code
                expect(isCompliant).toBe(true);

            } catch (error) {
                console.error('Compliant code smoke test failed:', error);
                throw error;
            }
        });
    });
});
