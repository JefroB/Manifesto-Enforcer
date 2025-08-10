import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Command for handling glossary-related requests
 * Handles patterns like "/glossary", "/define", "/lookup", and natural language glossary requests
 */
export class GlossaryCommand implements IChatCommand {
    public readonly command = '/glossary';

    /**
     * Determines if this command can handle the given input
     */
    canHandle(input: string): boolean {
        const trimmedInput = input.trim();
        
        // Handle slash commands
        if (/^\/(?:glossary|define|lookup)\b/i.test(trimmedInput)) {
            return true;
        }

        // Handle natural language glossary requests
        if (/\b(glossary|define|add term|add definition|what does.*mean|acronym)\b/i.test(input)) {
            return true;
        }

        // Handle definition patterns
        if (/define\s+\w+\s+as\s+/i.test(input) || /add term\s+\w+\s+meaning\s+/i.test(input)) {
            return true;
        }

        return false;
    }

    /**
     * Executes the glossary command
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            const trimmedInput = input.trim();
            let response: string;

            // Handle specific slash commands
            if (/^\/define\b/i.test(trimmedInput)) {
                response = await this.handleDefineCommand(input, stateManager);
            }
            else if (/^\/lookup\b/i.test(trimmedInput)) {
                response = await this.handleLookupCommand(input, stateManager);
            }
            // Handle natural language patterns
            else if (/define\s+(\w+)\s+as\s+(.+)/i.test(input)) {
                response = await this.handleDefineTerm(input, stateManager);
            }
            else if (/add term\s+(\w+)\s+meaning\s+(.+)/i.test(input)) {
                response = await this.handleAddTerm(input, stateManager);
            }
            else if (/what does\s+(\w+)\s+mean/i.test(input)) {
                response = await this.handleLookupTerm(input, stateManager);
            }
            else if (/show glossary/i.test(input) || /^\/glossary$/i.test(trimmedInput)) {
                response = await this.showGlossary(stateManager);
            }
            else if (/remove\s+(\w+)/i.test(input)) {
                response = await this.removeTerm(input, stateManager);
            }
            else {
                // General glossary help
                response = this.provideGlossaryHelp(stateManager);
            }

            // Enhance response with glossary context before returning
            return this.enhanceResponseWithGlossary(response, stateManager);

        } catch (error) {
            return `❌ Glossary operation failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Handle /define command
     */
    private async handleDefineCommand(input: string, stateManager: StateManager): Promise<string> {
        const match = input.match(/\/define\s+(\w+)(?:\s+(.+))?/i);
        if (!match) {
            return `📖 **Define Command Usage:**\n\n\`/define TERM definition here\`\n\nExample: \`/define API Application Programming Interface\``;
        }

        const [, term, definition] = match;
        
        if (!definition) {
            // Look up existing definition
            return await this.lookupSingleTerm(term, stateManager);
        }

        // Add new definition
        return await this.addTermToGlossary(term, definition, stateManager);
    }

    /**
     * Handle /lookup command
     */
    private async handleLookupCommand(input: string, stateManager: StateManager): Promise<string> {
        const match = input.match(/\/lookup\s+(\w+)/i);
        if (!match) {
            return `🔍 **Lookup Command Usage:**\n\n\`/lookup TERM\`\n\nExample: \`/lookup API\``;
        }

        return await this.lookupSingleTerm(match[1], stateManager);
    }

    /**
     * Handle "define X as Y" pattern
     */
    private async handleDefineTerm(input: string, stateManager: StateManager): Promise<string> {
        const match = input.match(/define\s+(\w+)\s+as\s+(.+)/i);
        if (!match) {
            return `❌ Could not parse definition. Use format: "Define TERM as DEFINITION"`;
        }

        const [, term, definition] = match;
        return await this.addTermToGlossary(term, definition, stateManager);
    }

    /**
     * Handle "add term X meaning Y" pattern
     */
    private async handleAddTerm(input: string, stateManager: StateManager): Promise<string> {
        const match = input.match(/add term\s+(\w+)\s+meaning\s+(.+)/i);
        if (!match) {
            return `❌ Could not parse term addition. Use format: "Add term TERM meaning DEFINITION"`;
        }

        const [, term, definition] = match;
        return await this.addTermToGlossary(term, definition, stateManager);
    }

    /**
     * Handle "what does X mean" pattern
     */
    private async handleLookupTerm(input: string, stateManager: StateManager): Promise<string> {
        const match = input.match(/what does\s+(\w+)\s+mean/i);
        if (!match) {
            return `❌ Could not parse lookup request. Use format: "What does TERM mean?"`;
        }

        return await this.lookupSingleTerm(match[1], stateManager);
    }

    /**
     * Add a term to the glossary
     */
    private async addTermToGlossary(term: string, definition: string, stateManager: StateManager): Promise<string> {
        const normalizedTerm = term.toUpperCase();
        
        // Check if term already exists
        const existingTerm = stateManager.projectGlossary.get(normalizedTerm);
        if (existingTerm) {
            return `📖 **Term "${term}" already exists**\n\n**Current definition:** ${existingTerm.definition}\n\n**New definition:** ${definition}\n\nUse "update term ${term} meaning ${definition}" to update it.`;
        }

        // Add new term
        stateManager.projectGlossary.set(normalizedTerm, {
            term: term,
            definition: definition,
            dateAdded: new Date().toISOString(),
            usage: 0
        });

        // Save glossary to storage
        await stateManager.saveGlossaryToStorage();

        return `✅ **Added to glossary:**\n\n**${term}**: ${definition}\n\n📊 **Glossary now contains ${stateManager.projectGlossary.size} terms**`;
    }

