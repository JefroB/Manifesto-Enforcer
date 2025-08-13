import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Command for handling edit and modification requests
 * Handles patterns like "/edit", "modify", "update", "change", "fix", "add to"
 */
export class EditCommand implements IChatCommand {
    public readonly command = '/edit';

    /**
     * Determines if this command can handle the given input
     */
    canHandle(input: string): boolean {
        const trimmedInput = input.trim();
        
        // Handle slash commands
        if (/^\/edit\b/i.test(trimmedInput)) {
            return true;
        }

        // Handle natural language edit requests
        if (/\b(edit|modify|update|change|fix|add to)\b/i.test(input)) {
            return true;
        }

        return false;
    }

    /**
     * Executes the edit command
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            if (!stateManager.isCodebaseIndexed) {
                return `⚠️ **Codebase not indexed yet!**\n\nI need to analyze your codebase first for smart editing capabilities.\n\nPlease click "📚 Index Codebase" first, then try again.`;
            }

            // **NEW AGENT LOGIC**
            if (stateManager.isAgentMode) {
                try {
                    // Get conversation context for better agent understanding
                    const conversationContext = stateManager.getConversationContext(3);
                    const contextualMessage = conversationContext
                        ? `Context from recent conversation:\n${conversationContext}\n\nCurrent request: ${input}`
                        : input;

                    const agentResponse = await agentManager.sendMessage(contextualMessage);
                    return `✅ **Agent Mode Active:**\n\n${agentResponse.content}`;
                } catch (error) {
                    return `❌ Agent execution failed: ${error instanceof Error ? error.message : 'Unknown agent error'}`;
                }
            }

            // Existing Chat-Mode Logic
            const fileMatch = input.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h|md|json))/i);
            if (fileMatch) {
                return await this.handleFileEdit(fileMatch[1], input, stateManager);
            }

            return this.provideEditGuidance(input, stateManager);

        } catch (error) {
            return `❌ Edit operation failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Handle editing a specific file
     */
    private async handleFileEdit(filename: string, input: string, stateManager: StateManager): Promise<string> {
        const fileData = Array.from(stateManager.codebaseIndex.values())
            .find(f => f.path.endsWith(filename));

        if (!fileData) {
            return `❌ File "${filename}" not found in indexed codebase.\n\n**Available files:** ${this.getAvailableFiles(stateManager).slice(0, 5).join(', ')}...`;
        }

        const editType = this.determineEditType(input);
        const relevantRules = this.getRelevantManifestoRules(input);

        let response = `📝 **Ready to edit ${filename}**\n\n`;
        response += `**Edit Type:** ${editType}\n`;
        response += `**Manifesto Rules:** ${relevantRules}\n\n`;

        // Show file context
        if (fileData.content) {
            const preview = fileData.content.slice(0, 300) + (fileData.content.length > 300 ? '...' : '');
            response += `**Current Content Preview:**\n\`\`\`\n${preview}\n\`\`\`\n\n`;
        }

        // Show symbols if available
        if (fileData.symbols && fileData.symbols.length > 0) {
            response += `**Available Symbols:** ${fileData.symbols.map((s) => `${s.name}(${s.type})`).join(', ')}\n\n`;
        }

        // Provide edit suggestions based on the request
        response += this.generateEditSuggestions(input, fileData, editType);

        return response;
    }

    /**
     * Provide general edit guidance
     */
    private provideEditGuidance(input: string, stateManager: StateManager): Promise<string> {
        const relevantRules = this.getRelevantManifestoRules(input);
        const editType = this.determineEditType(input);

        let response = `📝 **Smart Editing Ready**\n\n`;
        response += `**Request:** ${input}\n`;
        response += `**Edit Type:** ${editType}\n`;
        response += `**Manifesto Rules:** ${relevantRules}\n\n`;

        response += `**Smart editing features:**\n`;
        response += `• 📖 Read existing files and understand context\n`;
        response += `• 🔗 Analyze imports/exports and dependencies\n`;
        response += `• 🛡️ Apply manifesto compliance automatically\n`;
        response += `• 🎯 Maintain existing code patterns and style\n`;
        response += `• ✅ Add proper error handling and validation\n\n`;

        response += `**To edit a specific file:** Mention the filename in your request\n`;
        response += `Example: "Edit UserService.ts to add validation"\n\n`;

        response += `**Available files:** ${this.getAvailableFiles(stateManager).slice(0, 8).join(', ')}`;

        return Promise.resolve(response);
    }

