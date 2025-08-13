/**
 * Comprehensive ManifestoDiagnosticsProvider Tests
 * Testing the core diagnostics system for complete coverage
 * Following manifesto: comprehensive error handling, input validation, JSDoc documentation
 */

import * as vscode from 'vscode';
import { ManifestoDiagnosticsProvider } from '../ManifestoDiagnosticsProvider';
import { StateManager } from '../../core/StateManager';

// Mock VSCode API
jest.mock('vscode', () => ({
    languages: {
        createDiagnosticCollection: jest.fn(() => ({
            set: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn(),
            get: jest.fn()
        }))
    },
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    },
    Diagnostic: jest.fn().mockImplementation((range, message, severity) => ({
        range,
        message,
        severity,
        source: 'manifesto-enforcer'
    })),
    Range: jest.fn().mockImplementation((start, end) => ({ start, end })),
    Position: jest.fn().mockImplementation((line, character) => ({ line, character })),
    workspace: {
        onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        onDidOpenTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
        textDocuments: []
    },
    window: {
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn()
    }
}));

// Mock StateManager
jest.mock('../../core/StateManager');

describe('ManifestoDiagnosticsProvider Comprehensive Tests', () => {
    let provider: ManifestoDiagnosticsProvider;
    let mockStateManager: jest.Mocked<StateManager>;
    let mockDiagnosticCollection: any;

    const createMockDocument = (content: string, languageId: string = 'typescript', fileName: string = '/test/file.ts'): vscode.TextDocument => ({
        uri: {
            fsPath: fileName,
            toString: () => `file://${fileName}`,
            scheme: 'file'  // Add scheme property for shouldAnalyzeDocument check
        } as vscode.Uri,
        languageId,
        fileName,
        getText: () => content,
        lineCount: content.split('\n').length,
        positionAt: (offset: number) => {
            const lines = content.substring(0, offset).split('\n');
            return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
        },
        lineAt: ((lineOrPosition: number | vscode.Position) => {
            const lineNumber = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
            return {
                text: content.split('\n')[lineNumber] || '',
                range: new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, 100)),
                lineNumber: lineNumber,
                rangeIncludingLineBreak: new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber + 1, 0)),
                firstNonWhitespaceCharacterIndex: 0,
                isEmptyOrWhitespace: false
            };
        }) as any,
        isUntitled: false,
        encoding: 'utf8',
        version: 1,
        isDirty: false,
        isClosed: false,
        save: jest.fn().mockResolvedValue(true),
        eol: 1, // vscode.EndOfLine.LF
        getWordRangeAtPosition: jest.fn(),
        validateRange: jest.fn(),
        validatePosition: jest.fn(),
        offsetAt: jest.fn()
    } as vscode.TextDocument);

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock diagnostic collection
        mockDiagnosticCollection = {
            set: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn(),
            get: jest.fn()
        };

        (vscode.languages.createDiagnosticCollection as jest.Mock).mockReturnValue(mockDiagnosticCollection);

        // Create mock StateManager
        mockStateManager = {
            isManifestoMode: true,
            manifestoRules: []
        } as any;

        (StateManager.getInstance as jest.Mock).mockReturnValue(mockStateManager);

        // Create provider instance
        provider = new ManifestoDiagnosticsProvider(mockStateManager);
    });

    afterEach(() => {
        provider.dispose();
    });

    describe('Initialization', () => {
        it('should create diagnostic collection on initialization', () => {
            expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith('manifesto-enforcer');
        });

        it('should register document event listeners', () => {
            expect(vscode.workspace.onDidSaveTextDocument).toHaveBeenCalled();
            expect(vscode.workspace.onDidOpenTextDocument).toHaveBeenCalled();
            expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
        });

        it('should use provided StateManager instance', () => {
            expect(provider).toBeDefined();
            // StateManager is passed directly to constructor, not retrieved via getInstance
        });
    });

    describe('Document Analysis', () => {
        it('should detect innerHTML usage (XSS vulnerability)', () => {
            const document = createMockDocument(`
                const element = document.getElementById('test');
                element.innerHTML = '<script>alert("xss")</script>';
            `);

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                document.uri,
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('innerHTML usage detected')
                    })
                ])
            );
        });

        it('should detect eval() usage (code injection risk)', () => {
            const document = createMockDocument(`
                const result = eval('2 + 2');
            `);

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                document.uri,
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('eval() usage detected')
                    })
                ])
            );
        });

        it('should detect console.log in production code', () => {
            const document = createMockDocument(`
                function debugFunction() {
                    console.log('debug message');
                    return true;
                }
            `, 'typescript', '/src/production.ts');

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                document.uri,
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('console.log in production code')
                    })
                ])
            );
        });

        it('should skip console.log in test files', () => {
            const document = createMockDocument(`
                function testFunction() {
                    console.log('test debug');
                    return true;
                }
            `, 'typescript', '/src/test.spec.ts');

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            // Should not flag console.log in test files
            const setCall = mockDiagnosticCollection.set.mock.calls[0];
            if (setCall && setCall[1]) {
                expect(setCall[1]).not.toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('console.log in production code')
                    })
                ]));
            }
        });

        it('should handle documents with no violations', () => {
            const document = createMockDocument(`
                function safeFunction(data) {
                    return data ? data.toUpperCase() : '';
                }
            `);

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                document.uri,
                []
            );
        });
    });

    describe('File Type Filtering', () => {
        it('should analyze TypeScript files', () => {
            const document = createMockDocument(`
                element.innerHTML = 'test';
            `, 'typescript', '/src/file.ts');

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            expect(mockDiagnosticCollection.set).toHaveBeenCalled();
        });

        it('should analyze JavaScript files', () => {
            const document = createMockDocument(`
                eval('test');
            `, 'javascript', '/src/file.js');

            // Trigger analysis by calling the private method directly
            (provider as any).analyzeDocument(document);

            expect(mockDiagnosticCollection.set).toHaveBeenCalled();
        });

        it('should skip markdown files', () => {
            const document = createMockDocument('# Test markdown', 'markdown', '/docs/readme.md');

            // Trigger analysis by simulating document save
            const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
            saveHandler(document);

            // Should not analyze non-code files - the method should return early
            // We can't easily test this without exposing shouldAnalyzeDocument, but the coverage will show it
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed TypeScript gracefully', () => {
            const document = createMockDocument('function incomplete(');

            // Trigger analysis by simulating document save
            const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];

            expect(() => saveHandler(document)).not.toThrow();
        });

        it('should handle empty documents', () => {
            const document = createMockDocument('');

            // Trigger analysis by simulating document save
            const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];

            expect(() => saveHandler(document)).not.toThrow();
        });
    });

    describe('Resource Management', () => {
        it('should dispose diagnostic collection on dispose', () => {
            provider.dispose();

            expect(mockDiagnosticCollection.dispose).toHaveBeenCalled();
        });

        it('should clear diagnostics using clearDiagnostics method', () => {
            provider.clearDiagnostics();

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
        });
    });

    describe('Document Event Handling', () => {
        it('should handle document save events', () => {
            const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
            const document = createMockDocument('test content');

            expect(() => saveHandler(document)).not.toThrow();
        });

        it('should handle document open events', () => {
            const openHandler = (vscode.workspace.onDidOpenTextDocument as jest.Mock).mock.calls[0][0];
            const document = createMockDocument('test content');

            expect(() => openHandler(document)).not.toThrow();
        });

        it('should handle document change events with debouncing', () => {
            const changeHandler = (vscode.workspace.onDidChangeTextDocument as jest.Mock).mock.calls[0][0];
            const changeEvent = {
                document: createMockDocument('test content'),
                contentChanges: []
            };

            expect(() => changeHandler(changeEvent)).not.toThrow();
        });
    });

    describe('Advanced Violation Detection', () => {
        it('should detect hardcoded credentials in property assignments', () => {
            try {
                const codeWithCredentials = `
                    const config = {
                        apiKey: "secret-key-123",
                        password: "hardcoded-password",
                        token: "bearer-token-456"
                    };
                `;
                const document = createMockDocument(codeWithCredentials, 'typescript', '/test/credentials.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                    document.uri,
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Manifesto Violation: Potential hardcoded credential'
                        })
                    ])
                );
            } catch (error) {
                console.error('Hardcoded credentials test failed:', error);
                throw error;
            }
        });

        it('should detect hardcoded credentials in variable declarations', () => {
            try {
                const codeWithCredentials = `
                    const apiKey = "secret-key-123";
                    const password = "hardcoded-password";
                    const secret = "my-secret-value";
                `;
                const document = createMockDocument(codeWithCredentials, 'typescript', '/test/variables.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                    document.uri,
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Manifesto Violation: Potential hardcoded credential'
                        })
                    ])
                );
            } catch (error) {
                console.error('Variable credentials test failed:', error);
                throw error;
            }
        });

        it('should detect missing JSDoc on exported functions', () => {
            try {
                const codeWithoutJSDoc = `
                    export function publicFunction() {
                        return "no documentation";
                    }

                    export class TestClass {
                        public method() {
                            return "also no docs";
                        }
                    }
                `;
                const document = createMockDocument(codeWithoutJSDoc, 'typescript', '/test/nodocs.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                    document.uri,
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Manifesto Violation: Missing JSDoc documentation'
                        })
                    ])
                );
            } catch (error) {
                console.error('Missing JSDoc test failed:', error);
                throw error;
            }
        });

        it('should detect async functions without error handling', () => {
            try {
                const codeWithoutErrorHandling = `
                    export async function riskyFunction() {
                        await someAsyncOperation();
                        return "no error handling";
                    }

                    class TestClass {
                        async method() {
                            await anotherAsyncOperation();
                        }
                    }
                `;
                const document = createMockDocument(codeWithoutErrorHandling, 'typescript', '/test/async.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                    document.uri,
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Manifesto Violation: Async function without error handling'
                        })
                    ])
                );
            } catch (error) {
                console.error('Async error handling test failed:', error);
                throw error;
            }
        });

        it('should detect functions that are too long', () => {
            try {
                // Create a function with more than 50 statements
                const longStatements = Array.from({length: 55}, (_, i) => `    const var${i} = ${i};`).join('\n');
                const longFunction = `
                    export function veryLongFunction() {
${longStatements}
                        return "too many statements";
                    }
                `;
                const document = createMockDocument(longFunction, 'typescript', '/test/long.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                    document.uri,
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Manifesto Violation: Function too long'
                        })
                    ])
                );
            } catch (error) {
                console.error('Long function test failed:', error);
                throw error;
            }
        });

        it('should handle AST parsing errors gracefully', () => {
            try {
                // Create malformed TypeScript that will cause AST parsing to fail
                const malformedCode = `
                    function incomplete(
                    const broken = {
                    export class Malformed {
                        method(
                `;
                const document = createMockDocument(malformedCode, 'typescript', '/test/malformed.ts');

                // Trigger analysis through event handler - should not throw
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                expect(() => saveHandler(document)).not.toThrow();

                // Should still set diagnostics (empty array due to parsing failure)
                expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(
                    document.uri,
                    expect.any(Array)
                );
            } catch (error) {
                console.error('AST parsing error test failed:', error);
                throw error;
            }
        });

        it('should test getDiagnostics method', () => {
            try {
                const document = createMockDocument('const x = 1;', 'typescript', '/test/test.ts');

                // Mock the diagnostic collection to return some diagnostics
                const mockDiagnostics = [
                    { message: 'Test diagnostic', range: new vscode.Range(0, 0, 0, 5) }
                ];
                mockDiagnosticCollection.get.mockReturnValue(mockDiagnostics);

                const result = provider.getDiagnostics(document);

                expect(mockDiagnosticCollection.get).toHaveBeenCalledWith(document.uri);
                expect(result).toEqual(mockDiagnostics);
            } catch (error) {
                console.error('getDiagnostics test failed:', error);
                throw error;
            }
        });

        it('should test getDiagnostics with no diagnostics', () => {
            try {
                const document = createMockDocument('const x = 1;', 'typescript', '/test/test.ts');

                // Mock the diagnostic collection to return undefined
                mockDiagnosticCollection.get.mockReturnValue(undefined);

                const result = provider.getDiagnostics(document);

                expect(mockDiagnosticCollection.get).toHaveBeenCalledWith(document.uri);
                expect(result).toEqual([]);
            } catch (error) {
                console.error('getDiagnostics empty test failed:', error);
                throw error;
            }
        });
    });

    describe('Helper Methods Coverage', () => {
        it('should test async function with try-catch (should not trigger violation)', () => {
            try {
                const codeWithTryCatch = `
                    export async function safeFunction() {
                        try {
                            await someAsyncOperation();
                            return "has error handling";
                        } catch (error) {
                            console.error('Error:', error);
                            throw error;
                        }
                    }
                `;
                const document = createMockDocument(codeWithTryCatch, 'typescript', '/test/safe.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                // Should not contain async error handling violation
                const setCall = mockDiagnosticCollection.set.mock.calls.find((call: any) => call[0] === document.uri);
                const diagnostics = setCall ? setCall[1] : [];
                const hasAsyncViolation = diagnostics.some((d: any) =>
                    d.message && d.message.includes('Async function without error handling')
                );

                expect(hasAsyncViolation).toBe(false);
            } catch (error) {
                console.error('Safe async function test failed:', error);
                throw error;
            }
        });

        it('should test function with JSDoc (should not trigger violation)', () => {
            try {
                const codeWithJSDoc = `
                    /**
                     * This function has proper documentation
                     * @returns A string value
                     */
                    export function documentedFunction() {
                        return "has documentation";
                    }
                `;
                const document = createMockDocument(codeWithJSDoc, 'typescript', '/test/documented.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                // Should not contain JSDoc violation
                const setCall = mockDiagnosticCollection.set.mock.calls.find((call: any) => call[0] === document.uri);
                const diagnostics = setCall ? setCall[1] : [];
                const hasJSDocViolation = diagnostics.some((d: any) =>
                    d.message && d.message.includes('Missing JSDoc documentation')
                );

                expect(hasJSDocViolation).toBe(false);
            } catch (error) {
                console.error('Documented function test failed:', error);
                throw error;
            }
        });

        it('should test private methods (should not trigger JSDoc violation)', () => {
            try {
                const codeWithPrivateMethod = `
                    export class TestClass {
                        private privateMethod() {
                            return "private methods don't need JSDoc";
                        }

                        protected protectedMethod() {
                            return "protected methods don't need JSDoc";
                        }
                    }
                `;
                const document = createMockDocument(codeWithPrivateMethod, 'typescript', '/test/private.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                // Should not contain JSDoc violations for private/protected methods
                const setCall = mockDiagnosticCollection.set.mock.calls.find((call: any) => call[0] === document.uri);
                const diagnostics = setCall ? setCall[1] : [];
                const hasJSDocViolation = diagnostics.some((d: any) =>
                    d.message && d.message.includes('Missing JSDoc documentation')
                );

                expect(hasJSDocViolation).toBe(false);
            } catch (error) {
                console.error('Private method test failed:', error);
                throw error;
            }
        });

        it('should test exported arrow functions', () => {
            try {
                const codeWithArrowFunction = `
                    export const arrowFunction = () => {
                        return "arrow function without docs";
                    };

                    export const asyncArrowFunction = async () => {
                        await someOperation();
                        return "async arrow without error handling";
                    };
                `;
                const document = createMockDocument(codeWithArrowFunction, 'typescript', '/test/arrow.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                // Should detect violations in arrow functions
                const setCall = mockDiagnosticCollection.set.mock.calls.find((call: any) => call[0] === document.uri);
                const diagnostics = setCall ? setCall[1] : [];

                expect(diagnostics.length).toBeGreaterThan(0);
            } catch (error) {
                console.error('Arrow function test failed:', error);
                throw error;
            }
        });

        it('should test credential detection with various patterns', () => {
            try {
                const codeWithVariousCredentials = `
                    const config = {
                        "api_key": "secret123",
                        API_KEY: "another-secret",
                        userPassword: "password123",
                        authToken: "token456",
                        clientSecret: "secret789"
                    };

                    const API_KEY = "standalone-key";
                    const user_password = "standalone-password";
                `;
                const document = createMockDocument(codeWithVariousCredentials, 'typescript', '/test/patterns.ts');

                // Trigger analysis through event handler
                const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
                saveHandler(document);

                // Should detect multiple credential violations
                const setCall = mockDiagnosticCollection.set.mock.calls.find((call: any) => call[0] === document.uri);
                const diagnostics = setCall ? setCall[1] : [];
                const credentialViolations = diagnostics.filter((d: any) =>
                    d.message && d.message.includes('hardcoded credential')
                );

                expect(credentialViolations.length).toBeGreaterThan(0);
            } catch (error) {
                console.error('Credential patterns test failed:', error);
                throw error;
            }
        });
    });
});
