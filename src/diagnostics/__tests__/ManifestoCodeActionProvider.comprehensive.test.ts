/**
 * Comprehensive Tests for ManifestoCodeActionProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import * as vscode from 'vscode';
import { ManifestoCodeActionProvider } from '../ManifestoCodeActionProvider';
import { StateManager } from '../../core/StateManager';

// Mock WorkspaceEdit methods
const mockReplace = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();

// Mock vscode module
jest.mock('vscode', () => ({
    CodeAction: jest.fn().mockImplementation((title, kind) => ({
        title,
        kind,
        diagnostics: [],
        isPreferred: false,
        edit: undefined
    })),
    CodeActionKind: {
        QuickFix: 'quickfix',
        SourceFixAll: 'source.fixAll'
    },
    WorkspaceEdit: jest.fn().mockImplementation(() => ({
        replace: mockReplace,
        insert: mockInsert,
        delete: mockDelete
    })),
    Range: jest.fn().mockImplementation((start, end) => ({ start, end })),
    Position: jest.fn().mockImplementation((line, character) => ({ line, character }))
}));

// Mock StateManager
const mockStateManager = {
    isManifestoMode: true,
    manifestoRules: [],
    currentAgent: 'Auggie'
} as any;

describe('ManifestoCodeActionProvider', () => {
    let provider: ManifestoCodeActionProvider;
    let mockDocument: vscode.TextDocument;
    let mockRange: vscode.Range;
    let mockContext: vscode.CodeActionContext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReplace.mockClear();
        mockInsert.mockClear();
        mockDelete.mockClear();
        provider = new ManifestoCodeActionProvider(mockStateManager);
        
        mockDocument = {
            uri: { toString: () => 'file:///test.ts' },
            getText: jest.fn(),
            lineAt: jest.fn(),
            positionAt: jest.fn(),
            offsetAt: jest.fn()
        } as any;

        mockRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(0, 10)
        );

        mockContext = {
            diagnostics: [],
            only: undefined,
            triggerKind: 1
        } as any;
    });

    describe('Constructor', () => {
        it('should initialize with StateManager', () => {
            expect(provider).toBeDefined();
            expect(provider['_stateManager']).toBe(mockStateManager);
        });
    });

    describe('provideCodeActions', () => {
        it('should return empty array when no diagnostics', () => {
            const result = provider.provideCodeActions(mockDocument, mockRange, mockContext, {} as any);
            expect(result).toEqual([]);
        });

        it('should ignore non-Manifesto Enforcer diagnostics', () => {
            const contextWithDiagnostics = {
                diagnostics: [{
                    source: 'Other Source',
                    message: 'Some error',
                    range: mockRange,
                    severity: 1
                } as any],
                only: undefined,
                triggerKind: 1
            } as any;

            const result = provider.provideCodeActions(mockDocument, mockRange, contextWithDiagnostics, {} as any);
            expect(result).toEqual([]);
        });

        it('should process Manifesto Enforcer diagnostics', () => {
            const diagnostic = {
                source: 'Manifesto Enforcer',
                message: 'innerHTML usage detected',
                range: mockRange,
                severity: 1
            } as any;

            const contextWithDiagnostics = {
                diagnostics: [diagnostic],
                only: undefined,
                triggerKind: 1
            } as any;

            const result = provider.provideCodeActions(mockDocument, mockRange, contextWithDiagnostics, {} as any);
            expect(result).toHaveLength(1);
            expect(vscode.CodeAction).toHaveBeenCalledWith('Replace innerHTML with textContent', 'quickfix');
        });

        it('should handle multiple diagnostics', () => {
            const diagnostics = [
                {
                    source: 'Manifesto Enforcer',
                    message: 'innerHTML usage detected',
                    range: mockRange,
                    severity: 1
                },
                {
                    source: 'Manifesto Enforcer',
                    message: 'eval() usage detected',
                    range: mockRange,
                    severity: 1
                }
            ] as any[];

            const contextWithDiagnostics = {
                diagnostics: diagnostics,
                only: undefined,
                triggerKind: 1
            } as any;

            const result = provider.provideCodeActions(mockDocument, mockRange, contextWithDiagnostics, {} as any);
            expect(result).toHaveLength(2);
        });
    });

    describe('createFixAction', () => {
        let diagnostic: vscode.Diagnostic;

        beforeEach(() => {
            diagnostic = {
                source: 'Manifesto Enforcer',
                message: '',
                range: mockRange,
                severity: 1
            } as any;
        });

        describe('innerHTML fix', () => {
            it('should create innerHTML fix action', () => {
                diagnostic.message = 'innerHTML usage detected';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeDefined();
                expect(vscode.CodeAction).toHaveBeenCalledWith('Replace innerHTML with textContent', 'quickfix');
                expect(result!.isPreferred).toBe(true);
                expect(result!.diagnostics).toEqual([diagnostic]);
            });

            it('should create WorkspaceEdit for innerHTML fix', () => {
                diagnostic.message = 'innerHTML usage detected';

                provider['createFixAction'](mockDocument, diagnostic);

                expect(vscode.WorkspaceEdit).toHaveBeenCalled();
                expect(mockReplace).toHaveBeenCalledWith(mockDocument.uri, diagnostic.range, 'textContent');
            });
        });

        describe('eval() fix', () => {
            it('should create eval fix action', () => {
                diagnostic.message = 'eval() usage detected';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeDefined();
                expect(vscode.CodeAction).toHaveBeenCalledWith('Replace eval() with JSON.parse()', 'quickfix');
                expect(result!.isPreferred).toBe(true);
            });

            it('should create WorkspaceEdit for eval fix', () => {
                diagnostic.message = 'eval() usage detected';

                provider['createFixAction'](mockDocument, diagnostic);

                expect(mockReplace).toHaveBeenCalledWith(mockDocument.uri, diagnostic.range, 'JSON.parse');
            });
        });

        describe('console.log fix', () => {
            it('should create console.log fix action', () => {
                diagnostic.message = 'console.log usage detected';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeDefined();
                expect(vscode.CodeAction).toHaveBeenCalledWith('Remove console.log statement', 'quickfix');
                expect(result!.isPreferred).toBe(true);
            });

            it('should create WorkspaceEdit for console.log fix', () => {
                diagnostic.message = 'console.log usage detected';

                provider['createFixAction'](mockDocument, diagnostic);

                expect(mockDelete).toHaveBeenCalledWith(mockDocument.uri, diagnostic.range);
            });
        });

        describe('error handling fix', () => {
            it('should create error handling fix action', () => {
                diagnostic.message = 'Missing error handling';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeDefined();
                expect(vscode.CodeAction).toHaveBeenCalledWith('Add try-catch block', 'quickfix');
                expect(result!.isPreferred).toBe(true);
            });

            it('should create WorkspaceEdit for error handling fix', () => {
                diagnostic.message = 'Missing error handling';

                provider['createFixAction'](mockDocument, diagnostic);

                const expectedTryBlock = `try {\n        // TODO: Wrap function body in try block\n    } catch (error) {\n        console.error('Error:', error);\n        throw error;\n    }`;
                expect(mockInsert).toHaveBeenCalledWith(mockDocument.uri, diagnostic.range.start, expectedTryBlock + '\n');
            });
        });

        describe('JSDoc fix', () => {
            it('should create JSDoc fix action', () => {
                diagnostic.message = 'Missing JSDoc';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeDefined();
                expect(vscode.CodeAction).toHaveBeenCalledWith('Add JSDoc comment', 'quickfix');
                expect(result!.isPreferred).toBe(true);
            });

            it('should create WorkspaceEdit for JSDoc fix', () => {
                diagnostic.message = 'Missing JSDoc';

                provider['createFixAction'](mockDocument, diagnostic);

                const expectedJSDoc = `/**\n * Function description\n * @param {any} params - Parameter descriptions\n * @returns {any} Return description\n */\n`;
                expect(mockInsert).toHaveBeenCalledWith(mockDocument.uri, diagnostic.range.start, expectedJSDoc);
            });
        });

        describe('credential fix', () => {
            it('should create credential fix action', () => {
                diagnostic.message = 'Hardcoded credential detected';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeDefined();
                expect(vscode.CodeAction).toHaveBeenCalledWith('Replace with environment variable', 'quickfix');
                expect(result!.isPreferred).toBe(true);
            });

            it('should create WorkspaceEdit for credential fix', () => {
                diagnostic.message = 'Hardcoded credential detected';

                provider['createFixAction'](mockDocument, diagnostic);

                expect(mockReplace).toHaveBeenCalledWith(mockDocument.uri, diagnostic.range, 'process.env.CREDENTIAL_VALUE');
            });
        });

        describe('unknown diagnostic', () => {
            it('should return undefined for unknown diagnostic types', () => {
                diagnostic.message = 'Unknown violation type';
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeUndefined();
            });
        });

        describe('error handling', () => {
            it('should handle errors gracefully and return undefined', () => {
                // Mock vscode.CodeAction to throw an error
                (vscode.CodeAction as jest.Mock).mockImplementationOnce(() => {
                    throw new Error('Mock error');
                });
                
                diagnostic.message = 'innerHTML usage detected';
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                
                const result = provider['createFixAction'](mockDocument, diagnostic);
                
                expect(result).toBeUndefined();
                expect(consoleSpy).toHaveBeenCalledWith('Error creating fix action:', expect.any(Error));
                
                consoleSpy.mockRestore();
            });
        });
    });

    describe('createFixAllAction', () => {
        it('should create fix all action', () => {
            const diagnostics = [
                { source: 'Manifesto Enforcer', message: 'innerHTML usage', range: mockRange },
                { source: 'Manifesto Enforcer', message: 'eval() usage', range: mockRange }
            ] as any[];

            const result = ManifestoCodeActionProvider.createFixAllAction(mockDocument, diagnostics);

            expect(result).toBeDefined();
            expect(vscode.CodeAction).toHaveBeenCalledWith('Fix All Manifesto Violations', 'source.fixAll');
            expect(result.diagnostics).toEqual(diagnostics);
        });

        it('should create WorkspaceEdit for fix all action', () => {
            const diagnostics = [
                { source: 'Manifesto Enforcer', message: 'innerHTML usage', range: mockRange }
            ] as any[];

            ManifestoCodeActionProvider.createFixAllAction(mockDocument, diagnostics);

            expect(vscode.WorkspaceEdit).toHaveBeenCalled();
        });
    });
});
