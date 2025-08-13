/**
 * MANDATORY: Proactive manifesto enforcement engine
 * REQUIRED: Prevents manifesto violations before they happen
 * CRITICAL: Core enforcement mechanism for manifesto compliance
 */

import * as vscode from 'vscode';
import { ManifestoPreCommitHook } from './ManifestoPreCommitHook';
import { ManifestoSaveGuard } from './ManifestoSaveGuard';
import { TestExecutionEnforcer } from './TestExecutionEnforcer';
import { AIComplianceVerifier } from './AIComplianceVerifier';

/**
 * REQUIRED: Action types that can be enforced
 */
export interface ManifestoAction {
    type: 'commit' | 'save' | 'ai-interaction' | 'deploy' | 'build' | 'test';
    data: any;
}

/**
 * MANDATORY: Main enforcement engine that coordinates all compliance mechanisms
 */
export class ManifestoEnforcementEngine {
    private preCommitHook: ManifestoPreCommitHook;
    private saveGuard: ManifestoSaveGuard;
    private testEnforcer: TestExecutionEnforcer;
    private aiVerifier: AIComplianceVerifier;

    /**
     * REQUIRED: Initialize enforcement engine with all components
     */
    constructor(
        preCommitHook?: ManifestoPreCommitHook,
        saveGuard?: ManifestoSaveGuard,
        testEnforcer?: TestExecutionEnforcer,
        aiVerifier?: AIComplianceVerifier
    ) {
        // MANDATORY: Validate all required components
        if (!preCommitHook || !saveGuard || !testEnforcer || !aiVerifier) {
            throw new Error('MANIFESTO VIOLATION: All enforcement components are required');
        }

        this.preCommitHook = preCommitHook;
        this.saveGuard = saveGuard;
        this.testEnforcer = testEnforcer;
        this.aiVerifier = aiVerifier;
    }

    /**
     * CRITICAL: Main enforcement method that prevents manifesto violations
     */
    async enforceCompliance(action: ManifestoAction): Promise<void> {
        try {
            // MANDATORY: Input validation
            if (!action) {
                throw new Error('MANIFESTO VIOLATION: Action cannot be null or undefined');
            }

            if (!action.type) {
                throw new Error('MANIFESTO VIOLATION: Action type is required');
            }

            // REQUIRED: Route to appropriate enforcement mechanism
            switch (action.type) {
                case 'commit':
                    await this.enforceCommitCompliance(action);
                    break;

                case 'save':
                    await this.enforceSaveCompliance(action);
                    break;

                case 'ai-interaction':
                    await this.enforceAICompliance(action);
                    break;

                case 'deploy':
                case 'build':
                case 'test':
                    await this.enforceTestCompliance(action);
                    break;

                default:
                    throw new Error(`MANIFESTO VIOLATION: Unknown action type: ${action.type}`);
            }

        } catch (error) {
            // MANDATORY: Proper error handling
            console.error('ManifestoEnforcementEngine error:', error);
            throw error;
        }
    }

    /**
     * CRITICAL: Enforce commit compliance - block commits with failing tests
     */
    private async enforceCommitCompliance(action: ManifestoAction): Promise<void> {
        try {
            const isValid = await this.preCommitHook.validateBeforeCommit();
            if (!isValid) {
                throw new Error('MANIFESTO VIOLATION: Commit validation failed');
            }
        } catch (error) {
            throw error; // Re-throw to maintain error context
        }
    }

    /**
     * REQUIRED: Enforce save compliance - warn about manifesto violations
     */
    private async enforceSaveCompliance(action: ManifestoAction): Promise<void> {
        try {
            if (!action.data?.document) {
                throw new Error('MANIFESTO VIOLATION: Document is required for save actions');
            }

            await this.saveGuard.onWillSaveDocument(action.data.document);
        } catch (error) {
            throw error; // Re-throw to maintain error context
        }
    }

    /**
     * CRITICAL: Enforce AI compliance - verify AI responses follow manifesto
     */
    private async enforceAICompliance(action: ManifestoAction): Promise<void> {
        try {
            if (!action.data?.response) {
                throw new Error('MANIFESTO VIOLATION: Response is required for AI actions');
            }

            const isCompliant = await this.aiVerifier.verifyAIResponse(action.data.response);
            if (!isCompliant) {
                throw new Error('MANIFESTO VIOLATION: AI response violates manifesto rules');
            }
        } catch (error) {
            throw error; // Re-throw to maintain error context
        }
    }

    /**
     * MANDATORY: Enforce test compliance - require passing tests before actions
     */
    private async enforceTestCompliance(action: ManifestoAction): Promise<void> {
        try {
            await this.testEnforcer.enforceTestsBeforeAction(action.type);
        } catch (error) {
            throw error; // Re-throw to maintain error context
        }
    }

    /**
     * REQUIRED: Get current enforcement status
     */
    async getEnforcementStatus(): Promise<{
        preCommitEnabled: boolean;
        saveGuardEnabled: boolean;
        testEnforcementEnabled: boolean;
        aiVerificationEnabled: boolean;
    }> {
        return {
            preCommitEnabled: !!this.preCommitHook,
            saveGuardEnabled: !!this.saveGuard,
            testEnforcementEnabled: !!this.testEnforcer,
            aiVerificationEnabled: !!this.aiVerifier
        };
    }

    /**
     * OPTIMIZE: Enable/disable specific enforcement mechanisms
     */
    async configureEnforcement(config: {
        preCommit?: boolean;
        saveGuard?: boolean;
        testEnforcement?: boolean;
        aiVerification?: boolean;
    }): Promise<void> {
        // REQUIRED: Configuration management
        // Implementation would update internal state based on config
        console.log('Enforcement configuration updated:', config);
    }

    /**
     * DOCUMENT: Dispose of resources when engine is no longer needed
     */
    dispose(): void {
        // REQUIRED: Cleanup resources
        // Implementation would clean up any listeners or resources
    }
}
