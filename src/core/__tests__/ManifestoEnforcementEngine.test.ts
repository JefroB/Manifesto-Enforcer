/**
 * MANDATORY: Comprehensive tests for ManifestoEnforcementEngine
 * REQUIRED: Test-driven development approach
 * CRITICAL: All enforcement mechanisms must be tested
 */

import * as vscode from 'vscode';
import { ManifestoEnforcementEngine } from '../ManifestoEnforcementEngine';
import { ManifestoPreCommitHook } from '../ManifestoPreCommitHook';
import { ManifestoSaveGuard } from '../ManifestoSaveGuard';
import { TestExecutionEnforcer } from '../TestExecutionEnforcer';
import { AIComplianceVerifier } from '../AIComplianceVerifier';

// MANDATORY: Mock all dependencies
jest.mock('vscode');
jest.mock('../ManifestoPreCommitHook');
jest.mock('../ManifestoSaveGuard');
jest.mock('../TestExecutionEnforcer');
jest.mock('../AIComplianceVerifier');

describe('ManifestoEnforcementEngine', () => {
    let engine: ManifestoEnforcementEngine;
    let mockPreCommitHook: jest.Mocked<ManifestoPreCommitHook>;
    let mockSaveGuard: jest.Mocked<ManifestoSaveGuard>;
    let mockTestEnforcer: jest.Mocked<TestExecutionEnforcer>;
    let mockAIVerifier: jest.Mocked<AIComplianceVerifier>;

    beforeEach(() => {
        // REQUIRED: Reset all mocks before each test
        jest.clearAllMocks();

        // MANDATORY: Create mock instances
        mockPreCommitHook = {
            validateBeforeCommit: jest.fn(),
        } as any;

        mockSaveGuard = {
            onWillSaveDocument: jest.fn(),
        } as any;

        mockTestEnforcer = {
            enforceTestsBeforeAction: jest.fn(),
        } as any;

        mockAIVerifier = {
            verifyAIResponse: jest.fn(),
        } as any;

        // REQUIRED: Initialize engine with mocked dependencies
        engine = new ManifestoEnforcementEngine(
            mockPreCommitHook,
            mockSaveGuard,
            mockTestEnforcer,
            mockAIVerifier
        );
    });

    describe('Constructor', () => {
        it('should initialize with all enforcement components', () => {
            // MANDATORY: Verify proper initialization
            expect(engine).toBeDefined();
            expect(engine).toBeInstanceOf(ManifestoEnforcementEngine);
        });

        it('should throw error if any component is missing', () => {
            // CRITICAL: Validate required dependencies
            expect(() => {
                new ManifestoEnforcementEngine(null as any, mockSaveGuard, mockTestEnforcer, mockAIVerifier);
            }).toThrow('MANIFESTO VIOLATION: All enforcement components are required');
        });
    });

    describe('enforceCompliance', () => {
        it('should enforce pre-commit validation for commit actions', async () => {
            // REQUIRED: Test commit enforcement
            mockPreCommitHook.validateBeforeCommit.mockResolvedValue(true);

            await engine.enforceCompliance({
                type: 'commit',
                data: { message: 'test commit' }
            });

            expect(mockPreCommitHook.validateBeforeCommit).toHaveBeenCalledTimes(1);
        });

        it('should block commits when pre-commit validation fails', async () => {
            // CRITICAL: Test commit blocking
            mockPreCommitHook.validateBeforeCommit.mockRejectedValue(
                new Error('MANIFESTO VIOLATION: Cannot commit with failing tests')
            );

            await expect(engine.enforceCompliance({
                type: 'commit',
                data: { message: 'test commit' }
            })).rejects.toThrow('MANIFESTO VIOLATION: Cannot commit with failing tests');
        });

        it('should enforce save validation for save actions', async () => {
            // REQUIRED: Test save enforcement
            const mockDocument = { uri: { fsPath: '/test/file.ts' } } as vscode.TextDocument;
            mockSaveGuard.onWillSaveDocument.mockResolvedValue(undefined);

            await engine.enforceCompliance({
                type: 'save',
                data: { document: mockDocument }
            });

            expect(mockSaveGuard.onWillSaveDocument).toHaveBeenCalledWith(mockDocument);
        });

        it('should block saves when validation fails', async () => {
            // CRITICAL: Test save blocking
            const mockDocument = { uri: { fsPath: '/test/file.ts' } } as vscode.TextDocument;
            mockSaveGuard.onWillSaveDocument.mockRejectedValue(
                new Error('Save blocked by manifesto enforcement')
            );

            await expect(engine.enforceCompliance({
                type: 'save',
                data: { document: mockDocument }
            })).rejects.toThrow('Save blocked by manifesto enforcement');
        });

        it('should verify AI responses for ai-interaction actions', async () => {
            // REQUIRED: Test AI verification
            mockAIVerifier.verifyAIResponse.mockResolvedValue(true);

            await engine.enforceCompliance({
                type: 'ai-interaction',
                data: { response: 'AI response text' }
            });

            expect(mockAIVerifier.verifyAIResponse).toHaveBeenCalledWith('AI response text');
        });

        it('should reject non-compliant AI responses', async () => {
            // CRITICAL: Test AI response rejection
            mockAIVerifier.verifyAIResponse.mockResolvedValue(false);

            await expect(engine.enforceCompliance({
                type: 'ai-interaction',
                data: { response: 'Non-compliant AI response' }
            })).rejects.toThrow('MANIFESTO VIOLATION: AI response violates manifesto rules');
        });

        it('should enforce test execution for test-required actions', async () => {
            // REQUIRED: Test execution enforcement
            mockTestEnforcer.enforceTestsBeforeAction.mockResolvedValue(undefined);

            await engine.enforceCompliance({
                type: 'deploy',
                data: { environment: 'production' }
            });

            expect(mockTestEnforcer.enforceTestsBeforeAction).toHaveBeenCalledWith('deploy');
        });

        it('should handle unknown action types gracefully', async () => {
            // MANDATORY: Error handling for unknown actions
            await expect(engine.enforceCompliance({
                type: 'unknown' as any,
                data: {}
            })).rejects.toThrow('MANIFESTO VIOLATION: Unknown action type: unknown');
        });
    });

    describe('Error Handling', () => {
        it('should handle null action gracefully', async () => {
            // MANDATORY: Input validation
            await expect(engine.enforceCompliance(null as any))
                .rejects.toThrow('MANIFESTO VIOLATION: Action cannot be null or undefined');
        });

        it('should handle undefined action gracefully', async () => {
            // MANDATORY: Input validation
            await expect(engine.enforceCompliance(undefined as any))
                .rejects.toThrow('MANIFESTO VIOLATION: Action cannot be null or undefined');
        });

        it('should handle missing action type', async () => {
            // MANDATORY: Input validation
            await expect(engine.enforceCompliance({} as any))
                .rejects.toThrow('MANIFESTO VIOLATION: Action type is required');
        });
    });

    describe('Performance', () => {
        it('should complete enforcement within performance requirements', async () => {
            // OPTIMIZE: Performance testing
            const startTime = Date.now();
            
            mockPreCommitHook.validateBeforeCommit.mockResolvedValue(true);

            await engine.enforceCompliance({
                type: 'commit',
                data: { message: 'test commit' }
            });

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(200); // OPTIMIZE: Under 200ms requirement
        });
    });
});
