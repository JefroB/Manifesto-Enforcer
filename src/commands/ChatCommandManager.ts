import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';
import { LintCommand } from './LintCommand';
import { EditCommand } from './EditCommand';
import { GraphCommand } from './GraphCommand';
import { GlossaryCommand } from './GlossaryCommand';
import { ManifestoCommand } from './ManifestoCommand';
import { CodeCommand } from './CodeCommand';
import { CleanupCommand } from './CleanupCommand';
import { TestCodeCommand } from './TestCodeCommand';
import { TddCodeGenerationCommand } from './TddCodeGenerationCommand';
import { GeneralHelpCommand } from './GeneralHelpCommand';

/**
 * Central manager for all chat commands using the Command Pattern
 * This class replaces the large if/else if block in generateManifestoCompliantResponse
 */
export class ChatCommandManager {
    private commands: IChatCommand[] = [];

    /**
     * Initialize the command manager with all available commands
     */
    constructor() {
        this.initializeCommands();
    }

    /**
     * Initialize all command instances
     * TddCodeGenerationCommand is added for TDD workflow orchestration
     * TestCodeCommand is added before GeneralHelpCommand to handle context-aware execution
     * GeneralHelpCommand is added last as it always handles input (fallback)
     */
    private initializeCommands(): void {
        this.commands = [
            new LintCommand(),
            new EditCommand(),
            new GraphCommand(),
            new GlossaryCommand(),
            new ManifestoCommand(),
            new CodeCommand(),
            new CleanupCommand(),
            new TestCodeCommand(), // Context-aware code execution
            new TddCodeGenerationCommand(), // TDD workflow orchestration
            new GeneralHelpCommand() // Always last - serves as fallback
        ];
    }

    /**
     * Handle a user message by finding the appropriate command and executing it
     * @param input - The user's input message
     * @param stateManager - The state manager instance
     * @param agentManager - The agent manager instance
     * @returns Promise resolving to the response message
     */
    async handleMessage(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // PRIORITY: Check TDD mode first - if enabled and this is a code generation request, route to TDD workflow
            if (stateManager.isTddMode && this.isCodeGenerationRequest(input)) {
                const tddCommand = this.commands.find(cmd => cmd.constructor.name === 'TddCodeGenerationCommand');
                if (tddCommand) {
                    console.log(`🧪 TDD Mode: Routing to TddCodeGenerationCommand for input: "${input.substring(0, 50)}..."`);
                    return await tddCommand.execute(input, stateManager, agentManager);
                }
            }

            // Find the first command that can handle this input
            // Since GeneralHelpCommand is last and always returns true, a command will always be found
            const command = this.findMatchingCommand(input);

            console.log(`🎯 Command matched: ${command!.constructor.name} for input: "${input.substring(0, 50)}..."`);
            return await command!.execute(input, stateManager, agentManager);

        } catch (error) {
            console.error('ChatCommandManager error:', error);
            return `❌ Command execution failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Check if the input is a code generation request that should use TDD workflow
     * @param input - The user's input message
     * @returns True if this is a code generation request
     */
    private isCodeGenerationRequest(input: string): boolean {
        const codeGenerationPatterns = [
            /\b(create|write|build|implement|generate|make|develop)\s+(a|an|the)?\s*(new\s+)?(function|class|component|method|api|service|module|script)\b/i,
            /\b(create|write|build|implement|generate|make|develop)\s+.*\s+(function|class|component|method|api|service|module|script|code)\b/i,
            /\b(add|create)\s+(a|an|the)?\s*(new)?\s*(function|class|component|method|api|service|module)/i
        ];

        return codeGenerationPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Find the first command that can handle the given input
     * @param input - The user's input message
     * @returns The matching command or null if none found
     */
    private findMatchingCommand(input: string): IChatCommand | null {
        for (const command of this.commands) {
            if (command.canHandle(input)) {
                return command;
            }
        }
        return null;
    }



    /**
     * Get a list of all available commands for debugging/info purposes
     */
    getAvailableCommands(): string[] {
        return this.commands.map(cmd => cmd.command);
    }

    /**
     * Get command statistics for monitoring
     */
    getCommandStats(): { [key: string]: string } {
        const stats: { [key: string]: string } = {};
        
        this.commands.forEach(cmd => {
            stats[cmd.constructor.name] = cmd.command;
        });

        return stats;
    }

    /**
     * Add a new command dynamically (for extensibility)
     */
    addCommand(command: IChatCommand): void {
        this.commands.push(command);
        console.log(`➕ Added new command: ${command.constructor.name} (${command.command})`);
    }

    /**
     * Remove a command by its class name
     */
    removeCommand(commandClassName: string): boolean {
        const initialLength = this.commands.length;
        this.commands = this.commands.filter(cmd => cmd.constructor.name !== commandClassName);
        
        const removed = this.commands.length < initialLength;
        if (removed) {
            console.log(`➖ Removed command: ${commandClassName}`);
        }
        
        return removed;
    }

    /**
     * Test if a specific input would match any command (for debugging)
     */
    testInput(input: string): { matched: boolean; commandName?: string; command?: string } {
        const command = this.findMatchingCommand(input);
        
        if (command) {
            return {
                matched: true,
                commandName: command.constructor.name,
                command: command.command
            };
        }
        
        return { matched: false };
    }
}
