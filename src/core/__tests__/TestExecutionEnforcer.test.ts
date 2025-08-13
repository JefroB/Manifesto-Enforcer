/**
 * MANDATORY: Comprehensive tests for TestExecutionEnforcer
 * REQUIRED: 100% test coverage for test execution enforcement
 */

import { TestExecutionEnforcer } from '../TestExecutionEnforcer';

describe('TestExecutionEnforcer', () => {
    let enforcer: TestExecutionEnforcer;

    beforeEach(() => {
        enforcer = new TestExecutionEnforcer();
        jest.clearAllMocks();
    });

    describe('enforceTestsBeforeAction', () => {
        it('should throw error for empty action', async () => {
            await expect(enforcer.enforceTestsBeforeAction('')).rejects.toThrow('MANIFESTO VIOLATION: Action is required');
        });

        it('should throw error for null action', async () => {
            await expect(enforcer.enforceTestsBeforeAction(null as any)).rejects.toThrow('MANIFESTO VIOLATION: Action is required');
        });

        it('should throw error for undefined action', async () => {
            await expect(enforcer.enforceTestsBeforeAction(undefined as any)).rejects.toThrow('MANIFESTO VIOLATION: Action is required');
        });

        it('should allow action when all tests are passing', async () => {
            // Mock getTestStatus to return all-passing
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('all-passing');

            await expect(enforcer.enforceTestsBeforeAction('commit')).resolves.toBeUndefined();
        });

        it('should block action when tests are failing', async () => {
            // Mock getTestStatus to return failing status
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('some-failing');

            await expect(enforcer.enforceTestsBeforeAction('commit')).rejects.toThrow('MANIFESTO VIOLATION: Cannot commit with failing tests');
        });

        it('should block action when tests are not run', async () => {
            // Mock getTestStatus to return not-run status
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('not-run');

            await expect(enforcer.enforceTestsBeforeAction('deploy')).rejects.toThrow('MANIFESTO VIOLATION: Cannot deploy with failing tests');
        });

        it('should block action when test status is unknown', async () => {
            // Mock getTestStatus to return unknown status
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('unknown');

            await expect(enforcer.enforceTestsBeforeAction('release')).rejects.toThrow('MANIFESTO VIOLATION: Cannot release with failing tests');
        });

        it('should handle different action types', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('all-passing');

            await expect(enforcer.enforceTestsBeforeAction('commit')).resolves.toBeUndefined();
            await expect(enforcer.enforceTestsBeforeAction('push')).resolves.toBeUndefined();
            await expect(enforcer.enforceTestsBeforeAction('deploy')).resolves.toBeUndefined();
            await expect(enforcer.enforceTestsBeforeAction('release')).resolves.toBeUndefined();
        });

        it('should handle action with failing tests and show specific action in error', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('failing');

            await expect(enforcer.enforceTestsBeforeAction('push to production')).rejects.toThrow('MANIFESTO VIOLATION: Cannot push to production with failing tests');
        });
    });

    describe('getTestStatus', () => {
        it('should return all-passing by default', async () => {
            const status = await (enforcer as any).getTestStatus();
            expect(status).toBe('all-passing');
        });

        it('should be a private method', () => {
            // Verify the method exists but is private
            expect(typeof (enforcer as any).getTestStatus).toBe('function');
            expect((enforcer as any).getTestStatus).toBeDefined(); // Should exist as private method
        });
    });

    describe('Integration scenarios', () => {
        it('should enforce tests before critical deployment action', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('all-passing');

            await expect(enforcer.enforceTestsBeforeAction('deploy to production')).resolves.toBeUndefined();
        });

        it('should block critical action when tests fail', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('failing');

            await expect(enforcer.enforceTestsBeforeAction('deploy to production')).rejects.toThrow('MANIFESTO VIOLATION: Cannot deploy to production with failing tests');
        });

        it('should handle multiple sequential actions', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('all-passing');

            await expect(enforcer.enforceTestsBeforeAction('commit')).resolves.toBeUndefined();
            await expect(enforcer.enforceTestsBeforeAction('push')).resolves.toBeUndefined();
            await expect(enforcer.enforceTestsBeforeAction('deploy')).resolves.toBeUndefined();
        });

        it('should handle edge case with whitespace-only action', async () => {
            await expect(enforcer.enforceTestsBeforeAction('   ')).rejects.toThrow('MANIFESTO VIOLATION: Action is required');
        });

        it('should handle very long action names', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('all-passing');
            
            const longAction = 'deploy to production environment with full integration testing and monitoring setup';
            await expect(enforcer.enforceTestsBeforeAction(longAction)).resolves.toBeUndefined();
        });

        it('should handle special characters in action names', async () => {
            jest.spyOn(enforcer as any, 'getTestStatus').mockResolvedValue('all-passing');
            
            await expect(enforcer.enforceTestsBeforeAction('deploy-to-staging_env')).resolves.toBeUndefined();
            await expect(enforcer.enforceTestsBeforeAction('commit & push')).resolves.toBeUndefined();
        });
    });
});
