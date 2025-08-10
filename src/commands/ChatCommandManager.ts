import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { LintCommand } from './LintCommand';
import { EditCommand } from './EditCommand';
import { GraphCommand } from './GraphCommand';
import { GlossaryCommand } from './GlossaryCommand';
import { ManifestoCommand } from './ManifestoCommand';
import { CodeCommand } from './CodeCommand';
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
            new GeneralHelpCommand() // Always last - serves as fallback
        ];
    }

    /**
     * Handle a user message by finding the appropriate command and executing it
     * @param input - The user's input message
     * @param stateManager - The state manager instance
     * @returns Promise resolving to the response message
     */
    async handleMessage(input: string, stateManager: StateManager): Promise<string> {
        try {
            // Find the first command that can handle this input
            // Since GeneralHelpCommand is last and always returns true, a command will always be found
            const command = this.findMatchingCommand(input);

            console.log(`🎯 Command matched: ${command!.constructor.name} for input: "${input.substring(0, 50)}..."`);
            return await command!.execute(input, stateManager);

        } catch (error) {
            console.error('ChatCommandManager error:', error);
            return `❌ Command execution failed: ${error instanceof Error ? error.message : String(error)}`;
        }
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
