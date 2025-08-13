/**
 * MANDATORY: Comprehensive tests for ManifestoSaveGuard
 * REQUIRED: 100% test coverage for save guard functionality
 */

import * as vscode from 'vscode';
import { ManifestoSaveGuard } from '../ManifestoSaveGuard';

// Mock VSCode
jest.mock('vscode', () => ({
    window: {
        showErrorMessage: jest.fn()
    }
}));

describe('ManifestoSaveGuard', () => {
    let saveGuard: ManifestoSaveGuard;
    let mockDocument: vscode.TextDocument;

    beforeEach(() => {
        saveGuard = new ManifestoSaveGuard();
        jest.clearAllMocks();

        // Create mock document
        mockDocument = {
            getText: jest.fn(),
            uri: { fsPath: '/test/file.ts' },
            fileName: 'test.ts',
            languageId: 'typescript'
        } as any;
    });

    describe('onWillSaveDocument', () => {
        it('should throw error for null document', async () => {
            await expect(saveGuard.onWillSaveDocument(null as any)).rejects.toThrow('MANIFESTO VIOLATION: Document is required');
        });

        it('should throw error for undefined document', async () => {
            await expect(saveGuard.onWillSaveDocument(undefined as any)).rejects.toThrow('MANIFESTO VIOLATION: Document is required');
        });

        it('should allow saving compliant document', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                function safeFunction() {
                    try {
                        const element = document.createElement('div');
                        element.textContent = 'safe content';
                        return element;
                    } catch (error) {
                        console.error('Error:', error);
                        throw error;
                    }
                }
            `);

            await expect(saveGuard.onWillSaveDocument(mockDocument)).resolves.toBeUndefined();
            expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
        });

        it('should show error dialog for innerHTML violation and block save when user chooses Fix Issues', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                function unsafeFunction() {
                    element.innerHTML = '<script>alert("xss")</script>';
                }
            `);

            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue('Fix Issues');

            await expect(saveGuard.onWillSaveDocument(mockDocument)).rejects.toThrow('Save blocked by manifesto enforcement');
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MANIFESTO VIOLATION: This file violates 1 manifesto rules. Save anyway?',
                'Fix Issues', 'Save Anyway'
            );
        });

        it('should allow save when user chooses Save Anyway', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                function unsafeFunction() {
                    element.innerHTML = '<script>alert("xss")</script>';
                }
            `);

            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue('Save Anyway');

            await expect(saveGuard.onWillSaveDocument(mockDocument)).resolves.toBeUndefined();
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MANIFESTO VIOLATION: This file violates 1 manifesto rules. Save anyway?',
                'Fix Issues', 'Save Anyway'
            );
        });

        it('should block save for any type violation when user chooses Fix Issues', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                function badFunction(param: any) {
                    return param;
                }
            `);

            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue('Fix Issues');

            await expect(saveGuard.onWillSaveDocument(mockDocument)).rejects.toThrow('Save blocked by manifesto enforcement');
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MANIFESTO VIOLATION: This file violates 1 manifesto rules. Save anyway?',
                'Fix Issues', 'Save Anyway'
            );
        });

        it('should block save for async function without error handling', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                async function badAsyncFunction() {
                    const data = await fetch('/api/data');
                    return data.json();
                }
            `);

            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue('Fix Issues');

            await expect(saveGuard.onWillSaveDocument(mockDocument)).rejects.toThrow('Save blocked by manifesto enforcement');
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MANIFESTO VIOLATION: This file violates 1 manifesto rules. Save anyway?',
                'Fix Issues', 'Save Anyway'
            );
        });

        it('should show correct count for multiple violations', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                async function terribleFunction(param: any) {
                    element.innerHTML = param;
                    const data = await fetch('/api/data');
                    return data;
                }
            `);

            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue('Fix Issues');

            await expect(saveGuard.onWillSaveDocument(mockDocument)).rejects.toThrow('Save blocked by manifesto enforcement');
            
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MANIFESTO VIOLATION: This file violates 3 manifesto rules. Save anyway?',
                'Fix Issues', 'Save Anyway'
            );
        });

        it('should allow async function with try-catch', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                async function goodAsyncFunction() {
                    try {
                        const data = await fetch('/api/data');
                        return data.json();
                    } catch (error) {
                        console.error('Error:', error);
                        throw error;
                    }
                }
            `);

            await expect(saveGuard.onWillSaveDocument(mockDocument)).resolves.toBeUndefined();
            expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
        });

        it('should block save when user dismisses dialog (returns undefined)', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                element.innerHTML = 'unsafe';
            `);

            (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);

            await expect(saveGuard.onWillSaveDocument(mockDocument)).rejects.toThrow('Save blocked by manifesto enforcement');
        });
    });

    describe('checkManifestoCompliance', () => {
        it('should detect innerHTML violations', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue('element.innerHTML = "test"');
            
            const violations = await (saveGuard as any).checkManifestoCompliance(mockDocument);
            expect(violations).toContain('PROHIBITED: innerHTML usage detected');
        });

        it('should detect any type violations', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue('function test(param: any) {}');
            
            const violations = await (saveGuard as any).checkManifestoCompliance(mockDocument);
            expect(violations).toContain('CRITICAL: any type usage detected');
        });

        it('should detect missing error handling in async functions', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue('async function test() { await something(); }');
            
            const violations = await (saveGuard as any).checkManifestoCompliance(mockDocument);
            expect(violations).toContain('MANDATORY: Missing error handling in async function');
        });

        it('should return empty array for compliant code', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue('function test() { return "safe"; }');
            
            const violations = await (saveGuard as any).checkManifestoCompliance(mockDocument);
            expect(violations).toEqual([]);
        });

        it('should detect multiple violations', async () => {
            (mockDocument.getText as jest.Mock).mockReturnValue(`
                async function terribleFunction(param: any) {
                    element.innerHTML = param;
                    const data = await fetch('/api/data');
                    return data;
                }
            `);
            
            const violations = await (saveGuard as any).checkManifestoCompliance(mockDocument);
            expect(violations).toHaveLength(3);
            expect(violations).toContain('PROHIBITED: innerHTML usage detected');
            expect(violations).toContain('CRITICAL: any type usage detected');
            expect(violations).toContain('MANDATORY: Missing error handling in async function');
        });
    });
});
