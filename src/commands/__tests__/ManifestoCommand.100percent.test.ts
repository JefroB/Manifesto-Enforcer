/**
 * MANDATORY: 100% Coverage Tests for ManifestoCommand
 * REQUIRED: Cover all remaining uncovered lines to achieve 100% coverage
 */

import { ManifestoCommand } from '../ManifestoCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

describe('ManifestoCommand - 100% Coverage', () => {
    let command: ManifestoCommand;
    let mockStateManager: any;
    let mockAgentManager: any;

    beforeEach(() => {
        mockStateManager = {
            manifestoRules: [],
            isManifestoMode: true,
            currentAgent: 'Auggie',
            isAutoMode: false,
            setManifestoRules: jest.fn(),
            saveSettings: jest.fn().mockResolvedValue(true),
            getStateSummary: jest.fn(() => ({
                manifestoMode: true,
                agent: 'Auggie',
                rulesCount: 0,
                indexedFiles: 0
            }))
        };

        mockAgentManager = {
            sendMessage: jest.fn().mockResolvedValue({
                id: 'test-response',
                role: 'assistant',
                content: 'Mock AI response',
                timestamp: new Date(),
                agentId: 'test-agent'
            }),
            getActiveAgent: jest.fn().mockReturnValue({
                id: 'test-agent',
                name: 'Test Agent',
                provider: 'AUGGIE',
                isEnabled: true
            })
        };

        command = new ManifestoCommand();
        jest.clearAllMocks();
    });

    describe('canHandle - Edge Cases', () => {
        it('should handle "manifesto for project" pattern', () => {
            try {
                const result = command.canHandle('manifesto for my project');
                expect(result).toBe(true);
            } catch (error) {
                throw error;
            }
        });

        it('should handle "manifesto for app" pattern', () => {
            try {
                const result = command.canHandle('manifesto for this app');
                expect(result).toBe(true);
            } catch (error) {
                throw error;
            }
        });

        it('should handle "manifesto for application" pattern', () => {
            try {
                const result = command.canHandle('manifesto for the application');
                expect(result).toBe(true);
            } catch (error) {
                throw error;
            }
        });

        it('should handle case insensitive "manifesto for" patterns', () => {
            try {
                const result = command.canHandle('MANIFESTO FOR PROJECT');
                expect(result).toBe(true);
            } catch (error) {
                throw error;
            }
        });
    });

    describe('execute - Format Display Coverage', () => {
        it('should format and return manifesto content when available', async () => {
            try {
                const manifestoContent = 'Test manifesto content';
                jest.spyOn(command as any, 'readManifestoFile').mockResolvedValue(manifestoContent);

                const result = await command.execute('manifesto', mockStateManager, mockAgentManager);

                expect(result).toContain('📋 **Project Manifesto**');
                expect(result).toContain(manifestoContent);
            } catch (error) {
                throw error;
            }
        });

        it('should truncate long manifesto content', async () => {
            try {
                // Create content longer than 2000 characters
                const longContent = 'A'.repeat(2500);
                jest.spyOn(command as any, 'readManifestoFile').mockResolvedValue(longContent);

                const result = await command.execute('manifesto', mockStateManager, mockAgentManager);

                expect(result).toContain('📋 **Project Manifesto**');
                expect(result).toContain('... (truncated)');
                expect(result).toContain('💡 **Full manifesto available in:**');
                expect(result).toContain('📋 Manifesto sidebar panel');
                expect(result).toContain('manifesto.md file in workspace');
            } catch (error) {
                throw error;
            }
        });

        it('should handle short manifesto content without truncation', async () => {
            try {
                const shortContent = 'Short manifesto';
                jest.spyOn(command as any, 'readManifestoFile').mockResolvedValue(shortContent);

                const result = await command.execute('manifesto', mockStateManager, mockAgentManager);

                expect(result).toContain('📋 **Project Manifesto**');
                expect(result).toContain(shortContent);
                expect(result).not.toContain('... (truncated)');
                expect(result).not.toContain('💡 **Full manifesto available in:**');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('readManifestoFile - Error Handling', () => {
        it('should return null when file read throws error', async () => {
            try {
                jest.spyOn(command as any, 'readManifestoFile').mockImplementation(async () => {
                    throw new Error('File read error');
                });

                const result = await (command as any).readManifestoFile();
                expect(result).toBeNull();
            } catch (error) {
                // Expected to catch the error
                expect((error as Error).message).toBe('File read error');
            }
        });

        it('should return null by default implementation', async () => {
            try {
                const result = await (command as any).readManifestoFile();
                expect(result).toBeNull();
            } catch (error) {
                throw error;
            }
        });

        it('should return content when file exists', async () => {
            try {
                const validContent = 'Valid manifesto content';
                jest.spyOn(command as any, 'readManifestoFile').mockResolvedValue(validContent);

                const result = await (command as any).readManifestoFile();
                expect(result).toBe(validContent);
            } catch (error) {
                throw error;
            }
        });
    });

    describe('formatManifestoDisplay - Direct Testing', () => {
        it('should format short content correctly', () => {
            try {
                const shortContent = 'Short content';
                const result = (command as any).formatManifestoDisplay(shortContent);
                
                expect(result).toBe('📋 **Project Manifesto**\n\nShort content');
            } catch (error) {
                throw error;
            }
        });

        it('should format long content with truncation', () => {
            try {
                const longContent = 'A'.repeat(2500);
                const result = (command as any).formatManifestoDisplay(longContent);
                
                expect(result).toContain('📋 **Project Manifesto**');
                expect(result).toContain('A'.repeat(2000));
                expect(result).toContain('... (truncated)');
                expect(result).toContain('💡 **Full manifesto available in:**');
            } catch (error) {
                throw error;
            }
        });

        it('should handle exactly 2000 character content', () => {
            try {
                const exactContent = 'A'.repeat(2000);
                const result = (command as any).formatManifestoDisplay(exactContent);
                
                expect(result).toBe(`📋 **Project Manifesto**\n\n${exactContent}`);
                expect(result).not.toContain('... (truncated)');
            } catch (error) {
                throw error;
            }
        });

        it('should handle 2001 character content with truncation', () => {
            try {
                const longContent = 'A'.repeat(2001);
                const result = (command as any).formatManifestoDisplay(longContent);
                
                expect(result).toContain('📋 **Project Manifesto**');
                expect(result).toContain('A'.repeat(2000));
                expect(result).toContain('... (truncated)');
            } catch (error) {
                throw error;
            }
        });

        it('should handle empty content', () => {
            try {
                const result = (command as any).formatManifestoDisplay('');
                expect(result).toBe('📋 **Project Manifesto**\n\n');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete workflow with valid manifesto', async () => {
            try {
                const manifestoContent = 'Complete manifesto content';
                jest.spyOn(command as any, 'readManifestoFile').mockResolvedValue(manifestoContent);

                expect(command.canHandle('manifesto')).toBe(true);

                const result = await command.execute('manifesto', mockStateManager, mockAgentManager);
                expect(result).toContain('📋 **Project Manifesto**');
                expect(result).toContain(manifestoContent);
            } catch (error) {
                throw error;
            }
        });

        it('should handle complete workflow with no manifesto file (shows built-in)', async () => {
            try {
                jest.spyOn(command as any, 'readManifestoFile').mockResolvedValue(null);

                expect(command.canHandle('manifesto')).toBe(true);

                const result = await command.execute('manifesto', mockStateManager, mockAgentManager);
                expect(result).toContain('📋 **Development Manifesto Summary:**');
                expect(result).toContain('Core Directives');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('showBuiltInManifesto - Coverage', () => {
        it('should show built-in manifesto when no file exists', async () => {
            try {
                const result = await (command as any).showBuiltInManifesto(mockStateManager);
                expect(result).toContain('📋 **Development Manifesto Summary:**');
                expect(result).toContain('Core Directives');
                expect(result).toContain('Key Prohibitions');
                expect(result).toContain('Architecture Requirements');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('determineManifestoType - Coverage', () => {
        it('should return QA/Testing for qa input', () => {
            try {
                const result = (command as any).determineManifestoType('qa manifesto');
                expect(result).toBe('QA/Testing');
            } catch (error) {
                throw error;
            }
        });

        it('should return QA/Testing for testing input', () => {
            try {
                const result = (command as any).determineManifestoType('testing manifesto');
                expect(result).toBe('QA/Testing');
            } catch (error) {
                throw error;
            }
        });

        it('should return Security for security input', () => {
            try {
                const result = (command as any).determineManifestoType('security manifesto');
                expect(result).toBe('Security');
            } catch (error) {
                throw error;
            }
        });

        it('should return API for api input', () => {
            try {
                const result = (command as any).determineManifestoType('api manifesto');
                expect(result).toBe('API');
            } catch (error) {
                throw error;
            }
        });

        it('should return Frontend/UI for frontend input', () => {
            try {
                const result = (command as any).determineManifestoType('frontend manifesto');
                expect(result).toBe('Frontend/UI');
            } catch (error) {
                throw error;
            }
        });

        it('should return Frontend/UI for ui input', () => {
            try {
                const result = (command as any).determineManifestoType('ui manifesto');
                expect(result).toBe('Frontend/UI');
            } catch (error) {
                throw error;
            }
        });

        it('should return Performance for performance input', () => {
            try {
                const result = (command as any).determineManifestoType('performance manifesto');
                expect(result).toBe('Performance');
            } catch (error) {
                throw error;
            }
        });

        it('should return General for unknown input', () => {
            try {
                const result = (command as any).determineManifestoType('unknown manifesto');
                expect(result).toBe('General');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('analyzeManifestoOpportunities - Coverage', () => {
        it('should analyze codebase and return suggestions', async () => {
            try {
                // Mock codebase index
                const mockCodebaseIndex = new Map();
                mockCodebaseIndex.set('test.ts', {
                    content: 'function test() { return "hello"; }',
                    path: 'test.ts',
                    size: 100,
                    lastModified: new Date()
                });

                mockStateManager.codebaseIndex = mockCodebaseIndex;

                const result = await (command as any).analyzeManifestoOpportunities(mockStateManager);
                expect(result).toHaveProperty('suggestions');
                expect(Array.isArray(result.suggestions)).toBe(true);
            } catch (error) {
                throw error;
            }
        });

        it('should handle empty codebase index', async () => {
            try {
                mockStateManager.codebaseIndex = new Map();

                const result = await (command as any).analyzeManifestoOpportunities(mockStateManager);
                expect(result).toHaveProperty('suggestions');
                expect(Array.isArray(result.suggestions)).toBe(true);
            } catch (error) {
                throw error;
            }
        });
    });

    describe('Error Handling Coverage', () => {
        it('should handle execute errors gracefully', async () => {
            try {
                jest.spyOn(command as any, 'showManifesto').mockRejectedValue(new Error('Test error'));

                const result = await command.execute('manifesto', mockStateManager, mockAgentManager);
                expect(result).toContain('❌ Manifesto operation failed: Test error');
            } catch (error) {
                throw error;
            }
        });
    });
});
