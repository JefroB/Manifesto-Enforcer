/**
 * ManifestoCommand Integration Tests - End-to-end functionality validation
 */

import { ManifestoCommand } from '../ManifestoCommand';
import { StateManager } from '../../core/StateManager';
import { RuleSeverity, RuleCategory } from '../../core/types';
import { AgentManager } from '../../agents/AgentManager';

// Mock VSCode
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn()
        }))
    },
    ConfigurationTarget: { Global: 1 }
}));

// Mock FileLifecycleManager
jest.mock('../../core/FileLifecycleManager', () => ({
    FileLifecycleManager: jest.fn().mockImplementation(() => ({
        handleFileLifecycle: jest.fn().mockResolvedValue({
            success: true,
            filePath: '/test/manifesto.md',
            message: 'Manifesto created successfully'
        })
    }))
}));

describe('ManifestoCommand Integration', () => {
    let manifestoCommand: ManifestoCommand;
    let mockStateManager: jest.Mocked<StateManager>;
    let mockAgentManager: jest.Mocked<AgentManager>;

    beforeEach(() => {
        mockStateManager = {
            isCodebaseIndexed: false,
            manifestoRules: [],
            isAutoMode: false // Default to manual mode for testing action buttons
        } as any;

        mockAgentManager = {} as any;

        manifestoCommand = new ManifestoCommand();
    });

    describe('canHandle - Real World Input Validation', () => {
        it('should handle slash commands', () => {
            expect(manifestoCommand.canHandle('/manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('/manifesto show')).toBe(true);
        });

        it('should handle manifesto display requests', () => {
            expect(manifestoCommand.canHandle('show manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('display rules')).toBe(true);
            expect(manifestoCommand.canHandle('read manifesto')).toBe(true);
        });

        it('should handle perfect manifesto generation requests', () => {
            expect(manifestoCommand.canHandle('generate manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('create qa manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('generate security manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('create api manifesto')).toBe(true);
        });

        it('should handle real-world typos and variations', () => {
            // The exact input that failed in manual testing
            expect(manifestoCommand.canHandle('create me a manifsto for a node,js project')).toBe(true);

            // Common typos
            expect(manifestoCommand.canHandle('create me a manfesto')).toBe(true);
            expect(manifestoCommand.canHandle('generate manifiest for react')).toBe(true);
            expect(manifestoCommand.canHandle('make a manifest for my app')).toBe(true);
            expect(manifestoCommand.canHandle('gen manifesto')).toBe(true);

            // Casual language patterns
            expect(manifestoCommand.canHandle('create me a manifesto for my project')).toBe(true);
            expect(manifestoCommand.canHandle('make a manifesto for node.js')).toBe(true);
            expect(manifestoCommand.canHandle('generate a manifesto for python app')).toBe(true);
            expect(manifestoCommand.canHandle('build manifesto for react application')).toBe(true);
        });

        it('should handle project-specific requests', () => {
            expect(manifestoCommand.canHandle('manifesto for react project')).toBe(true);
            expect(manifestoCommand.canHandle('manifesto for node.js app')).toBe(true);
            expect(manifestoCommand.canHandle('manifesto for python application')).toBe(true);
        });

        it('should not handle unrelated requests', () => {
            expect(manifestoCommand.canHandle('hello world')).toBe(false);
            expect(manifestoCommand.canHandle('lint code')).toBe(false);
            expect(manifestoCommand.canHandle('edit file')).toBe(false);
            expect(manifestoCommand.canHandle('create a function')).toBe(false);
            expect(manifestoCommand.canHandle('generate code')).toBe(false);
        });

        it('should prioritize over CodeCommand for manifesto requests', () => {
            // These should go to ManifestoCommand, not CodeCommand
            expect(manifestoCommand.canHandle('create manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('create me a manifesto')).toBe(true);
            expect(manifestoCommand.canHandle('generate manifesto code')).toBe(true);
        });
    });

    describe('execute - manifesto generation for empty projects', () => {
        it('should generate general manifesto with action buttons', async () => {
            const input = 'generate manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('📋 **General Manifesto Template**');
            expect(result).toContain('Perfect for new projects!');
            expect(result).toContain('Generated Manifesto Preview');
            expect(result).toContain('Ready to create your manifesto file!');
            
            // Should contain action buttons HTML
            expect(result).toContain('<div class="chat-actions">');
            expect(result).toContain('📋 Create manifesto.md');
            expect(result).toContain('data-action-command="createManifesto"');
        });

        it('should detect React project type', async () => {
            const input = 'generate React TypeScript manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('**Detected Project Type:** React');
            expect(result).toContain('🚀 Create Hello World (React)');
            expect(result).toContain('data-action-command="executeTddWorkflow"');
        });

        it('should detect Python project type', async () => {
            const input = 'create python manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('**Detected Project Type:** Python');
            expect(result).toContain('🚀 Create Hello World (Python)');
        });

        it('should detect Node.js project type with typos', async () => {
            // Test the exact failing case
            const input = 'create me a manifsto for a node,js project';

            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);

            expect(result).toContain('**Detected Project Type:** Node.js');
            expect(result).toContain('📋 Create manifesto.md');
            expect(result).toContain('🚀 Create Hello World (Node.js)');
        });

        it('should handle various Node.js spelling variations', async () => {
            const inputs = [
                'generate manifesto for nodejs project',
                'create manifesto for node project',
                'make manifesto for express app',
                'gen manifesto for node,js'
            ];

            for (const input of inputs) {
                const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
                expect(result).toContain('Node.js');
            }
        });

        it('should generate QA manifesto type', async () => {
            const input = 'generate qa manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('📋 **QA/Testing Manifesto Template**');
            expect(result).toContain('Unit tests for all functions');
            expect(result).toContain('Integration tests for all API endpoints');
        });

        it('should generate Security manifesto type', async () => {
            const input = 'create security manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('📋 **Security Manifesto Template**');
            expect(result).toContain('OWASP Top 10 compliance');
            expect(result).toContain('Security code reviews');
        });
    });

    describe('execute - manifesto display', () => {
        it('should show built-in manifesto when no file exists', async () => {
            const input = 'show manifesto';

            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);

            expect(result).toContain('📋 **Development Manifesto Summary:**');
            expect(result).toContain('The full manifesto is in manifesto.md');
        });

        it('should handle manifesto display with existing rules', async () => {
            mockStateManager.manifestoRules = [
                {
                    id: 'rule1',
                    text: 'Test rule 1',
                    severity: RuleSeverity.CRITICAL,
                    category: RuleCategory.SECURITY,
                    description: 'Test rule 1 description'
                },
                {
                    id: 'rule2',
                    text: 'Test rule 2',
                    severity: RuleSeverity.RECOMMENDED,
                    category: RuleCategory.DOCUMENTATION,
                    description: 'Test rule 2 description'
                }
            ];

            const input = 'display rules';

            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);

            expect(result).toContain('📋 **Development Manifesto Summary:**');
            expect(result).toContain('**Indexed Rules:** 2 rules loaded');
        });
    });

    describe('project type detection', () => {
        it('should detect various JavaScript frameworks', async () => {
            const testCases = [
                { input: 'generate react manifesto', expected: 'React' },
                { input: 'create vue.js manifesto', expected: 'Vue.js' },
                { input: 'generate angular manifesto', expected: 'Angular' },
                { input: 'create typescript manifesto', expected: 'TypeScript' },
                { input: 'generate javascript manifesto', expected: 'JavaScript' }
            ];

            for (const testCase of testCases) {
                const result = await manifestoCommand.execute(testCase.input, mockStateManager, mockAgentManager);
                expect(result).toContain(`**Detected Project Type:** ${testCase.expected}`);
            }
        });

        it('should detect backend technologies', async () => {
            const testCases = [
                { input: 'generate node.js manifesto', expected: 'Node.js' },
                { input: 'create python django manifesto', expected: 'Python' },
                { input: 'generate java spring manifesto', expected: 'Java' },
                { input: 'create c# dotnet manifesto', expected: 'C#' },
                { input: 'generate go manifesto', expected: 'Go' }
            ];

            for (const testCase of testCases) {
                const result = await manifestoCommand.execute(testCase.input, mockStateManager, mockAgentManager);
                expect(result).toContain(`**Detected Project Type:** ${testCase.expected}`);
            }
        });
    });

    describe('manifesto content generation', () => {
        it('should generate comprehensive manifesto content', async () => {
            const input = 'generate manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            // Should contain all major sections
            expect(result).toContain('CODE QUALITY ENFORCEMENT');
            expect(result).toContain('ARCHITECTURE COMPLIANCE');
            expect(result).toContain('SECURITY REQUIREMENTS');
            expect(result).toContain('COMPLIANCE VALIDATION');
            
            // Should contain specific requirements
            expect(result).toContain('comprehensive error handling');
            expect(result).toContain('JSDoc documentation');
            expect(result).toContain('SOLID principles');
            expect(result).toContain('Input validation');
            expect(result).toContain('XSS prevention');
        });

        it('should include project-specific rules when type detected', async () => {
            const input = 'generate React manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('REACT SPECIFIC STANDARDS');
            expect(result).toContain('Functional components with hooks');
            expect(result).toContain('PropTypes or TypeScript');
            expect(result).toContain('React Testing Library');
        });
    });

    describe('action button generation', () => {
        it('should always include manifesto creation button', async () => {
            const input = 'generate manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('data-action-command="createManifesto"');
            expect(result).toContain('📋 Create manifesto.md');
        });

        it('should include preview button', async () => {
            const input = 'generate manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('data-action-command="previewManifesto"');
            expect(result).toContain('👁️ Preview Full Content');
        });

        it('should include hello world button when project type detected', async () => {
            const input = 'generate TypeScript manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).toContain('data-action-command="executeTddWorkflow"');
            expect(result).toContain('🚀 Create Hello World (TypeScript)');
        });

        it('should not include hello world button when no project type detected', async () => {
            const input = 'generate manifesto';
            
            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);
            
            expect(result).not.toContain('data-action-command="createHelloWorld"');
        });
    });

    describe('error handling', () => {
        it('should handle execution errors gracefully', async () => {
            // Force an error by providing invalid input
            const input = 'generate manifesto';

            // Mock a method to throw an error
            jest.spyOn(manifestoCommand as any, 'generateManifestoFileContent').mockImplementation(() => {
                throw new Error('Test error');
            });

            const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);

            expect(result).toContain('❌ Failed to generate manifesto');
            expect(result).toContain('Test error');
        });
    });

    describe('StorageService Integration', () => {
        it('should use StorageService for manifesto file path instead of workspace root', async () => {
            try {
                // This test will fail because we haven't refactored manifesto creation to use StorageService yet
                const input = 'generate manifesto';

                // Mock StorageService
                const mockGetProjectArtifactsPath = jest.fn().mockResolvedValue('/global/storage/projects/testhash/manifesto.md');
                const storageServiceSpy = jest.spyOn(require('../../core/StorageService').StorageService, 'getInstance').mockReturnValue({
                    getProjectArtifactsPath: mockGetProjectArtifactsPath
                });

                // Execute the command to generate manifesto content
                const result = await manifestoCommand.execute(input, mockStateManager, mockAgentManager);

                // Verify the command generates content (this should work)
                expect(result).toContain('📋 **General Manifesto Template**');

                // Now test the actual file creation through AutoModeManager
                const autoModeManager = new (require('../../core/AutoModeManager').AutoModeManager)(mockStateManager);

                // Mock the action data that would be created by the UI
                const action = {
                    command: 'createManifesto',
                    data: {
                        content: 'Test manifesto content',
                        type: 'General',
                        forceOverwrite: false,
                        createBackup: false
                    }
                };

                // Mock the file manager to return success so we can test the path usage
                const mockFileManager = {
                    fileExists: jest.fn().mockResolvedValue(false),
                    writeCodeToFile: jest.fn().mockResolvedValue({
                        success: true,
                        path: '/global/storage/projects/testhash/manifesto.md',
                        message: 'File created successfully'
                    })
                };
                (autoModeManager as any).fileManager = mockFileManager;

                // This should use StorageService.getProjectArtifactsPath instead of hardcoded 'manifesto.md'
                const actionResult = await autoModeManager.executeAction(action, mockAgentManager);

                // Verify StorageService was used for getting the file path
                expect(storageServiceSpy).toHaveBeenCalled();
                expect(mockGetProjectArtifactsPath).toHaveBeenCalledWith('manifesto.md');

                // Verify the file operation was called with the correct path from StorageService
                expect(mockFileManager.writeCodeToFile).toHaveBeenCalledWith({
                    path: '/global/storage/projects/testhash/manifesto.md',
                    content: 'Test manifesto content',
                    type: 'create',
                    backup: false
                });

                // Verify the action was successful
                expect(actionResult).toContain('✅ **General Manifesto Created Successfully!**');
            } catch (error) {
                throw error;
            }
        });
    });
});
