import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Interface for all chat commands in the Command Pattern
 * Each command handles a specific type of user input and provides a consistent interface
 */
export interface IChatCommand {
    /**
     * The primary trigger for this command (e.g., "/lint", "/edit", "/graph")
     */
    command: string;

    /**
     * Determines if this command can handle the given user input
     * @param input - The user's input message
     * @returns true if this command can handle the input, false otherwise
     */
    canHandle(input: string): boolean;

    /**
     * Executes the command with the given input and state manager
     * @param input - The user's input message
     * @param stateManager - The state manager instance for accessing codebase data
     * @param agentManager - The agent manager instance for agent operations
     * @returns Promise resolving to the response message
     */
    execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string>;
}
