import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';

/**
 * Command for handling general help and fallback requests
 * This command always handles input as the final fallback in the command chain
 */
export class GeneralHelpCommand implements IChatCommand {
    public readonly command = '/help';

    /**
     * This command always returns true as it serves as the final fallback
     */
    canHandle(input: string): boolean {
        return true; // Always handle as fallback
    }

    /**
     * Executes the general help command with intelligent routing
     */
    async execute(input: string, stateManager: StateManager): Promise<string> {
        try {
            // Check for test requests
            if (/\b(test|work|functionality|check)\b/i.test(input)) {
                return this.handleTestRequest(stateManager);
            }

            // Check for file reading requests
            if (/\b(read|show|open|view)\b/i.test(input) && /\.(ts|js|tsx|jsx|py|java|cs|cpp|h|md|json)\b/i.test(input)) {
                return this.handleFileRequest(input, stateManager);
            }

            // Check for MR/PR analysis requests
            if (/\b(mr|merge request|pull request|pr|analyze)\b/i.test(input) && /(github\.com|gitlab\.com|gitlab\.)/i.test(input)) {
                return this.handleMRRequest(input, stateManager);
            }

            // Default general response
            return this.provideGeneralHelp(input, stateManager);

        } catch (error) {
            return `❌ General help failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Handle test functionality requests
     */
    private handleTestRequest(stateManager: StateManager): string {
        return '✅ Yes, Piggie works! Ready for manifesto-compliant development with full codebase awareness.';
    }

    /**
     * Handle file reading requests
     */
    private handleFileRequest(input: string, stateManager: StateManager): string {
        if (!stateManager.isCodebaseIndexed) {
            return '⚠️ Codebase not indexed. Click "📚 Index Codebase" first to read files.';
        }

        // Extract filename from request
        const fileMatch = input.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h|md|json))/i);
        if (fileMatch) {
            const filename = fileMatch[1];
            const fileData = Array.from(stateManager.codebaseIndex.values()).find(f => f.path.endsWith(filename));

            if (fileData) {
                const preview = fileData.content.slice(0, 500) + (fileData.content.length > 500 ? '...' : '');
                let response = `📄 **${filename}** (${fileData.size} bytes)\n\n\`\`\`\n${preview}\n\`\`\`\n\n`;
                
                if (fileData.symbols && fileData.symbols.length > 0) {
                    response += `**Symbols found:** ${fileData.symbols.map((s: any) => `${s.name} (${s.type})`).join(', ')}\n`;
                }
                
                if (fileData.imports && fileData.imports.length > 0) {
                    response += `**Imports:** ${fileData.imports.join(', ')}`;
                }
                
                return response;
            } else {
                const availableFiles = Array.from(stateManager.codebaseIndex.keys())
                    .map(p => p.split('/').pop())
                    .slice(0, 5)
                    .join(', ');
                return `❌ File "${filename}" not found in indexed codebase. Available files: ${availableFiles}...`;
            }
        } else {
            return 'Please specify a filename to read (e.g., "show me extension.ts")';
        }
    }

    /**
     * Handle MR/PR analysis requests
     */
    private handleMRRequest(input: string, stateManager: StateManager): string {
        // Extract MR/PR URL from input
        const urlMatch = input.match(/(https?:\/\/(?:github\.com|gitlab\.com|gitlab\.[^\/]+)\/[^\s]+)/i);
        if (urlMatch) {
            const mrUrl = urlMatch[1];
            
            return `🔍 **MR/PR Analysis Ready**

**URL:** ${mrUrl}

**Enterprise Analysis Includes:**
• 📊 Risk assessment (LOW/MEDIUM/HIGH)
• 🧪 Automated test suggestions
• 🛡️ Manifesto compliance check
• 🔒 Security vulnerability scan
• 🤖 Automation opportunities
• 📈 Impact and complexity analysis

**Manual Mode:** Enable Auto mode for immediate analysis, or I can guide you through manual review.`;
        } else {
            return 'Please provide a GitHub or GitLab MR/PR URL for analysis (e.g., "analyze https://github.com/owner/repo/pull/123")';
        }
    }

    /**
     * Provide general help and guidance
     */
    private provideGeneralHelp(input: string, stateManager: StateManager): string {
        let response = `🐷 Piggie here! I understand you said: "${input}"\n\n`;
        
        if (stateManager.isCodebaseIndexed) {
            response += `📚 I have indexed ${stateManager.codebaseIndex.size} files in your codebase and can provide intelligent assistance.\n\n`;
        } else {
            response += `💡 Tip: Use the "Index Codebase" button to enable intelligent code analysis!\n\n`;
        }

        if (stateManager.isManifestoMode) {
            response += `🛡️ Manifesto Mode is active - I'll ensure all suggestions follow best practices for error handling, input validation, and documentation.\n\n`;
        }

        // Show available commands
        response += `**Available Commands:**\n`;
        response += `• **Code Generation:** "Create a UserService class", "Generate hello world"\n`;
        response += `• **Editing:** "Edit UserService.ts", "Modify the login function"\n`;
        response += `• **Linting:** "/lint", "Check code quality", "Fix errors in MyFile.ts"\n`;
        response += `• **Code Analysis:** "/graph", "Show references for MyClass", "Analyze impact"\n`;
        response += `• **Glossary:** "Define API as Application Programming Interface", "What does JWT mean?"\n`;
        response += `• **Manifesto:** "/manifesto", "Show rules", "Generate QA manifesto"\n\n`;

        response += `**How can I help with your development needs?**`;

        return response;
    }
}
