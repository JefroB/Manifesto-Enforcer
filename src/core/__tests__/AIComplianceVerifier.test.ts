/**
 * MANDATORY: Comprehensive tests for AIComplianceVerifier
 * REQUIRED: 100% test coverage for AI compliance verification
 */

import { AIComplianceVerifier } from '../AIComplianceVerifier';

describe('AIComplianceVerifier', () => {
    let verifier: AIComplianceVerifier;

    beforeEach(() => {
        verifier = new AIComplianceVerifier();
        jest.clearAllMocks();
    });

    describe('verifyAIResponse', () => {
        it('should throw error for empty response', async () => {
            await expect(verifier.verifyAIResponse('')).rejects.toThrow('MANIFESTO VIOLATION: Response is required');
        });

        it('should throw error for null response', async () => {
            await expect(verifier.verifyAIResponse(null as any)).rejects.toThrow('MANIFESTO VIOLATION: Response is required');
        });

        it('should throw error for undefined response', async () => {
            await expect(verifier.verifyAIResponse(undefined as any)).rejects.toThrow('MANIFESTO VIOLATION: Response is required');
        });

        it('should return true for compliant response', async () => {
            const compliantResponse = `
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
            `;

            const result = await verifier.verifyAIResponse(compliantResponse);
            expect(result).toBe(true);
        });

        it('should return false for response with innerHTML violation', async () => {
            const violatingResponse = `
                function unsafeFunction() {
                    element.innerHTML = '<script>alert("xss")</script>';
                }
            `;

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = await verifier.verifyAIResponse(violatingResponse);
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', ['AI suggested prohibited innerHTML usage']);
            
            consoleSpy.mockRestore();
        });

        it('should return false for response with any type violation', async () => {
            const violatingResponse = `
                function badFunction(param: any) {
                    return param;
                }
            `;

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = await verifier.verifyAIResponse(violatingResponse);
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', ['AI suggested prohibited any type usage']);
            
            consoleSpy.mockRestore();
        });

        it('should return false for async function without error handling', async () => {
            const violatingResponse = `
                async function badAsyncFunction() {
                    const data = await fetch('/api/data');
                    return data.json();
                }
            `;

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = await verifier.verifyAIResponse(violatingResponse);
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', ['AI suggested async code without error handling']);
            
            consoleSpy.mockRestore();
        });

        it('should return false for multiple violations', async () => {
            const violatingResponse = `
                async function terribleFunction(param: any) {
                    element.innerHTML = param;
                    const data = await fetch('/api/data');
                    return data;
                }
            `;

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = await verifier.verifyAIResponse(violatingResponse);
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', [
                'AI suggested prohibited innerHTML usage',
                'AI suggested prohibited any type usage',
                'AI suggested async code without error handling'
            ]);
            
            consoleSpy.mockRestore();
        });

        it('should allow async function with try-catch', async () => {
            const compliantResponse = `
                async function goodAsyncFunction() {
                    try {
                        const data = await fetch('/api/data');
                        return data.json();
                    } catch (error) {
                        console.error('Error:', error);
                        throw error;
                    }
                }
            `;

            const result = await verifier.verifyAIResponse(compliantResponse);
            expect(result).toBe(true);
        });

        it('should allow async function with catch block', async () => {
            const compliantResponse = `
                async function goodAsyncFunction() {
                    return fetch('/api/data').catch(error => {
                        console.error('Error:', error);
                        throw error;
                    });
                }
            `;

            const result = await verifier.verifyAIResponse(compliantResponse);
            expect(result).toBe(true);
        });
    });

    describe('scanForViolations', () => {
        it('should detect innerHTML violations', () => {
            const response = 'element.innerHTML = "test"';
            const violations = (verifier as any).scanForViolations(response);
            expect(violations).toContain('AI suggested prohibited innerHTML usage');
        });

        it('should detect any type violations', () => {
            const response = 'function test(param: any) {}';
            const violations = (verifier as any).scanForViolations(response);
            expect(violations).toContain('AI suggested prohibited any type usage');
        });

        it('should detect missing error handling in async functions', () => {
            const response = 'async function test() { await something(); }';
            const violations = (verifier as any).scanForViolations(response);
            expect(violations).toContain('AI suggested async code without error handling');
        });

        it('should return empty array for compliant code', () => {
            const response = 'function test() { return "safe"; }';
            const violations = (verifier as any).scanForViolations(response);
            expect(violations).toEqual([]);
        });
    });

    describe('reportAIViolation', () => {
        it('should log violations to console', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const violations = ['Test violation'];
            
            await (verifier as any).reportAIViolation(violations);
            
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', violations);
            consoleSpy.mockRestore();
        });

        it('should handle multiple violations', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const violations = ['Violation 1', 'Violation 2', 'Violation 3'];
            
            await (verifier as any).reportAIViolation(violations);
            
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', violations);
            consoleSpy.mockRestore();
        });

        it('should handle empty violations array', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const violations: string[] = [];
            
            await (verifier as any).reportAIViolation(violations);
            
            expect(consoleSpy).toHaveBeenCalledWith('AI Compliance Violations:', violations);
            consoleSpy.mockRestore();
        });
    });
});
