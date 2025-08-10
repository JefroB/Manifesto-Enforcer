import { ChatCommandManager } from '../ChatCommandManager';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

/**
 * Test suite for the ChatCommandManager
 * Verifies that the Command Pattern is working correctly
 */
describe('ChatCommandManager', () => {
    let commandManager: ChatCommandManager;
    let mockStateManager: StateManager;
    let mockAgentManager: AgentManager;

    beforeEach(() => {
        commandManager = new ChatCommandManager();

        // Create a mock StateManager
        mockStateManager = {
            isCodebaseIndexed: false,
            isManifestoMode: false,
            codebaseIndex: new Map(),
            projectGlossary: new Map(),
            manifestoRules: [],
            codebaseIndexTimestamp: 0
        } as any;

        // Create a mock AgentManager
        mockAgentManager = {
            sendMessage: jest.fn().mockResolvedValue({ content: 'Mock agent response' }),
            getActiveAgent: jest.fn().mockReturnValue(null),
            getAvailableAgents: jest.fn().mockReturnValue([])
        } as any;
    });

    describe('Command Routing', () => {
        test('should route lint commands to LintCommand', () => {
            const testResult = commandManager.testInput('/lint');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('LintCommand');
        });

        test('should route edit commands to EditCommand', () => {
            const testResult = commandManager.testInput('/edit MyFile.ts');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('EditCommand');
        });

        test('should route graph commands to GraphCommand', () => {
            const testResult = commandManager.testInput('/graph');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('GraphCommand');
        });

        test('should route glossary commands to GlossaryCommand', () => {
            const testResult = commandManager.testInput('/glossary');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('GlossaryCommand');
        });

        test('should route manifesto commands to ManifestoCommand', () => {
            const testResult = commandManager.testInput('/manifesto');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('ManifestoCommand');
        });

        test('should route code generation commands to CodeCommand', () => {
            const testResult = commandManager.testInput('create a hello world function');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('CodeCommand');
        });
    });

    describe('Natural Language Processing', () => {
        test('should handle natural language lint requests', () => {
            const testResult = commandManager.testInput('check my code for errors');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('LintCommand');
        });

        test('should handle natural language edit requests', () => {
            const testResult = commandManager.testInput('modify the user service');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('EditCommand');
        });

        test('should handle natural language glossary requests', () => {
            const testResult = commandManager.testInput('define API as Application Programming Interface');
            expect(testResult.matched).toBe(true);
            expect(testResult.commandName).toBe('GlossaryCommand');
        });
    });

    describe('Command Execution', () => {
        test('should execute commands and return responses', async () => {
            const response = await commandManager.handleMessage('test functionality', mockStateManager, mockAgentManager);
            expect(response).toContain('Piggie works');
        });

        test('should handle unmatched commands gracefully', async () => {
            const response = await commandManager.handleMessage('random unmatched input', mockStateManager, mockAgentManager);
            expect(response).toContain('Piggie here');
            expect(response).toContain('Available Commands');
        });
    });

    describe('Command Management', () => {
        test('should return list of available commands', () => {
            const commands = commandManager.getAvailableCommands();
            expect(commands).toContain('/lint');
            expect(commands).toContain('/edit');
            expect(commands).toContain('/graph');
            expect(commands).toContain('/glossary');
            expect(commands).toContain('/manifesto');
            expect(commands).toContain('/code');
        });

        test('should provide command statistics', () => {
            const stats = commandManager.getCommandStats();
            expect(stats['LintCommand']).toBe('/lint');
            expect(stats['EditCommand']).toBe('/edit');
            expect(stats['GraphCommand']).toBe('/graph');
        });
    });

    describe('Extensibility', () => {
        test('should allow adding new commands dynamically', () => {
            const mockCommand = {
                command: '/test',
                canHandle: (input: string) => input.includes('test'),
                execute: async (input: string, stateManager: StateManager, agentManager: AgentManager) => 'Test response'
            };

            commandManager.addCommand(mockCommand);
            const testResult = commandManager.testInput('test command');
            expect(testResult.matched).toBe(true);
        });

        test('should allow removing commands', () => {
            const initialCount = commandManager.getAvailableCommands().length;
            const removed = commandManager.removeCommand('LintCommand');
            
            expect(removed).toBe(true);
            expect(commandManager.getAvailableCommands().length).toBe(initialCount - 1);
        });
    });
});