    /**
     * Look up a single term
     */
    private async lookupSingleTerm(term: string, stateManager: StateManager): Promise<string> {
        const normalizedTerm = term.toUpperCase();
        const termData = stateManager.projectGlossary.get(normalizedTerm);

        if (!termData) {
            // Suggest similar terms
            const suggestions = this.findSimilarTerms(term, stateManager);
            let response = `❌ **Term "${term}" not found in glossary**\n\n`;
            
            if (suggestions.length > 0) {
                response += `**Did you mean:**\n`;
                suggestions.forEach(suggestion => {
                    response += `• ${suggestion}\n`;
                });
                response += '\n';
            }
            
            response += `**To add it:** "Define ${term} as [definition]"`;
            return response;
        }

        // Increment usage counter
        termData.usage++;

        return `📖 **${termData.term}**\n\n${termData.definition}\n\n*Added: ${new Date(termData.dateAdded).toLocaleDateString()}*\n*Used: ${termData.usage} times*`;
    }

    /**
     * Show the entire glossary
     */
    private async showGlossary(stateManager: StateManager): Promise<string> {
        if (stateManager.projectGlossary.size === 0) {
            return `📖 **Glossary is empty**\n\n**Get started:**\n• "Define API as Application Programming Interface"\n• "Add term SLA meaning Service Level Agreement"\n• "/define JWT JSON Web Token"`;
        }

        let response = `📖 **Project Glossary** (${stateManager.projectGlossary.size} terms)\n\n`;

        // Sort terms by usage (most used first)
        const sortedTerms = Array.from(stateManager.projectGlossary.entries())
            .sort(([,a], [,b]) => b.usage - a.usage);

        // Show up to 10 terms to avoid overwhelming the chat
        const termsToShow = sortedTerms.slice(0, 10);
        
        termsToShow.forEach(([key, termData]) => {
            response += `**${termData.term}**: ${termData.definition}\n`;
            if (termData.usage > 0) {
                response += `*Used ${termData.usage} times*\n`;
            }
            response += '\n';
        });

        if (sortedTerms.length > 10) {
            response += `... and ${sortedTerms.length - 10} more terms\n\n`;
        }

        response += `**Commands:**\n`;
        response += `• "What does [term] mean?" - Look up definition\n`;
        response += `• "Define [term] as [definition]" - Add new term\n`;
        response += `• "Remove [term]" - Delete term\n`;

        return response;
    }

    /**
     * Remove a term from the glossary
     */
    private async removeTerm(input: string, stateManager: StateManager): Promise<string> {
        const match = input.match(/remove\s+(\w+)/i);
        if (!match) {
            return `❌ Could not parse remove request. Use format: "Remove TERM"`;
        }

        const term = match[1];
        const normalizedTerm = term.toUpperCase();
        
        if (!stateManager.projectGlossary.has(normalizedTerm)) {
            return `❌ **Term "${term}" not found in glossary**\n\nUse "show glossary" to see available terms.`;
        }

        const termData = stateManager.projectGlossary.get(normalizedTerm);
        stateManager.projectGlossary.delete(normalizedTerm);

        // Save glossary to storage
        await stateManager.saveGlossaryToStorage();

        return `✅ **Removed from glossary:**\n\n**${termData?.term}**: ${termData?.definition}\n\n📊 **Glossary now contains ${stateManager.projectGlossary.size} terms**`;
    }

    /**
     * Find similar terms for suggestions
     */
    private findSimilarTerms(searchTerm: string, stateManager: StateManager): string[] {
        const suggestions: string[] = [];
        const lowerSearchTerm = searchTerm.toLowerCase();

        for (const [, termData] of stateManager.projectGlossary) {
            const lowerTerm = termData.term.toLowerCase();
            
            // Check for partial matches
            if (lowerTerm.includes(lowerSearchTerm) || lowerSearchTerm.includes(lowerTerm)) {
                suggestions.push(termData.term);
            }
            // Check for similar starting letters
            else if (lowerTerm.startsWith(lowerSearchTerm.charAt(0)) && suggestions.length < 3) {
                suggestions.push(termData.term);
            }
        }

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    /**
     * Enhance response with glossary context
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public enhanceResponseWithGlossary(content: string, stateManager: StateManager): string {
        try {
            if (stateManager.projectGlossary.size === 0) {
                return content;
            }

            let enhancedContent = content;

            // Add glossary definitions for terms found in the response
            for (const [key, termData] of stateManager.projectGlossary) {
                const term = termData.term;
                if (enhancedContent.toLowerCase().includes(term.toLowerCase())) {
                    // Mark usage
                    termData.usage++;
                }
            }

            return enhancedContent;
        } catch (error) {
            console.error('Failed to enhance response with glossary:', error);
            return content;
        }
    }

    /**
     * Provide general glossary help
     */
    private provideGlossaryHelp(stateManager: StateManager): string {
        let response = `📖 **Glossary Commands:**\n\n`;

        response += `**Add terms:**\n`;
        response += `• "Define API as Application Programming Interface"\n`;
        response += `• "Add term SLA meaning Service Level Agreement"\n`;
        response += `• "/define JWT JSON Web Token"\n\n`;

        response += `**Look up terms:**\n`;
        response += `• "What does API mean?"\n`;
        response += `• "/lookup SLA"\n\n`;

        response += `**Manage glossary:**\n`;
        response += `• "Show glossary" - List all terms\n`;
        response += `• "Remove API" - Delete a term\n\n`;

        response += `**Current glossary:** ${stateManager.projectGlossary.size} terms defined`;

        if (stateManager.projectGlossary.size > 0) {
            const recentTerms = Array.from(stateManager.projectGlossary.values())
                .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                .slice(0, 3)
                .map(term => term.term);

            response += `\n\n**Recent terms:** ${recentTerms.join(', ')}`;
        }

        return response;
    }
}
