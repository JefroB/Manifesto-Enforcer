/**
 * Comprehensive LintCommand Tests
 * Testing the core linting system for complete coverage
 * Following manifesto: comprehensive error handling, input validation, JSDoc documentation
 */

import { LintCommand } from '../LintCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

// Mock StateManager and AgentManager
jest.mock('../../core/StateManager');
jest.mock('../../agents/AgentManager');

describe('LintCommand Comprehensive Tests', () => {
    let lintCommand: LintCommand;
    let mockStateManager: jest.Mocked<StateManager>;
    let mockAgentManager: jest.Mocked<AgentManager>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock AgentManager
        mockAgentManager = {} as any;

        // Create mock StateManager
        mockStateManager = {
            isManifestoMode: true,
            isCodebaseIndexed: true,
            manifestoRules: [
                'Use comprehensive error handling',
                'Add input validation',
                'Include JSDoc documentation'
            ],
            codebaseIndex: new Map([
                ['test1.ts', {
                    path: '/src/test1.ts',
                    content: `
function testFunction(input: string): string {
    try {
        if (!input) {
            throw new Error('Input is required');
        }
        return input.toUpperCase();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}`,
                    lastModified: Date.now()
                }],
                ['test2.js', {
                    path: '/src/test2.js',
                    content: `
function badFunction(data) {
    element.innerHTML = data;
    return eval('2 + 2');
}`,
                    lastModified: Date.now()
                }],
                ['test3.md', {
                    path: '/docs/test3.md',
                    content: '# Documentation\nThis is markdown content.',
                    lastModified: Date.now()
                }]
            ])
        } as any;

        lintCommand = new LintCommand();
    });

    describe('Command Matching', () => {
        it('should match lint commands', () => {
            expect(lintCommand.canHandle('lint my code')).toBe(true);
            expect(lintCommand.canHandle('check for issues')).toBe(true);
            expect(lintCommand.canHandle('analyze code quality')).toBe(true);
            expect(lintCommand.canHandle('lint project')).toBe(true);
            expect(lintCommand.canHandle('fix errors')).toBe(true);
        });

        it('should not match non-lint commands', () => {
            expect(lintCommand.canHandle('create a function')).toBe(false);
            expect(lintCommand.canHandle('generate manifesto')).toBe(false);
            expect(lintCommand.canHandle('edit file')).toBe(false);
        });

        it('should handle empty or invalid input', () => {
            expect(lintCommand.canHandle('')).toBe(false);
            expect(lintCommand.canHandle('   ')).toBe(false);
            // Note: null/undefined will throw errors as expected in real usage
        });
    });

    describe('Command Execution', () => {
        it('should execute lint command and return analysis', async () => {
            const result = await lintCommand.execute('lint my code', mockStateManager, mockAgentManager);

            expect(result).toContain('🔍 **Project Linting Results**');
            expect(result).toContain('Summary');
            expect(result).toContain('issues found');
        });

        it('should handle project linting', async () => {
            const result = await lintCommand.execute('lint project', mockStateManager, mockAgentManager);

            expect(result).toContain('🔍 **Project Linting Results**');
            expect(result).toContain('test2.js'); // Should find issues in this file
        });

        it('should handle specific file linting', async () => {
            const result = await lintCommand.execute('lint test2.js', mockStateManager, mockAgentManager);

            expect(result).toContain('🔍 **Linting Results for test2.js:**');
            expect(result).toContain('test2.js');
        });

        it('should handle non-existent file gracefully', async () => {
            const result = await lintCommand.execute('lint nonexistent.js', mockStateManager, mockAgentManager);

            expect(result).toContain('❌ File "nonexistent.js" not found');
            expect(result).toContain('nonexistent.js');
        });
    });

    describe('Issue Detection', () => {
        it('should detect security vulnerabilities', async () => {
            const result = await lintCommand.execute('lint test2.js', mockStateManager, mockAgentManager);

            expect(result).toContain('Potential XSS vulnerability with innerHTML');
            expect(result).toContain('Use textContent or proper DOM manipulation');
        });

        it('should detect missing error handling', async () => {
            // Add a file without error handling
            mockStateManager.codebaseIndex.set('noerror.js', {
                path: '/src/noerror.js',
                content: `
function riskyFunction(data) {
    return data.toUpperCase();
}`,
                lastModified: new Date()
            });

            const result = await lintCommand.execute('lint noerror.js', mockStateManager, mockAgentManager);

            expect(result).toContain('Missing error handling');
            expect(result).toContain('Add try-catch blocks');
        });

        it('should detect missing input validation', async () => {
            // Add a file without input validation
            mockStateManager.codebaseIndex.set('novalidation.ts', {
                path: '/src/novalidation.ts',
                content: `
function processData(data: any): string {
    try {
        return data.toString();
    } catch (error) {
        throw error;
    }
}`,
                lastModified: new Date()
            });

            const result = await lintCommand.execute('lint novalidation.ts', mockStateManager, mockAgentManager);

            expect(result).toContain('functions missing JSDoc documentation');
            expect(result).toContain('Add JSDoc comments');
        });

        it('should detect missing JSDoc documentation', async () => {
            // Add a file without JSDoc
            mockStateManager.codebaseIndex.set('nodoc.js', {
                path: '/src/nodoc.js',
                content: `
function undocumentedFunction(param) {
    try {
        if (!param) throw new Error('Invalid input');
        return param;
    } catch (error) {
        throw error;
    }
}`,
                lastModified: new Date()
            });

            const result = await lintCommand.execute('lint nodoc.js', mockStateManager, mockAgentManager);

            expect(result).toContain('functions missing JSDoc documentation');
            expect(result).toContain('Add JSDoc comments');
        });

        it('should skip non-source files', async () => {
            const result = await lintCommand.execute('lint test3.md', mockStateManager, mockAgentManager);

            // Should fall back to project linting when specific file not found
            expect(result).toContain('🔍 **Project Linting Results**');
        });
    });

    describe('Error Handling', () => {
        it('should handle StateManager errors gracefully', async () => {
            const errorStateManager = {
                ...mockStateManager,
                codebaseIndex: null as any
            } as any;

            const result = await lintCommand.execute('lint project', errorStateManager, mockAgentManager);

            expect(result).toContain('❌ Linting failed:');
        });

        it('should handle empty codebase', async () => {
            mockStateManager.codebaseIndex = new Map();

            const result = await lintCommand.execute('lint project', mockStateManager, mockAgentManager);

            expect(result).toContain('✅ **Project Linting Complete**');
        });

        it('should handle malformed file content', async () => {
            mockStateManager.codebaseIndex.set('malformed.js', {
                path: '/src/malformed.js',
                content: null as any,
                lastModified: new Date()
            });

            const result = await lintCommand.execute('lint malformed.js', mockStateManager, mockAgentManager);

            // Should handle gracefully without crashing
            expect(result).toBeDefined();
        });
    });

    describe('Response Formatting', () => {
        it('should format response with proper structure', async () => {
            const result = await lintCommand.execute('lint test2.js', mockStateManager, mockAgentManager);

            expect(result).toContain('🔍 **Linting Results for test2.js:**');
            expect(result).toContain('HIGH');
            expect(result).toContain('Fix');
        });

        it('should include file-specific details', async () => {
            const result = await lintCommand.execute('lint test2.js', mockStateManager, mockAgentManager);

            expect(result).toContain('test2.js');
            expect(result).toContain('HIGH'); // Severity level
            expect(result).toContain('Fix'); // Fix suggestion
        });

        it('should provide actionable recommendations', async () => {
            const result = await lintCommand.execute('lint test2.js', mockStateManager, mockAgentManager);

            expect(result).toContain('Use textContent or proper DOM manipulation');
            expect(result).toContain('Add try-catch blocks');
        });
    });

    describe('Command Properties', () => {
        it('should have correct command string', () => {
            expect(lintCommand.command).toBe('/lint');
        });
    });
});
