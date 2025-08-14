/**
 * Unit tests for extension utility functions
 * Following manifesto principles: comprehensive error handling, input validation, JSDoc documentation
 *
 * NOTE: Extension activation/deactivation tests are in VSCode integration tests (src/test/suite/)
 * This file only tests pure utility functions that don't require VSCode runtime
 */

// Import utility functions for testing (not VSCode-dependent)
import { RuleSeverity, RuleCategory, AgentProvider } from '../core/types';

describe('Extension Types and Constants Tests', () => {

    describe('RuleSeverity enum', () => {
        it('should have all required severity levels', () => {
            expect(RuleSeverity.CRITICAL).toBeDefined();
            expect(RuleSeverity.MANDATORY).toBeDefined();
            expect(RuleSeverity.REQUIRED).toBeDefined();
            expect(RuleSeverity.OPTIMIZE).toBeDefined();
            expect(RuleSeverity.RECOMMENDED).toBeDefined();
        });
    });

    describe('RuleCategory enum', () => {
        it('should have all required categories', () => {
            expect(RuleCategory.SECURITY).toBeDefined();
            expect(RuleCategory.PERFORMANCE).toBeDefined();
            expect(RuleCategory.CODE_QUALITY).toBeDefined();
            expect(RuleCategory.TESTING).toBeDefined();
            expect(RuleCategory.ARCHITECTURE).toBeDefined();
            expect(RuleCategory.DOCUMENTATION).toBeDefined();
            expect(RuleCategory.ERROR_HANDLING).toBeDefined();
            expect(RuleCategory.GENERAL).toBeDefined();
        });
    });

    describe('AgentProvider enum', () => {
        it('should have all required agent providers', () => {
            expect(AgentProvider.AUGGIE).toBeDefined();
            expect(AgentProvider.AMAZON_Q).toBeDefined();
            expect(AgentProvider.CLINE).toBeDefined();
            expect(AgentProvider.COPILOT).toBeDefined();
            expect(AgentProvider.OPENAI).toBeDefined();
            expect(AgentProvider.OLLAMA).toBeDefined();
            expect(AgentProvider.LOCAL).toBeDefined();
        });
    });
});
