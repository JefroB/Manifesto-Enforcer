/**
 * Comprehensive Tests for EditCommand
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { EditCommand } from '../EditCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';
import { CodebaseFile } from '../../core/types';

// Mock StateManager
const mockStateManager = {
    isCodebaseIndexed: true,
    isAgentMode: false,
    codebaseIndex: new Map<string, CodebaseFile>(),
    getConversationContext: jest.fn(),
    manifestoRules: []
} as any;

// Mock AgentManager
const mockAgentManager = {
    sendMessage: jest.fn()
} as any;

describe('EditCommand', () => {
    let command: EditCommand;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new EditCommand();

        // Reset state manager
        mockStateManager.isCodebaseIndexed = true;
        mockStateManager.isAgentMode = false;
        mockStateManager.codebaseIndex = new Map<string, CodebaseFile>();
        
        // Add sample files to codebase index
        mockStateManager.codebaseIndex.set('/src/UserService.ts', {
            path: '/src/UserService.ts',
            content: 'export class UserService {\n  constructor() {}\n  getUser() { return null; }\n}',
            symbols: [
                { name: 'UserService', type: 'class', line: 1 },
                { name: 'getUser', type: 'method', line: 3 }
            ],
            imports: []
        });

        mockStateManager.codebaseIndex.set('/src/utils.js', {
            path: '/src/utils.js',
            content: 'function helper() { return true; }',
            symbols: [{ name: 'helper', type: 'function', line: 1 }],
            imports: []
        });
    });

    describe('command property', () => {
        it('should have correct command name', () => {
            expect(command.command).toBe('/edit');
        });
    });

    describe('canHandle', () => {
        it('should handle /edit slash command', () => {
            expect(command.canHandle('/edit file.ts')).toBe(true);
            expect(command.canHandle('/EDIT something')).toBe(true);
            expect(command.canHandle('  /edit  ')).toBe(true);
        });

        it('should handle natural language edit requests', () => {
            expect(command.canHandle('edit this file')).toBe(true);
            expect(command.canHandle('modify the function')).toBe(true);
            expect(command.canHandle('update UserService')).toBe(true);
            expect(command.canHandle('change the logic')).toBe(true);
            expect(command.canHandle('fix the bug')).toBe(true);
            expect(command.canHandle('add to the class')).toBe(true);
        });

        it('should not handle unrelated commands', () => {
            expect(command.canHandle('/help')).toBe(false);
            expect(command.canHandle('create new file')).toBe(false);
            expect(command.canHandle('delete everything')).toBe(false);
            expect(command.canHandle('random text')).toBe(false);
        });

        it('should handle case insensitive patterns', () => {
            expect(command.canHandle('EDIT this')).toBe(true);
            expect(command.canHandle('Modify That')).toBe(true);
            expect(command.canHandle('UPDATE something')).toBe(true);
        });
    });

    describe('execute', () => {
        describe('codebase not indexed', () => {
            it('should return warning when codebase not indexed', async () => {
                mockStateManager.isCodebaseIndexed = false;
                
                const result = await command.execute('edit file.ts', mockStateManager, mockAgentManager);
                
                expect(result).toContain('⚠️ **Codebase not indexed yet!**');
                expect(result).toContain('📚 Index Codebase');
            });
        });

        describe('agent mode', () => {
            beforeEach(() => {
                mockStateManager.isAgentMode = true;
            });

            it('should use agent when in agent mode', async () => {
                mockAgentManager.sendMessage.mockResolvedValue({ content: 'Agent response' });
                
                const result = await command.execute('edit UserService.ts', mockStateManager, mockAgentManager);
                
                expect(mockAgentManager.sendMessage).toHaveBeenCalledWith('edit UserService.ts');
                expect(result).toContain('✅ **Agent Mode Active:**');
                expect(result).toContain('Agent response');
            });

            it('should include conversation context when available', async () => {
                mockStateManager.getConversationContext.mockReturnValue('Previous context');
                mockAgentManager.sendMessage.mockResolvedValue({ content: 'Agent response' });
                
                await command.execute('edit file', mockStateManager, mockAgentManager);
                
                expect(mockAgentManager.sendMessage).toHaveBeenCalledWith(
                    'Context from recent conversation:\nPrevious context\n\nCurrent request: edit file'
                );
            });

            it('should handle agent errors gracefully', async () => {
                mockAgentManager.sendMessage.mockRejectedValue(new Error('Agent failed'));
                
                const result = await command.execute('edit file', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Agent execution failed: Agent failed');
            });

            it('should handle non-Error agent failures', async () => {
                mockAgentManager.sendMessage.mockRejectedValue('String error');
                
                const result = await command.execute('edit file', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Agent execution failed: Unknown agent error');
            });
        });

        describe('file editing', () => {
            it('should handle specific file edit requests', async () => {
                const result = await command.execute('edit UserService.ts to add validation', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📝 **Ready to edit UserService.ts**');
                expect(result).toContain('**Edit Type:** Add new functionality');
                expect(result).toContain('**Current Content Preview:**');
                expect(result).toContain('export class UserService');
                expect(result).toContain('**Available Symbols:** UserService(class), getUser(method)');
            });

            it('should handle file not found', async () => {
                const result = await command.execute('edit NonExistent.ts', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ File "NonExistent.ts" not found');
                expect(result).toContain('**Available files:**');
                expect(result).toContain('UserService.ts');
            });

            it('should handle files without content', async () => {
                mockStateManager.codebaseIndex.set('/src/empty.ts', {
                    path: '/src/empty.ts',
                    content: '',
                    symbols: [],
                    imports: []
                });

                const result = await command.execute('edit empty.ts', mockStateManager, mockAgentManager);

                expect(result).toContain('📝 **Ready to edit empty.ts**');
                expect(result).not.toContain('**Current Content Preview:**');
            });

            it('should handle files without symbols', async () => {
                mockStateManager.codebaseIndex.set('/src/simple.ts', {
                    path: '/src/simple.ts',
                    content: 'const x = 1;',
                    symbols: [],
                    imports: []
                });

                const result = await command.execute('edit simple.ts', mockStateManager, mockAgentManager);

                expect(result).toContain('📝 **Ready to edit simple.ts**');
                expect(result).not.toContain('**Available Symbols:**');
            });
        });

        describe('general edit guidance', () => {
            it('should provide general guidance when no file specified', async () => {
                const result = await command.execute('edit something', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📝 **Smart Editing Ready**');
                expect(result).toContain('**Request:** edit something');
                expect(result).toContain('**Edit Type:** General modification');
                expect(result).toContain('**Smart editing features:**');
                expect(result).toContain('**Available files:**');
            });
        });

        describe('error handling', () => {
            it('should handle execution errors gracefully', async () => {
                // Mock an error in the execution path
                mockStateManager.codebaseIndex = null as any;
                
                const result = await command.execute('edit file.ts', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Edit operation failed:');
            });

            it('should handle non-Error exceptions', async () => {
                // Mock a non-Error exception by making codebaseIndex.values() throw
                const originalValues = mockStateManager.codebaseIndex.values;
                mockStateManager.codebaseIndex.values = () => {
                    throw 'String error';
                };

                const result = await command.execute('edit UserService.ts', mockStateManager, mockAgentManager);

                expect(result).toContain('❌ Edit operation failed: String error');

                // Restore original method
                mockStateManager.codebaseIndex.values = originalValues;
            });
        });
    });

    describe('determineEditType', () => {
        it('should identify add/create operations', () => {
            expect(command['determineEditType']('add new function')).toBe('Add new functionality');
            expect(command['determineEditType']('create a method')).toBe('Add new functionality');
        });

        it('should identify fix/repair operations', () => {
            expect(command['determineEditType']('fix the bug')).toBe('Fix existing code');
            expect(command['determineEditType']('repair this issue')).toBe('Fix existing code');
        });

        it('should identify refactor operations', () => {
            expect(command['determineEditType']('refactor the code')).toBe('Refactor/restructure');
            expect(command['determineEditType']('restructure this')).toBe('Refactor/restructure');
        });

        it('should identify update/modify operations', () => {
            expect(command['determineEditType']('update the function')).toBe('Update existing functionality');
            expect(command['determineEditType']('modify this method')).toBe('Update existing functionality');
        });

        it('should identify remove/delete operations', () => {
            expect(command['determineEditType']('remove this code')).toBe('Remove functionality');
            expect(command['determineEditType']('delete the method')).toBe('Remove functionality');
        });

        it('should identify optimize/improve operations', () => {
            expect(command['determineEditType']('optimize performance')).toBe('Optimize/improve');
            expect(command['determineEditType']('improve the logic')).toBe('Optimize/improve');
        });

        it('should default to general modification', () => {
            expect(command['determineEditType']('do something')).toBe('General modification');
            expect(command['determineEditType']('random request')).toBe('General modification');
        });
    });

    describe('getRelevantManifestoRules', () => {
        it('should identify error handling rules', () => {
            const result = command['getRelevantManifestoRules']('fix error handling');
            expect(result).toContain('comprehensive error handling');
        });

        it('should identify testing rules', () => {
            const result = command['getRelevantManifestoRules']('add testing');
            expect(result).toContain('unit tests required');
        });

        it('should identify security rules', () => {
            const result = command['getRelevantManifestoRules']('improve security');
            expect(result).toContain('input validation & security');
        });

        it('should identify performance rules', () => {
            const result = command['getRelevantManifestoRules']('optimize performance');
            expect(result).toContain('<200ms response times');
        });

        it('should identify documentation rules', () => {
            const result = command['getRelevantManifestoRules']('add documentation');
            expect(result).toContain('JSDoc documentation');
        });

        it('should return default rules when no specific matches', () => {
            const result = command['getRelevantManifestoRules']('random request');
            expect(result).toBe('error handling, input validation, testing, documentation');
        });

        it('should combine multiple rules', () => {
            const result = command['getRelevantManifestoRules']('fix error handling and add tests');
            expect(result).toContain('comprehensive error handling');
            expect(result).toContain('unit tests required');
        });
    });

    describe('getAvailableFiles', () => {
        it('should return sorted list of code files', () => {
            const result = command['getAvailableFiles'](mockStateManager);
            
            expect(result).toContain('UserService.ts');
            expect(result).toContain('utils.js');
            expect(result).toEqual(expect.arrayContaining(['UserService.ts', 'utils.js']));
        });

        it('should filter only code files', () => {
            mockStateManager.codebaseIndex.set('/README.md', {
                path: '/README.md',
                content: 'readme',
                symbols: [],
                imports: []
            });

            const result = command['getAvailableFiles'](mockStateManager);

            expect(result).not.toContain('README.md');
            expect(result).toContain('UserService.ts');
        });

        it('should handle empty codebase', () => {
            mockStateManager.codebaseIndex.clear();

            const result = command['getAvailableFiles'](mockStateManager);

            expect(result).toEqual([]);
        });
    });

    describe('generateEditSuggestions', () => {
        let sampleFileData: CodebaseFile;

        beforeEach(() => {
            sampleFileData = {
                path: '/src/test.ts',
                content: 'export class Test {}',
                symbols: [{ name: 'Test', type: 'class', line: 1 }],
                imports: []
            };
        });

        it('should provide error handling suggestions', () => {
            const result = command['generateEditSuggestions']('add error handling', sampleFileData, 'Add new functionality');

            expect(result).toContain('🛡️ **Error Handling:**');
            expect(result).toContain('Add try-catch blocks');
            expect(result).toContain('proper error logging');
            expect(result).toContain('input validation');
        });

        it('should provide testing suggestions', () => {
            const result = command['generateEditSuggestions']('add testing', sampleFileData, 'Add new functionality');

            expect(result).toContain('🧪 **Testing:**');
            expect(result).toContain('Add unit tests');
            expect(result).toContain('80%+ code coverage');
            expect(result).toContain('integration tests');
        });

        it('should provide security suggestions', () => {
            const result = command['generateEditSuggestions']('improve security', sampleFileData, 'Optimize/improve');

            expect(result).toContain('🔒 **Security:**');
            expect(result).toContain('input sanitization');
            expect(result).toContain('authentication checks');
            expect(result).toContain('XSS and injection');
        });

        it('should provide performance suggestions', () => {
            const result = command['generateEditSuggestions']('optimize performance', sampleFileData, 'Optimize/improve');

            expect(result).toContain('⚡ **Performance:**');
            expect(result).toContain('Add caching');
            expect(result).toContain('database queries');
            expect(result).toContain('< 200ms');
        });

        it('should provide documentation suggestions', () => {
            const result = command['generateEditSuggestions']('add documentation', sampleFileData, 'Add new functionality');

            expect(result).toContain('📚 **Documentation:**');
            expect(result).toContain('JSDoc comments');
            expect(result).toContain('API endpoints');
            expect(result).toContain('README');
        });

        it('should always include manifesto compliance suggestions', () => {
            const result = command['generateEditSuggestions']('random request', sampleFileData, 'General modification');

            expect(result).toContain('🛡️ **Manifesto Compliance:**');
            expect(result).toContain('SOLID principles');
            expect(result).toContain('dependency injection');
            expect(result).toContain('separation of concerns');
            expect(result).toContain('comprehensive logging');
        });

        it('should include next steps guidance', () => {
            const result = command['generateEditSuggestions']('any request', sampleFileData, 'General modification');

            expect(result).toContain('💡 **Next Steps:**');
            expect(result).toContain('detailed implementation guidance');
        });

        it('should combine multiple suggestion types', () => {
            const result = command['generateEditSuggestions']('add error handling and testing with security', sampleFileData, 'Add new functionality');

            expect(result).toContain('🛡️ **Error Handling:**');
            expect(result).toContain('🧪 **Testing:**');
            expect(result).toContain('🔒 **Security:**');
            expect(result).toContain('🛡️ **Manifesto Compliance:**');
        });
    });

    describe('provideEditGuidance', () => {
        it('should provide comprehensive edit guidance', async () => {
            const result = await command['provideEditGuidance']('edit something', mockStateManager);

            expect(result).toContain('📝 **Smart Editing Ready**');
            expect(result).toContain('**Request:** edit something');
            expect(result).toContain('**Edit Type:** General modification');
            expect(result).toContain('**Smart editing features:**');
            expect(result).toContain('**Available files:**');
        });

        it('should include available files in guidance', async () => {
            const result = await command['provideEditGuidance']('help with editing', mockStateManager);

            expect(result).toContain('UserService.ts');
            expect(result).toContain('utils.js');
        });
    });

    describe('handleFileEdit', () => {
        it('should handle file edit with all data present', async () => {
            const result = await command['handleFileEdit']('UserService.ts', 'fix the getUser method', mockStateManager);

            expect(result).toContain('📝 **Ready to edit UserService.ts**');
            expect(result).toContain('**Edit Type:** Fix existing code');
            expect(result).toContain('**Current Content Preview:**');
            expect(result).toContain('**Available Symbols:**');
            expect(result).toContain('**Edit Suggestions:**');
        });

        it('should handle file not found in handleFileEdit', async () => {
            const result = await command['handleFileEdit']('missing.ts', 'edit this', mockStateManager);

            expect(result).toContain('❌ File "missing.ts" not found');
            expect(result).toContain('**Available files:**');
        });
    });
});
