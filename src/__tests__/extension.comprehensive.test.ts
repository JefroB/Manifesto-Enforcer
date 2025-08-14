/**
 * Unit tests for extension constants and utilities
 * Following manifesto: comprehensive error handling, input validation, JSDoc documentation
 *
 * NOTE: Extension activation/deactivation tests are in VSCode integration tests (src/test/suite/)
 * This file only tests pure utility functions that don't require VSCode runtime
 */

// Import utility functions for testing (not VSCode-dependent)
import { RuleSeverity, RuleCategory, AgentProvider } from '../core/types';

describe('Extension Constants and Utilities Tests', () => {

    describe('Type definitions', () => {
        it('should have consistent enum values', () => {
            // Test that enums are properly defined (these are string enums)
            expect(typeof RuleSeverity.CRITICAL).toBe('string');
            expect(typeof RuleCategory.SECURITY).toBe('string');
            expect(typeof AgentProvider.AUGGIE).toBe('string');
        });

        it('should have all required severity levels', () => {
            const severityValues = Object.values(RuleSeverity);
            expect(severityValues.length).toBeGreaterThan(0);
            expect(severityValues).toContain('CRITICAL');
            expect(severityValues).toContain('MANDATORY');
            expect(severityValues).toContain('REQUIRED');
        });

        it('should have all required categories', () => {
            const categoryValues = Object.values(RuleCategory);
            expect(categoryValues.length).toBeGreaterThan(0);
            expect(categoryValues).toContain('SECURITY');
            expect(categoryValues).toContain('PERFORMANCE');
            expect(categoryValues).toContain('CODE_QUALITY');
        });

        it('should have all required agent providers', () => {
            const providerValues = Object.values(AgentProvider);
            expect(providerValues.length).toBeGreaterThan(0);
            expect(providerValues).toContain('auggie');
            expect(providerValues).toContain('amazon-q');
            expect(providerValues).toContain('cline');
        });
    });
});
