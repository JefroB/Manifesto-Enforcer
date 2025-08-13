import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';
import { TerminalManager } from '../core/TerminalManager';
import { ChatResponseBuilder } from '../core/ChatResponseBuilder';
import { ActionSafety } from '../core/types';

/**
 * TestCodeCommand - Executes code from previous conversation context
 * Handles context-aware follow-ups like "test it", "run it", "try it"
 * MANDATORY: Comprehensive error handling and input validation (manifesto requirement)
 */
export class TestCodeCommand implements IChatCommand {

    /**
     * Command identifier for this command
     */
    public readonly command: string = '/test';
    
    /**
     * Check if this command can handle the input
     * Looks for context-aware execution requests
     */
    canHandle(input: string): boolean {
        try {
            const normalizedInput = input.toLowerCase().trim();
            
            // Context-aware execution patterns
            const executionPatterns = [
                /^(test|run|try|execute)\s+it$/,
                /^(test|run|try|execute)\s+(this|that)$/,
                /^(test|run|try|execute)\s+the\s+(code|script|file)$/,
                /^can\s+you\s+(test|run|try|execute)\s+it\??$/,
                /^please\s+(test|run|try|execute)\s+it$/
            ];

            return executionPatterns.some(pattern => pattern.test(normalizedInput));
        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('TestCodeCommand.canHandle failed:', error);
            return false;
        }
    }

    /**
     * Execute the test command with auto-mode logic and safety checks
     * MANDATORY: Comprehensive error handling and input validation (manifesto requirement)
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // CRITICAL: Input validation
            if (!input || typeof input !== 'string') {
                throw new Error('Invalid input provided to TestCodeCommand');
            }

            if (!stateManager) {
                throw new Error('StateManager is required for TestCodeCommand');
            }

            // Get conversation context to find the last code block
            const conversationContext = stateManager.getConversationContext(5);

            if (!conversationContext) {
                return this.getFallbackResponse();
            }

            // Extract code block from conversation history
            const codeInfo = this.extractCodeFromContext(conversationContext);

            if (!codeInfo) {
                return this.getFallbackResponse();
            }

            // Check auto-mode setting
            const isAutoMode = stateManager.isAutoMode;

            if (isAutoMode) {
                // Auto-mode: Check safety and execute if safe
                return await this.handleAutoModeExecution(codeInfo);
            } else {
                // Manual mode: Return response with execution button
                return this.createManualExecutionResponse(codeInfo);
            }

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            const errorMessage = error instanceof Error ? error.message : 'Unknown TestCodeCommand error';
            console.error('TestCodeCommand execution failed:', error);
            return `❌ **Code Execution Failed**: ${errorMessage}\n\n💡 **Tip**: Make sure there's a code block in our recent conversation that I can execute.`;
        }
    }

    /**
     * Handle auto-mode execution with safety checks
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private async handleAutoModeExecution(codeInfo: { code: string; language: string; filename: string }): Promise<string> {
        try {
            // Perform safety check
            const isSafe = TerminalManager.isCodeSafeForAutoExecution(codeInfo.code, codeInfo.language);

            if (isSafe) {
                // Code is safe - execute automatically
                const result = await TerminalManager.executeScriptInTerminal(codeInfo.code, codeInfo.language);
                return `🤖 **Auto-Mode Execution**\n\n${result}`;
            } else {
                // Code is not safe - fall back to manual mode with explanation
                return this.createManualExecutionResponse(codeInfo,
                    '🚨 **Safety Check Failed**: This script requires manual confirmation to run due to potentially sensitive operations.');
            }

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            const errorMessage = error instanceof Error ? error.message : 'Unknown auto-mode error';
            console.error('Auto-mode execution failed:', error);
            return `❌ **Auto-Mode Execution Failed**: ${errorMessage}\n\nFalling back to manual execution mode.`;
        }
    }

    /**
     * Create response with manual execution button
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private createManualExecutionResponse(codeInfo: { code: string; language: string; filename: string }, safetyMessage?: string): string {
        try {
            let content = '';

            // Add safety message if provided
            if (safetyMessage) {
                content += `⚠️ **Safety Notice**\n\n${safetyMessage}\n\n`;
            }

            // Add code preview
            content += `📋 **Code to Execute**\n\n\`\`\`${codeInfo.language}\n${codeInfo.code}\n\`\`\`\n\n`;
            content += `🚀 Click the button below to execute this code in a terminal.`;

            const responseBuilder = new ChatResponseBuilder();
            responseBuilder.setContent(content);

            // Add execution button
            responseBuilder.addAction({
                id: 'execute-code',
                label: '🚀 Execute Code',
                icon: '🚀',
                command: 'manifestoEnforcer.executeCodeAction',
                data: {
                    code: codeInfo.code,
                    language: codeInfo.language,
                    fileName: codeInfo.filename
                },
                safety: ActionSafety.CAUTIOUS
            });

            const response = responseBuilder.build();
            return JSON.stringify(response);

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            const errorMessage = error instanceof Error ? error.message : 'Unknown response building error';
            console.error('Manual execution response creation failed:', error);
            return `❌ **Response Creation Failed**: ${errorMessage}`;
        }
    }

    /**
     * Extract code block information from conversation context
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private extractCodeFromContext(context: string): { code: string; language: string; filename: string } | null {
        try {
            // Look for code blocks in markdown format
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
            let match;
            let lastCodeBlock = null;

            // Find the most recent code block
            while ((match = codeBlockRegex.exec(context)) !== null) {
                const language = match[1] || 'text';
                const code = match[2].trim();
                
                if (code && this.isExecutableLanguage(language)) {
                    lastCodeBlock = {
                        code,
                        language: language.toLowerCase(),
                        filename: `piggie_temp_exec.${this.getFileExtension(language.toLowerCase())}`
                    };
                }
            }

            return lastCodeBlock;
        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Code extraction failed:', error);
            return null;
        }
    }

    /**
     * Check if a language is executable
     */
    private isExecutableLanguage(language: string): boolean {
        const executableLanguages = [
            'javascript', 'js', 'typescript', 'ts',
            'python', 'py', 'node', 'bash', 'sh',
            'java', 'c', 'cpp', 'go', 'rust', 'php'
        ];
        return executableLanguages.includes(language.toLowerCase());
    }

    /**
     * Get file extension for a language
     */
    private getFileExtension(language: string): string {
        const extensions: Record<string, string> = {
            'javascript': 'js',
            'js': 'js',
            'typescript': 'ts',
            'ts': 'ts',
            'python': 'py',
            'py': 'py',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'go': 'go',
            'rust': 'rs',
            'php': 'php',
            'bash': 'sh',
            'sh': 'sh'
        };

        return extensions[language] || 'txt';
    }





    /**
     * Fallback response when no executable code is found
     */
    private getFallbackResponse(): string {
        return `🤔 **No Executable Code Found**\n\n` +
               `I couldn't find any executable code in our recent conversation to test.\n\n` +
               `**To use this feature:**\n` +
               `1. Ask me to create some code (e.g., "write a hello world script")\n` +
               `2. Then say "test it" or "run it"\n\n` +
               `**Supported Languages**: JavaScript, TypeScript, Python, Java, Go, PHP, Bash`;
    }
}
