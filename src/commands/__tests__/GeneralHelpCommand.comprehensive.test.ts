/**
 * Comprehensive Tests for GeneralHelpCommand
 * Goal: Achieve 100% coverage of all methods and branches
 */

import { GeneralHelpCommand } from '../GeneralHelpCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

// Mock StateManager
const createMockStateManager = (overrides: Partial<StateManager> = {}): StateManager => {
    return {
        isCodebaseIndexed: false,
        isManifestoMode: true,
        codebaseIndex: new Map(),
        ...overrides
    } as StateManager;
};

// Mock AgentManager
const createMockAgentManager = (): AgentManager => {
    return {} as AgentManager;
};

describe('GeneralHelpCommand Comprehensive Tests', () => {
    let command: GeneralHelpCommand;
    let mockStateManager: StateManager;
    let mockAgentManager: AgentManager;

    beforeEach(() => {
        command = new GeneralHelpCommand();
        mockStateManager = createMockStateManager();
        mockAgentManager = createMockAgentManager();
    });

    describe('Basic Properties', () => {
        it('should have correct command name', () => {
            expect(command.command).toBe('/help');
        });

        it('should always handle input (fallback command)', () => {
            expect(command.canHandle('anything')).toBe(true);
            expect(command.canHandle('')).toBe(true);
            expect(command.canHandle('/unknown')).toBe(true);
        });
    });

    describe('Test Request Handling', () => {
        it('should handle test requests with "test" keyword', async () => {
            const result = await command.execute('test the functionality', mockStateManager, mockAgentManager);
            
            expect(result).toContain('✅ Yes, Piggie works!');
            expect(result).toContain('manifesto-compliant development');
        });

        it('should handle test requests with "work" keyword', async () => {
            const result = await command.execute('does this work?', mockStateManager, mockAgentManager);
            
            expect(result).toContain('✅ Yes, Piggie works!');
        });

        it('should handle test requests with "functionality" keyword', async () => {
            const result = await command.execute('check functionality', mockStateManager, mockAgentManager);
            
            expect(result).toContain('✅ Yes, Piggie works!');
        });

        it('should handle test requests with "check" keyword', async () => {
            const result = await command.execute('check if working', mockStateManager, mockAgentManager);
            
            expect(result).toContain('✅ Yes, Piggie works!');
        });
    });

    describe('File Request Handling', () => {
        it('should handle file requests when codebase not indexed', async () => {
            mockStateManager.isCodebaseIndexed = false;
            
            const result = await command.execute('read extension.ts', mockStateManager, mockAgentManager);
            
            expect(result).toContain('⚠️ Codebase not indexed');
            expect(result).toContain('Index Codebase');
        });

        it('should handle file requests when file exists in index', async () => {
            mockStateManager.isCodebaseIndexed = true;
            mockStateManager.codebaseIndex = new Map([
                ['src/extension.ts', {
                    path: 'src/extension.ts',
                    content: 'export function activate() { console.log("Hello"); }',
                    size: 50,
                    symbols: [{ name: 'activate', type: 'function' }],
                    imports: ['vscode'],
                    lastModified: new Date()
                }]
            ]);
            
            const result = await command.execute('show me extension.ts', mockStateManager, mockAgentManager);
            
            expect(result).toContain('📄 **extension.ts**');
            expect(result).toContain('50 bytes');
            expect(result).toContain('export function activate()');
            expect(result).toContain('**Symbols found:** activate (function)');
            expect(result).toContain('**Imports:** vscode');
        });

        it('should handle file requests with long content (truncation)', async () => {
            mockStateManager.isCodebaseIndexed = true;
            const longContent = 'a'.repeat(600); // More than 500 chars
            mockStateManager.codebaseIndex = new Map([
                ['src/sample.ts', {
                    path: 'src/sample.ts',
                    content: longContent,
                    size: 600,
                    symbols: [],
                    imports: [],
                    lastModified: new Date()
                }]
            ]);

            const result = await command.execute('view sample.ts', mockStateManager, mockAgentManager);

            expect(result).toContain('📄 **sample.ts**');
            expect(result).toContain('...');
            expect(result.indexOf('```')).toBeGreaterThan(-1);
        });

        it('should handle file requests when file not found', async () => {
            mockStateManager.isCodebaseIndexed = true;
            mockStateManager.codebaseIndex = new Map([
                ['src/other.ts', { path: 'src/other.ts', content: '', size: 0, lastModified: new Date() }]
            ]);
            
            const result = await command.execute('open missing.ts', mockStateManager, mockAgentManager);
            
            expect(result).toContain('❌ File "missing.ts" not found');
            expect(result).toContain('Available files: other.ts');
        });

        it('should handle file requests without filename', async () => {
            mockStateManager.isCodebaseIndexed = true;

            const result = await command.execute('show me the .ts file', mockStateManager, mockAgentManager);

            expect(result).toContain('Please specify a filename to read');
            expect(result).toContain('extension.ts');
        });

        it('should handle different file extensions', async () => {
            mockStateManager.isCodebaseIndexed = true;
            mockStateManager.codebaseIndex = new Map([
                ['src/sample.py', { path: 'src/sample.py', content: 'print("hello")', size: 15, lastModified: new Date() }]
            ]);

            const result = await command.execute('show sample.py', mockStateManager, mockAgentManager);

            expect(result).toContain('📄 **sample.py**');
            expect(result).toContain('print("hello")');
        });

        it('should handle files without symbols or imports', async () => {
            mockStateManager.isCodebaseIndexed = true;
            mockStateManager.codebaseIndex = new Map([
                ['src/simple.md', {
                    path: 'src/simple.md',
                    content: '# Title',
                    size: 7,
                    symbols: undefined,
                    imports: undefined,
                    lastModified: new Date()
                }]
            ]);

            const result = await command.execute('read simple.md', mockStateManager, mockAgentManager);

            expect(result).toContain('📄 **simple.md**');
            expect(result).toContain('# Title');
            expect(result).not.toContain('**Symbols found:**');
            expect(result).not.toContain('**Imports:**');
        });

        it('should handle files without size property', async () => {
            mockStateManager.isCodebaseIndexed = true;
            mockStateManager.codebaseIndex = new Map([
                ['src/nosize.ts', {
                    path: 'src/nosize.ts',
                    content: 'const x = 1;',
                    size: undefined,
                    lastModified: new Date()
                }]
            ]);

            const result = await command.execute('view nosize.ts', mockStateManager, mockAgentManager);

            expect(result).toContain('📄 **nosize.ts** (0 bytes)');
            expect(result).toContain('const x = 1;');
        });
    });

    describe('MR/PR Request Handling', () => {
        it('should handle GitHub PR requests', async () => {
            const result = await command.execute('analyze https://github.com/owner/repo/pull/123', mockStateManager, mockAgentManager);
            
            expect(result).toContain('🔍 **MR/PR Analysis Ready**');
            expect(result).toContain('https://github.com/owner/repo/pull/123');
            expect(result).toContain('Risk assessment');
            expect(result).toContain('Automated test suggestions');
            expect(result).toContain('Manifesto compliance check');
            expect(result).toContain('Security vulnerability scan');
        });

        it('should handle GitLab MR requests', async () => {
            const result = await command.execute('mr analysis https://gitlab.com/group/project/-/merge_requests/456', mockStateManager, mockAgentManager);
            
            expect(result).toContain('🔍 **MR/PR Analysis Ready**');
            expect(result).toContain('https://gitlab.com/group/project/-/merge_requests/456');
        });

        it('should handle custom GitLab instance URLs', async () => {
            const result = await command.execute('pull request https://gitlab.company.com/team/app/merge_requests/789', mockStateManager, mockAgentManager);
            
            expect(result).toContain('🔍 **MR/PR Analysis Ready**');
            expect(result).toContain('https://gitlab.company.com/team/app/merge_requests/789');
        });

        it('should handle MR requests without URL', async () => {
            const result = await command.execute('mr review from github.com', mockStateManager, mockAgentManager);

            expect(result).toContain('Please provide a GitHub or GitLab MR/PR URL');
            expect(result).toContain('https://github.com/owner/repo/pull/123');
        });
    });

    describe('General Help Responses', () => {
        it('should provide general help when codebase is indexed', async () => {
            mockStateManager.isCodebaseIndexed = true;
            mockStateManager.codebaseIndex = new Map([
                ['file1.ts', { path: 'file1.ts', content: '', size: 0, lastModified: new Date() }],
                ['file2.ts', { path: 'file2.ts', content: '', size: 0, lastModified: new Date() }]
            ]);
            mockStateManager.isManifestoMode = true;
            
            const result = await command.execute('hello', mockStateManager, mockAgentManager);
            
            expect(result).toContain('🐷 Piggie here!');
            expect(result).toContain('"hello"');
            expect(result).toContain('📚 I have indexed 2 files');
            expect(result).toContain('🛡️ Manifesto Mode is active');
            expect(result).toContain('**Available Commands:**');
            expect(result).toContain('Code Generation');
            expect(result).toContain('Editing');
            expect(result).toContain('Linting');
        });

        it('should provide general help when codebase is not indexed', async () => {
            mockStateManager.isCodebaseIndexed = false;
            mockStateManager.isManifestoMode = false;
            
            const result = await command.execute('help me', mockStateManager, mockAgentManager);
            
            expect(result).toContain('🐷 Piggie here!');
            expect(result).toContain('"help me"');
            expect(result).toContain('💡 Tip: Use the "Index Codebase" button');
            expect(result).not.toContain('🛡️ Manifesto Mode is active');
            expect(result).toContain('**Available Commands:**');
        });

        it('should include all command categories in help', async () => {
            const result = await command.execute('what can you do?', mockStateManager, mockAgentManager);
            
            expect(result).toContain('Code Generation');
            expect(result).toContain('Editing');
            expect(result).toContain('Linting');
            expect(result).toContain('Code Analysis');
            expect(result).toContain('Glossary');
            expect(result).toContain('Cleanup');
            expect(result).toContain('Manifesto');
            expect(result).toContain('How can I help with your development needs?');
        });
    });

    describe('Error Handling', () => {
        it('should handle errors gracefully', async () => {
            // Create a mock that throws an error
            const errorStateManager = {
                get isCodebaseIndexed() { throw new Error('Sample error'); },
                isManifestoMode: true,
                codebaseIndex: new Map()
            } as unknown as StateManager;

            const result = await command.execute('help me', errorStateManager, mockAgentManager);

            expect(result).toContain('❌ General help failed:');
            expect(result).toContain('Sample error');
        });

        it('should handle non-Error exceptions', async () => {
            // Create a mock that throws a non-Error
            const errorStateManager = {
                get isCodebaseIndexed() { throw 'String error'; },
                isManifestoMode: true,
                codebaseIndex: new Map()
            } as unknown as StateManager;

            const result = await command.execute('help me', errorStateManager, mockAgentManager);

            expect(result).toContain('❌ General help failed:');
            expect(result).toContain('String error');
        });
    });
});