    /**
     * Determine the type of edit being requested
     */
    private determineEditType(input: string): string {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('add') || lowerInput.includes('create')) {
            return 'Add new functionality';
        }
        if (lowerInput.includes('fix') || lowerInput.includes('repair')) {
            return 'Fix existing code';
        }
        if (lowerInput.includes('refactor') || lowerInput.includes('restructure')) {
            return 'Refactor/restructure';
        }
        if (lowerInput.includes('update') || lowerInput.includes('modify')) {
            return 'Update existing functionality';
        }
        if (lowerInput.includes('remove') || lowerInput.includes('delete')) {
            return 'Remove functionality';
        }
        if (lowerInput.includes('optimize') || lowerInput.includes('improve')) {
            return 'Optimize/improve';
        }

        return 'General modification';
    }

    /**
     * Generate specific edit suggestions based on the request
     */
    private generateEditSuggestions(input: string, fileData: import('../core/types').CodebaseFile, editType: string): string {
        let suggestions = `**Edit Suggestions:**\n\n`;

        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('error') || lowerInput.includes('handling')) {
            suggestions += `🛡️ **Error Handling:**\n`;
            suggestions += `• Add try-catch blocks around async operations\n`;
            suggestions += `• Implement proper error logging and user feedback\n`;
            suggestions += `• Add input validation with meaningful error messages\n\n`;
        }

        if (lowerInput.includes('test') || lowerInput.includes('testing')) {
            suggestions += `🧪 **Testing:**\n`;
            suggestions += `• Add unit tests for new functionality\n`;
            suggestions += `• Ensure 80%+ code coverage\n`;
            suggestions += `• Add integration tests for API endpoints\n\n`;
        }

        if (lowerInput.includes('security') || lowerInput.includes('validation')) {
            suggestions += `🔒 **Security:**\n`;
            suggestions += `• Add input sanitization and validation\n`;
            suggestions += `• Implement proper authentication checks\n`;
            suggestions += `• Prevent XSS and injection vulnerabilities\n\n`;
        }

        if (lowerInput.includes('performance') || lowerInput.includes('optimize')) {
            suggestions += `⚡ **Performance:**\n`;
            suggestions += `• Add caching where appropriate\n`;
            suggestions += `• Optimize database queries\n`;
            suggestions += `• Ensure response times < 200ms\n\n`;
        }

        if (lowerInput.includes('documentation') || lowerInput.includes('docs')) {
            suggestions += `📚 **Documentation:**\n`;
            suggestions += `• Add JSDoc comments for all public functions\n`;
            suggestions += `• Document API endpoints and parameters\n`;
            suggestions += `• Update README with new functionality\n\n`;
        }

        // Add general manifesto compliance suggestions
        suggestions += `🛡️ **Manifesto Compliance:**\n`;
        suggestions += `• Follow SOLID principles\n`;
        suggestions += `• Use dependency injection patterns\n`;
        suggestions += `• Maintain clear separation of concerns\n`;
        suggestions += `• Add comprehensive logging\n\n`;

        suggestions += `💡 **Next Steps:** Specify exactly what you'd like to change, and I'll provide detailed implementation guidance.`;

        return suggestions;
    }

    /**
     * Get relevant manifesto rules based on the input
     */
    private getRelevantManifestoRules(input: string): string {
        const rules: string[] = [];
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('error') || lowerInput.includes('exception')) {
            rules.push('comprehensive error handling');
        }
        if (lowerInput.includes('test') || lowerInput.includes('testing')) {
            rules.push('unit tests required');
        }
        if (lowerInput.includes('security') || lowerInput.includes('auth')) {
            rules.push('input validation & security');
        }
        if (lowerInput.includes('performance') || lowerInput.includes('speed')) {
            rules.push('<200ms response times');
        }
        if (lowerInput.includes('documentation') || lowerInput.includes('docs')) {
            rules.push('JSDoc documentation');
        }

        if (rules.length === 0) {
            return 'error handling, input validation, testing, documentation';
        }

        return rules.join(', ');
    }

    /**
     * Get list of available files for editing
     */
    private getAvailableFiles(stateManager: StateManager): string[] {
        return Array.from(stateManager.codebaseIndex.keys())
            .map(path => path.split('/').pop() || path)
            .filter(filename => filename.match(/\.(ts|js|tsx|jsx|py|java|cs|cpp|h)$/i))
            .sort();
    }
}
