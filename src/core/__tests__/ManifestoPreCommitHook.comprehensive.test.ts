/**
 * MANDATORY: Comprehensive tests for ManifestoPreCommitHook
 * REQUIRED: 100% test coverage for pre-commit hook functionality
 */

// Mock child_process and util at the module level FIRST
const mockExecAsync = jest.fn();

jest.mock('child_process', () => ({
    exec: jest.fn()
}));

jest.mock('util', () => ({
    promisify: () => mockExecAsync
}));

// Mock VSCode
jest.mock('vscode', () => ({
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }]
    }
}));

import * as vscode from 'vscode';
import { ManifestoPreCommitHook } from '../ManifestoPreCommitHook';
import { exec } from 'child_process';

describe('ManifestoPreCommitHook', () => {
    let hook: ManifestoPreCommitHook;

    beforeEach(() => {
        hook = new ManifestoPreCommitHook();
        jest.clearAllMocks();
    });

    describe('validateBeforeCommit', () => {
        it('should return true when all validations pass', async () => {
            try {
                // Mock all validation methods to succeed
                jest.spyOn(hook as any, 'validateWorkspace').mockResolvedValue(undefined);
                jest.spyOn(hook as any, 'runAllTests').mockResolvedValue({ passed: 10, failed: 0, total: 10, duration: 1000 });
                jest.spyOn(hook as any, 'checkCodeCoverage').mockResolvedValue({ passed: true, percentage: 85, threshold: 80 });
                jest.spyOn(hook as any, 'validateLinting').mockResolvedValue(undefined);
                jest.spyOn(hook as any, 'checkGitStatus').mockResolvedValue(undefined);

                const result = await hook.validateBeforeCommit();
                expect(result).toBe(true);
            } catch (error) {
                throw error;
            }
        });

        it('should throw error when workspace validation fails', async () => {
            try {
                jest.spyOn(hook as any, 'validateWorkspace').mockRejectedValue(new Error('No workspace'));

                await expect(hook.validateBeforeCommit()).rejects.toThrow('No workspace');
            } catch (error) {
                throw error;
            }
        });

        it('should log error and rethrow when validation fails', async () => {
            try {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                jest.spyOn(hook as any, 'validateWorkspace').mockRejectedValue(new Error('Test error'));

                await expect(hook.validateBeforeCommit()).rejects.toThrow('Test error');
                expect(consoleSpy).toHaveBeenCalledWith('Pre-commit validation failed:', expect.any(Error));
                
                consoleSpy.mockRestore();
            } catch (error) {
                throw error;
            }
        });
    });

    describe('runAllTests', () => {
        it('should return test results when all tests pass', async () => {
            try {
                const mockStdout = 'Tests: 10 passed, 0 failed, 10 total';
                mockExecAsync.mockResolvedValue({ stdout: mockStdout, stderr: '' });

                const result = await hook.runAllTests();
                expect(result).toEqual({
                    passed: 10,
                    failed: 0,
                    total: 10,
                    duration: 0
                });
            } catch (error) {
                throw error;
            }
        });

        it('should throw error when tests fail', async () => {
            try {
                const mockStdout = 'Tests: 8 passed, 2 failed, 10 total';
                mockExecAsync.mockResolvedValue({ stdout: mockStdout, stderr: '' });

                await expect(hook.runAllTests()).rejects.toThrow('MANIFESTO VIOLATION: Cannot commit with 2 failing tests');
            } catch (error) {
                throw error;
            }
        });

        it('should throw error when test execution fails', async () => {
            try {
                mockExecAsync.mockRejectedValue(new Error('Command failed'));

                await expect(hook.runAllTests()).rejects.toThrow('MANIFESTO VIOLATION: Test execution failed');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('checkCodeCoverage', () => {
        it('should return coverage results when coverage meets threshold', async () => {
            try {
                const mockStdout = 'All files | 85.5 | 80.0 | 90.0 | 85.5';
                mockExecAsync.mockResolvedValue({ stdout: mockStdout, stderr: '' });

                const result = await hook.checkCodeCoverage();
                expect(result).toEqual({
                    passed: true,
                    percentage: 85.5,
                    threshold: 80
                });
            } catch (error) {
                throw error;
            }
        });

        it('should throw error when coverage below threshold', async () => {
            try {
                const mockStdout = 'All files | 75.0 | 80.0 | 90.0 | 75.0';
                mockExecAsync.mockResolvedValue({ stdout: mockStdout, stderr: '' });

                await expect(hook.checkCodeCoverage()).rejects.toThrow('MANIFESTO VIOLATION: Code coverage 75% below required 80%');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('validateWorkspace', () => {
        it('should pass when workspace folders exist', async () => {
            try {
                await expect((hook as any).validateWorkspace()).resolves.toBeUndefined();
            } catch (error) {
                throw error;
            }
        });

        it('should throw error when no workspace folders', async () => {
            try {
                (vscode.workspace as any).workspaceFolders = null;

                await expect((hook as any).validateWorkspace()).rejects.toThrow('MANIFESTO VIOLATION: No workspace folder found');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('getWorkspaceRoot', () => {
        it('should return workspace root path', () => {
            // Ensure workspace folders are set for this test
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: [{ uri: { fsPath: '/test/workspace' } }],
                configurable: true
            });

            const result = (hook as any).getWorkspaceRoot();
            expect(result).toBe('/test/workspace');
        });

        it('should throw error when no workspace folders', () => {
            // Mock no workspace folders for this test
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: undefined,
                configurable: true
            });

            expect(() => (hook as any).getWorkspaceRoot()).toThrow('MANIFESTO VIOLATION: No workspace folder found');
        });
    });

    describe('parseTestResults', () => {
        it('should parse test results correctly', () => {
            try {
                const output = 'Tests: 10 passed, 2 failed, 12 total';
                const result = (hook as any).parseTestResults(output);
                expect(result).toEqual({
                    passed: 10,
                    failed: 2,
                    total: 12,
                    duration: 0
                });
            } catch (error) {
                throw error;
            }
        });

        it('should return default values for unparseable output', () => {
            try {
                const output = 'Invalid output format';
                const result = (hook as any).parseTestResults(output);
                expect(result).toEqual({
                    passed: 0,
                    failed: 0,
                    total: 0,
                    duration: 0
                });
            } catch (error) {
                throw error;
            }
        });
    });

    describe('parseCoverageResults', () => {
        it('should parse coverage percentage correctly', () => {
            try {
                const output = 'All files | 85.5 | 80.0 | 90.0 | 85.5';
                const result = (hook as any).parseCoverageResults(output);
                expect(result).toEqual({ percentage: 85.5 });
            } catch (error) {
                throw error;
            }
        });

        it('should return 0 for unparseable output', () => {
            try {
                const output = 'Invalid coverage format';
                const result = (hook as any).parseCoverageResults(output);
                expect(result).toEqual({ percentage: 0 });
            } catch (error) {
                throw error;
            }
        });
    });

    describe('createTimeoutPromise', () => {
        it('should create timeout promise that rejects', async () => {
            try {
                // Override the timeout to be much shorter for testing
                (hook as any).TEST_TIMEOUT = 100; // 100ms for testing

                const timeoutPromise = (hook as any).createTimeoutPromise();
                await expect(timeoutPromise).rejects.toThrow('MANIFESTO VIOLATION: Test execution timed out');
            } catch (error) {
                throw error;
            }
        }, 1000); // 1 second timeout for the test itself
    });
});
