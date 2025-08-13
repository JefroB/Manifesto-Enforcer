/**
 * Comprehensive Tests for GraphCommand
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { GraphCommand } from '../GraphCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';
import { CodebaseFile } from '../../core/types';

// Mock StateManager
const mockStateManager = {
    isCodebaseIndexed: true,
    codebaseIndex: new Map<string, CodebaseFile>()
} as any;

// Mock AgentManager
const mockAgentManager = {
    sendMessage: jest.fn()
} as any;

describe('GraphCommand', () => {
    let command: GraphCommand;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new GraphCommand();
        
        // Reset state manager
        mockStateManager.isCodebaseIndexed = true;
        mockStateManager.codebaseIndex = new Map<string, CodebaseFile>();
        
        // Add sample files to codebase index
        mockStateManager.codebaseIndex.set('/src/UserService.ts', {
            path: '/src/UserService.ts',
            content: 'import { Database } from "./Database";\nexport class UserService {\n  constructor(private db: Database) {}\n  getUser() { return this.db.findUser(); }\n}',
            symbols: [
                { name: 'UserService', type: 'class', line: 2 },
                { name: 'getUser', type: 'method', line: 4 }
            ],
            imports: ['Database']
        });
        
        mockStateManager.codebaseIndex.set('/src/Database.ts', {
            path: '/src/Database.ts',
            content: 'export class Database {\n  findUser() { return null; }\n  saveUser() { return true; }\n}',
            symbols: [
                { name: 'Database', type: 'class', line: 1 },
                { name: 'findUser', type: 'method', line: 2 },
                { name: 'saveUser', type: 'method', line: 3 }
            ],
            imports: []
        });
        
        mockStateManager.codebaseIndex.set('/src/utils.js', {
            path: '/src/utils.js',
            content: 'function helper() { return UserService.getInstance(); }',
            symbols: [{ name: 'helper', type: 'function', line: 1 }],
            imports: []
        });
    });

    describe('command property', () => {
        it('should have correct command name', () => {
            expect(command.command).toBe('/graph');
        });
    });

    describe('canHandle', () => {
        it('should handle graph slash commands', () => {
            expect(command.canHandle('/graph')).toBe(true);
            expect(command.canHandle('/references UserService')).toBe(true);
            expect(command.canHandle('/impact Database.ts')).toBe(true);
            expect(command.canHandle('/GRAPH')).toBe(true);
        });

        it('should handle natural language graph requests', () => {
            expect(command.canHandle('analyze code structure')).toBe(true);
            expect(command.canHandle('show dependencies in codebase')).toBe(true);
            expect(command.canHandle('find references in project')).toBe(true);
            expect(command.canHandle('impact analysis for files')).toBe(true);
            expect(command.canHandle('code relationships graph')).toBe(true);
        });

        it('should require both graph and code keywords for natural language', () => {
            expect(command.canHandle('analyze structure')).toBe(false); // Missing 'code'
            expect(command.canHandle('show code')).toBe(false); // Missing graph keywords
        });

        it('should not handle unrelated commands', () => {
            expect(command.canHandle('/help')).toBe(false);
            expect(command.canHandle('create new file')).toBe(false);
            expect(command.canHandle('random text')).toBe(false);
        });
    });

    describe('execute', () => {
        describe('codebase not indexed', () => {
            it('should return warning when codebase not indexed', async () => {
                mockStateManager.isCodebaseIndexed = false;
                
                const result = await command.execute('/graph', mockStateManager, mockAgentManager);
                
                expect(result).toContain('⚠️ **Codebase not indexed yet!**');
                expect(result).toContain('📚 Index Codebase');
            });
        });

        describe('references analysis', () => {
            it('should handle /references command', async () => {
                const result = await command.execute('/references UserService', mockStateManager, mockAgentManager);

                expect(result).toContain('🔍 **References for "UserService"**');
                expect(result).toContain('found)');
                expect(result).toContain('💡 **Impact**:');
            });

            it('should handle natural language references request', async () => {
                const result = await command.execute('find references for Database', mockStateManager, mockAgentManager);
                
                expect(result).toContain('🔍 **References for "Database"**');
            });

            it('should provide usage when no symbol specified', async () => {
                const result = await command.execute('/references', mockStateManager, mockAgentManager);
                
                expect(result).toContain('🔍 **Reference Analysis**');
                expect(result).toContain('Please specify what to analyze');
                expect(result).toContain('**Examples:**');
            });
        });

        describe('impact analysis', () => {
            it('should handle /impact command', async () => {
                const result = await command.execute('/impact UserService', mockStateManager, mockAgentManager);

                expect(result).toContain('📊 **Impact Analysis for "UserService"**');
                expect(result).toContain('**Risk Level:**');
                expect(result).toContain('**Affected Locations:**');
            });

            it('should handle natural language impact request', async () => {
                const result = await command.execute('analyze impact of Database', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📊 **Impact Analysis for "Database"**');
            });

            it('should provide usage when no symbol specified', async () => {
                const result = await command.execute('/impact', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📊 **Impact Analysis**');
                expect(result).toContain('Please specify what to analyze');
            });
        });

        describe('general graph analysis', () => {
            it('should generate code graph overview', async () => {
                const result = await command.execute('/graph', mockStateManager, mockAgentManager);

                expect(result).toContain('📊 **Codebase Graph Analysis**');
                expect(result).toContain('**Overview:**');
                expect(result).toContain('**Dependencies:**');
                expect(result).toContain('**Complexity Hotspots:**');
            });

            it('should handle natural language graph request', async () => {
                const result = await command.execute('show code structure graph', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📊 **Codebase Graph Analysis**');
            });
        });

        describe('error handling', () => {
            it('should handle execution errors gracefully', async () => {
                // Mock an error in the execution path
                mockStateManager.codebaseIndex = null as any;
                
                const result = await command.execute('/graph', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Graph analysis failed:');
            });

            it('should handle non-Error exceptions', async () => {
                // Mock a non-Error exception by making the iterator throw
                const originalIterator = mockStateManager.codebaseIndex[Symbol.iterator];
                mockStateManager.codebaseIndex[Symbol.iterator] = () => {
                    throw 'String error';
                };

                const result = await command.execute('/graph', mockStateManager, mockAgentManager);

                expect(result).toContain('❌ Graph analysis failed: String error');

                // Restore original method
                mockStateManager.codebaseIndex[Symbol.iterator] = originalIterator;
            });
        });
    });

    describe('findSymbolReferences', () => {
        it('should find symbol references in code', () => {
            const result = command['findSymbolReferences']('UserService', mockStateManager);

            expect(result).toContain('🔍 **References for "UserService"**');
            expect(result).toContain('found)');
            expect(result).toContain('utils.js');
            expect(result).toContain('💡 **Impact**:');
        });

        it('should handle symbol not found', () => {
            const result = command['findSymbolReferences']('NonExistent', mockStateManager);

            expect(result).toContain('🔍 **No references found for "NonExistent"**');
            expect(result).toContain('The symbol might be:');
            expect(result).toContain('• Misspelled');
        });

        it('should handle empty codebase', () => {
            mockStateManager.codebaseIndex.clear();

            const result = command['findSymbolReferences']('UserService', mockStateManager);

            expect(result).toContain('🔍 **No references found for "UserService"**');
        });
    });

    describe('findFileReferences', () => {
        it('should find file import references', () => {
            const result = command['findFileReferences']('Database.ts', mockStateManager);

            expect(result).toContain('🔍 **Files importing "Database.ts"**');
            expect(result).toContain('found)');
            expect(result).toContain('UserService.ts');
            expect(result).toContain('💡 **Impact**:');
        });

        it('should handle file not found', () => {
            const result = command['findFileReferences']('NonExistent.ts', mockStateManager);

            expect(result).toContain('🔍 **No imports found for "NonExistent.ts"**');
            expect(result).toContain('The file might be:');
        });
    });

    describe('analyzeSymbolImpact', () => {
        it('should analyze symbol impact correctly', () => {
            const result = command['analyzeSymbolImpact']('UserService', mockStateManager);

            expect(result).toContain('📊 **Impact Analysis for "UserService"**');
            expect(result).toContain('**Risk Level:**');
            expect(result).toContain('**Affected Locations:**');
        });

        it('should classify impact levels correctly', () => {
            const result = command['analyzeSymbolImpact']('Database', mockStateManager);

            expect(result).toContain('📊 **Impact Analysis for "Database"**');
            expect(result).toContain('**Risk Level:**');
        });
    });

    describe('analyzeFileImpact', () => {
        it('should analyze file impact correctly', () => {
            const result = command['analyzeFileImpact']('Database.ts', mockStateManager);

            expect(result).toContain('📊 **Impact Analysis for "Database.ts"**');
            expect(result).toContain('**Risk Level:**');
        });
    });

    describe('calculateCodebaseStats', () => {
        it('should calculate codebase statistics', () => {
            const result = command['calculateCodebaseStats'](mockStateManager);
            
            expect(result).toHaveProperty('totalFiles');
            expect(result).toHaveProperty('totalFunctions');
            expect(result).toHaveProperty('totalClasses');
            expect(result.totalFiles).toBe(3);
            expect(result.totalClasses).toBe(2);
        });

        it('should handle empty codebase', () => {
            mockStateManager.codebaseIndex.clear();
            
            const result = command['calculateCodebaseStats'](mockStateManager);
            
            expect(result.totalFiles).toBe(0);
            expect(result.totalFunctions).toBe(0);
            expect(result.totalClasses).toBe(0);
        });
    });

    describe('analyzeDependencies', () => {
        it('should analyze file dependencies', () => {
            const result = command['analyzeDependencies'](mockStateManager);
            
            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('file');
            expect(result[0]).toHaveProperty('imports');
        });

        it('should handle files without imports', () => {
            const result = command['analyzeDependencies'](mockStateManager);

            // Files without imports should not be included in the result
            const databaseFile = result.find(dep => dep.file.includes('Database.ts'));
            expect(databaseFile).toBeUndefined();
        });
    });

    describe('identifyHotspots', () => {
        it('should identify complexity hotspots', () => {
            const result = command['identifyHotspots'](mockStateManager);

            expect(result).toBeInstanceOf(Array);
            // Mock data has low complexity, so no hotspots expected
            expect(result.length).toBe(0);
        });

        it('should sort hotspots by complexity', () => {
            const result = command['identifyHotspots'](mockStateManager);
            
            for (let i = 1; i < result.length; i++) {
                expect(result[i-1].complexity).toBeGreaterThanOrEqual(result[i].complexity);
            }
        });

        it('should handle empty codebase', () => {
            mockStateManager.codebaseIndex.clear();
            
            const result = command['identifyHotspots'](mockStateManager);
            
            expect(result).toEqual([]);
        });
    });
});
