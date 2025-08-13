import { ChatCommandManager } from '../ChatCommandManager';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';
import * as vscode from 'vscode';

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
            isTddMode: false, // Explicitly set TDD mode to false
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
            // Disable TDD mode for this test to get the expected response
            mockStateManager.isTddMode = false;
            const response = await commandManager.handleMessage('test functionality', mockStateManager, mockAgentManager);
            expect(response).toContain('Piggie works');
        });

        test('should handle unmatched commands gracefully', async () => {
            // Disable TDD mode for this test to get the expected response
            mockStateManager.isTddMode = false;
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

    describe('Command Priority and Real-World Routing', () => {
        test('should prioritize ManifestoCommand over CodeCommand for manifesto requests', async () => {
            // This input could match both ManifestoCommand and CodeCommand
            // ManifestoCommand should win because it's registered first
            const input = 'create me a manifesto for my project';

            const result = await commandManager.handleMessage(input, mockStateManager, mockAgentManager);

            // Should contain manifesto-specific content, not code generation content
            expect(result).toContain('Manifesto Template');
            expect(result).toContain('📋 Create manifesto.md');
            expect(result).not.toContain('Ready to create manifesto-compliant code');
        });

        test('should route typo-filled manifesto requests to ManifestoCommand', async () => {
            // The exact failing input from manual testing
            const input = 'create me a manifsto for a node,js project';

            const result = await commandManager.handleMessage(input, mockStateManager, mockAgentManager);

            // Should be handled by ManifestoCommand, not CodeCommand
            expect(result).toContain('Manifesto Template');
            expect(result).toContain('Node.js');
            expect(result).not.toContain('manifesto-compliant code');
        });

        test('should route pure code requests to CodeCommand', async () => {
            const input = 'create a function that validates user input';

            const result = await commandManager.handleMessage(input, mockStateManager, mockAgentManager);

            // Should be handled by CodeCommand and generate manifesto-compliant code
            expect(result).toContain('Function Generated');
            expect(result).toContain('Manifesto Features');
            expect(result).not.toContain('Manifesto Template');
        });
    });

    describe('Conversational Context Awareness', () => {
        let mockTerminal: any;
        let mockStateManagerWithHistory: any;

        beforeEach(() => {
            // Mock VSCode terminal
            mockTerminal = {
                sendText: jest.fn(),
                show: jest.fn(),
                dispose: jest.fn()
            };

            // Mock vscode.window.createTerminal
            (vscode.window.createTerminal as jest.Mock) = jest.fn().mockReturnValue(mockTerminal);

            // Create a more complete mock StateManager with conversation history
            mockStateManagerWithHistory = {
                ...mockStateManager,
                addToConversationHistory: jest.fn(),
                getConversationContext: jest.fn(),
                _conversationHistory: [],
                isAutoMode: false // Default to manual mode for most tests
            } as any;
        });

        test('should understand "test it" refers to previously generated code', async () => {
            try {
                // Enable auto mode for this test
                mockStateManagerWithHistory.isAutoMode = true;

                // Step 1: Simulate first message - user asks for a script
                const firstResponse = await commandManager.handleMessage(
                    'write me a hello world script in javascript',
                    mockStateManagerWithHistory,
                    mockAgentManager
                );

                // Verify first response contains code
                expect(firstResponse).toContain('Hello World');

                // Step 2: Mock conversation history with the assistant's response containing code
                const mockConversationContext = `user: write me a hello world script in javascript

assistant: 🎉 Hello World Script Ready!

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

✅ Script created successfully!`;

                mockStateManagerWithHistory.getConversationContext.mockReturnValue(mockConversationContext);

                // Step 3: Simulate second message - user says "test it"
                const secondResponse = await commandManager.handleMessage(
                    'test it',
                    mockStateManagerWithHistory,
                    mockAgentManager
                );

                // Step 4: Assert the correct behavior (auto-execution)
                expect(vscode.window.createTerminal).toHaveBeenCalled();
                expect(mockTerminal.sendText).toHaveBeenCalledWith(expect.stringContaining('node'));
                expect(secondResponse).toContain('Auto-Mode Execution');
                expect(secondResponse).toContain('Code Executed Successfully');
                expect(secondResponse).not.toContain('Piggie works'); // Should NOT be generic response

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('Conversational context test failed:', error);
                throw error;
            }
        });

        test('should handle "run it" as context-aware follow-up', async () => {
            try {
                // Enable auto mode for this test
                mockStateManagerWithHistory.isAutoMode = true;

                // Mock conversation history with Python code
                const mockConversationContext = `assistant: 🐍 Python Script Ready!

\`\`\`python
print("Hello, World!")
\`\`\`

✅ Script created!`;

                mockStateManagerWithHistory.getConversationContext.mockReturnValue(mockConversationContext);

                const response = await commandManager.handleMessage(
                    'run it',
                    mockStateManagerWithHistory,
                    mockAgentManager
                );

                expect(vscode.window.createTerminal).toHaveBeenCalled();
                expect(mockTerminal.sendText).toHaveBeenCalledWith(expect.stringContaining('python'));
                expect(response).toContain('Auto-Mode Execution');
                expect(response).toContain('Code Executed Successfully');

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('Run it context test failed:', error);
                throw error;
            }
        });

        test('should fall back to general help when no code context exists', async () => {
            try {
                // Mock empty conversation history
                mockStateManagerWithHistory.getConversationContext.mockReturnValue('');

                const response = await commandManager.handleMessage(
                    'test it',
                    mockStateManagerWithHistory,
                    mockAgentManager
                );

                // Should return TestCodeCommand's fallback message since no code context
                expect(response).toContain('No Executable Code Found');
                expect(response).toContain('Supported Languages');
                expect(vscode.window.createTerminal).not.toHaveBeenCalled();

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('Fallback test failed:', error);
                throw error;
            }
        });

        test('should extract correct file extension from code language', async () => {
            try {
                // Enable auto mode for this test
                mockStateManagerWithHistory.isAutoMode = true;

                // Test different languages
                const testCases = [
                    { language: 'javascript', expectedCommand: 'node', extension: '.js' },
                    { language: 'python', expectedCommand: 'python', extension: '.py' },
                    { language: 'typescript', expectedCommand: 'npx ts-node', extension: '.ts' }
                ];

                for (const testCase of testCases) {
                    const mockConversationContext = `assistant: Code ready!

\`\`\`${testCase.language}
console.log("test");
\`\`\`

Done!`;

                    mockStateManagerWithHistory.getConversationContext.mockReturnValue(mockConversationContext);

                    await commandManager.handleMessage('test it', mockStateManagerWithHistory, mockAgentManager);

                    expect(mockTerminal.sendText).toHaveBeenCalledWith(
                        expect.stringContaining(testCase.expectedCommand)
                    );
                }

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('Language extraction test failed:', error);
                throw error;
            }
        });

        describe('Auto-Mode Functionality', () => {
            test('should auto-execute safe code when isAutoMode is true', async () => {
                try {
                    // Enable auto mode
                    mockStateManagerWithHistory.isAutoMode = true;

                    // Mock safe code context
                    const safeCodeContext = `assistant: Simple script ready!

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

Done!`;

                    mockStateManagerWithHistory.getConversationContext.mockReturnValue(safeCodeContext);

                    const response = await commandManager.handleMessage('test it', mockStateManagerWithHistory, mockAgentManager);

                    // Should auto-execute and show auto-mode message
                    expect(response).toContain('Auto-Mode Execution');
                    expect(response).toContain('Code Executed Successfully');
                    expect(vscode.window.createTerminal).toHaveBeenCalled();

                } catch (error) {
                    // MANDATORY: Comprehensive error handling (manifesto requirement)
                    console.error('Auto-mode safe execution test failed:', error);
                    throw error;
                }
            });

            test('should fall back to manual mode for unsafe code even when isAutoMode is true', async () => {
                try {
                    // Enable auto mode
                    mockStateManagerWithHistory.isAutoMode = true;

                    // Mock unsafe code context (contains fs operations)
                    const unsafeCodeContext = `assistant: File system script ready!

\`\`\`javascript
const fs = require('fs');
fs.unlinkSync('/important/file.txt');
\`\`\`

Done!`;

                    mockStateManagerWithHistory.getConversationContext.mockReturnValue(unsafeCodeContext);

                    const response = await commandManager.handleMessage('test it', mockStateManagerWithHistory, mockAgentManager);

                    // Should fall back to manual mode with safety warning
                    expect(response).toContain('Safety Check Failed');
                    expect(response).toContain('Execute Code');
                    expect(vscode.window.createTerminal).not.toHaveBeenCalled();

                } catch (error) {
                    // MANDATORY: Comprehensive error handling (manifesto requirement)
                    console.error('Auto-mode unsafe fallback test failed:', error);
                    throw error;
                }
            });

            test('should show execution button when isAutoMode is false', async () => {
                try {
                    // Disable auto mode (default)
                    mockStateManagerWithHistory.isAutoMode = false;

                    // Mock safe code context
                    const codeContext = `assistant: Script ready!

\`\`\`javascript
console.log("Manual execution test");
\`\`\`

Done!`;

                    mockStateManagerWithHistory.getConversationContext.mockReturnValue(codeContext);

                    const response = await commandManager.handleMessage('test it', mockStateManagerWithHistory, mockAgentManager);

                    // Should show manual execution button
                    expect(response).toContain('Execute Code');
                    expect(response).toContain('manifestoEnforcer.executeCodeAction');
                    expect(vscode.window.createTerminal).not.toHaveBeenCalled();

                } catch (error) {
                    // MANDATORY: Comprehensive error handling (manifesto requirement)
                    console.error('Manual mode button test failed:', error);
                    throw error;
                }
            });
        });

        describe('TDD Mode Routing', () => {
            test('should route code generation to TddCodeGenerationCommand when TDD mode is enabled', async () => {
                try {
                    // Enable TDD mode
                    mockStateManagerWithHistory.isTddMode = true;

                    const response = await commandManager.handleMessage(
                        'create a new function',
                        mockStateManagerWithHistory,
                        mockAgentManager
                    );

                    // Assert TDD workflow was initiated (the actual TddCodeGenerationCommand was called)
                    expect(response).toContain('TDD');

                } catch (error) {
                    // MANDATORY: Comprehensive error handling (manifesto requirement)
                    console.error('TDD mode routing test failed:', error);
                    throw error;
                }
            });

            test('should route to CodeCommand when TDD mode is disabled', async () => {
                try {
                    // Disable TDD mode
                    mockStateManagerWithHistory.isTddMode = false;

                    const response = await commandManager.handleMessage(
                        'create a new function',
                        mockStateManagerWithHistory,
                        mockAgentManager
                    );

                    // Should route to CodeCommand (not TDD)
                    expect(response).not.toContain('TDD workflow');
                    expect(response).toContain('function'); // CodeCommand response

                } catch (error) {
                    console.error('Non-TDD mode routing test failed:', error);
                    throw error;
                }
            });

            test('should prioritize TDD routing over regular code commands when enabled', async () => {
                try {
                    // Enable TDD mode
                    mockStateManagerWithHistory.isTddMode = true;

                    // Test various code generation prompts
                    const codePrompts = [
                        'write a function',
                        'create a class',
                        'build a component',
                        'implement an API'
                    ];

                    for (const prompt of codePrompts) {
                        const response = await commandManager.handleMessage(
                            prompt,
                            mockStateManagerWithHistory,
                            mockAgentManager
                        );

                        // All should be routed to TDD workflow
                        expect(response).toContain('TDD');
                    }

                } catch (error) {
                    console.error('TDD priority routing test failed:', error);
                    throw error;
                }
            });
        });
    });
});
