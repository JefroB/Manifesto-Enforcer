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
            // PRIORITY: Check TDD mode first - if enabled and this should trigger automatic fixes, route to TDD workflow
            if (stateManager.isTddMode && this.shouldTriggerAutomaticFixes(input, stateManager)) {
                const tddCommand = this.commands.find(cmd => cmd.constructor.name === 'TddCodeGenerationCommand');
                if (tddCommand) {
                    const requestType = this.getRequestType(input, stateManager);
                    console.log(`🧪 TDD Mode: Routing ${requestType} to TddCodeGenerationCommand for input: "${input.substring(0, 50)}..."`);
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
     * Check if the input is a UI issue report or bug report that should trigger automatic fixes
     * @param input - The user's input message
     * @returns True if this is a UI issue/bug report that should trigger TDD workflow
     */
    private isUiIssueReport(input: string): boolean {
        const uiIssuePatterns = [
            // UI positioning and layout issues
            /\b(buttons?|elements?|components?)\s+(should be|are not|aren't)\s+(horizontally|vertically)\s+(aligned|stacked|positioned)/i,
            /\b(dropdown|select|menu)\s+(is|are)\s+(empty|not populated|missing options)/i,
            /\b(tabs?|navigation)\s+(don't work|doesn't work|not working|broken)/i,

            // UI sections and features that should be removed/added
            /\b(admin settings?|settings? section)\s+(should be removed|needs to be removed|is still there)/i,
            /\b(section|panel|area)\s+(should be removed|needs to be removed|is still there)/i,

            // UI positioning and movement
            /\b(should be moved|needs to be moved|supposed to be)\s+(next to|beside|near)/i,
            /\b(positioned|placed)\s+(next to|beside|near|correctly)/i,

            // General UI issues
            /\b(UI|interface|webview|page)\s+.*(doesn't work|don't work|not working|broken|issues?)/i,
            /\b(nothing works|none of the UI|UI elements don't)/i,

            // Bug reports with "should" or "supposed to"
            /\b(should|supposed to)\s+(be|have been)\s+(removed|fixed|working|positioned)/i,
            /\b(was supposed to|were supposed to)\s+(be|have been)\s+(removed|fixed|working|positioned)/i
        ];

        return uiIssuePatterns.some(pattern => pattern.test(input));
    }

    /**
     * Determine if the input should trigger automatic fixes based on content and agent mode
     * @param input - The user's input message
     * @param stateManager - State manager to check agent mode and other settings
     * @returns True if automatic fixes should be triggered
     */
    private shouldTriggerAutomaticFixes(input: string, stateManager: StateManager): boolean {
        // CRITICAL: Chat mode should NEVER write code
        if (!stateManager.isAgentMode) {
            return false;
        }

        // Agent mode: Check if this is any kind of code-related request
        return this.isAnyCodeRequest(input);
    }

    /**
     * Check if input is any kind of code-related request (broader than just generation)
     * @param input - The user's input message
     * @returns True if this is any code-related request
     */
    private isAnyCodeRequest(input: string): boolean {
        // Explicit code generation requests
        if (this.isCodeGenerationRequest(input)) {
            return true;
        }

        // UI issues and bug reports
        if (this.isUiIssueReport(input)) {
            return true;
        }

        // Refactoring and modification requests
        if (this.isRefactoringRequest(input)) {
            return true;
        }

        // Bug fixes and debugging
        if (this.isBugFixRequest(input)) {
            return true;
        }

        // Feature additions
        if (this.isFeatureAdditionRequest(input)) {
            return true;
        }

        // Performance and optimization
        if (this.isOptimizationRequest(input)) {
            return true;
        }

        // Only completely unclear requests should not trigger code generation
        return !this.isCompletelyUnclear(input);
    }

    /**
     * Check if input is a refactoring request
     */
    private isRefactoringRequest(input: string): boolean {
        const refactoringPatterns = [
            /\b(refactor|restructure|reorganize|clean up|simplify|optimize|consolidate)\b/i,
            /\b(extract|rename|move|split|merge)\s+(function|method|class|variable|component)/i,
            /\bmake\s+.*(more\s+)?(efficient|readable|maintainable|clean)/i
        ];
        return refactoringPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Check if input is a bug fix request
     */
    private isBugFixRequest(input: string): boolean {
        const bugFixPatterns = [
            /\b(fix|resolve|debug|solve)\b/i,
            /\b(bug|error|issue|problem|crash|fail|broken)\b/i,
            /\b(memory leak|race condition|null pointer|undefined|exception)\b/i,
            /\b(not working|doesn't work|isn't working)\b/i
        ];
        return bugFixPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Check if input is a feature addition request
     */
    private isFeatureAdditionRequest(input: string): boolean {
        const featurePatterns = [
            /\b(add|include|implement|integrate)\s+(logging|authentication|validation|error handling|monitoring)/i,
            /\b(we need|add|include)\s+(a|an|the)?\s*(new)?\s*(feature|functionality|capability)/i,
            /\b(add|include)\s+.*\s+(to|in|for)\s+(this|the)/i
        ];
        return featurePatterns.some(pattern => pattern.test(input));
    }

    /**
     * Check if input is an optimization request
     */
    private isOptimizationRequest(input: string): boolean {
        const optimizationPatterns = [
            /\b(optimize|improve|speed up|make faster|reduce|minimize)\b/i,
            /\b(performance|speed|memory|cpu|bandwidth|load time)\b/i,
            /\b(too slow|slow|inefficient|heavy|bloated)\b/i
        ];
        return optimizationPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Check if input is completely unclear
     */
    private isCompletelyUnclear(input: string): boolean {
        const unclearPatterns = [
            /^(help|what\?|huh|i don't know|\?\?\?|unclear)$/i,
            /^.{1,3}$/  // Very short inputs like "???" or "what"
        ];
        return unclearPatterns.some(pattern => pattern.test(input.trim()));
    }

    /**
     * Get a human-readable description of the request type
     * @param input - The user's input message
     * @param stateManager - State manager to check current mode
     * @returns Description of the request type
     */
    private getRequestType(input: string, stateManager: StateManager): string {
        if (this.isCodeGenerationRequest(input)) {
            return 'Code Generation';
        }

        if (this.isUiIssueReport(input)) {
            return 'UI Issue Report (Agent Mode)';
        }

        if (this.isRefactoringRequest(input)) {
            return 'Refactoring Request (Agent Mode)';
        }

        if (this.isBugFixRequest(input)) {
            return 'Bug Fix Request (Agent Mode)';
        }

        if (this.isFeatureAdditionRequest(input)) {
            return 'Feature Addition (Agent Mode)';
        }

        if (this.isOptimizationRequest(input)) {
            return 'Optimization Request (Agent Mode)';
        }

        return 'Code Request (Agent Mode)';
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
