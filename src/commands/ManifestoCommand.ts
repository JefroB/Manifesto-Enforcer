import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Command for handling manifesto-related requests
 * Handles patterns like "/manifesto", manifesto display, and manifesto generation
 */
export class ManifestoCommand implements IChatCommand {
    public readonly command = '/manifesto';

    /**
     * Determines if this command can handle the given input
     */
    canHandle(input: string): boolean {
        const trimmedInput = input.trim();
        
        // Handle slash commands
        if (/^\/manifesto\b/i.test(trimmedInput)) {
            return true;
        }

        // Handle manifesto display requests
        if (/\b(manifesto|rules|read|show|display)\b/i.test(input) && /\b(manifesto|rules)\b/i.test(input)) {
            return true;
        }

        // Handle manifesto generation requests
        if (/\b(generate|create)\b.*\b(manifesto|qa manifesto|testing manifesto|security manifesto|api manifesto|frontend manifesto)\b/i.test(input)) {
            return true;
        }

        return false;
    }

    /**
     * Executes the manifesto command
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // Check for manifesto generation requests
            if (/\b(generate|create)\b.*\b(manifesto)\b/i.test(input)) {
                return await this.handleManifestoGeneration(input, stateManager);
            }

            // Default to showing manifesto
            return await this.showManifesto(stateManager);

        } catch (error) {
            return `❌ Manifesto operation failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Show the current manifesto
     */
    private async showManifesto(stateManager: StateManager): Promise<string> {
        // Try to read manifesto.md from workspace
        const manifestoContent = await this.readManifestoFile();
        
        if (manifestoContent) {
            return this.formatManifestoDisplay(manifestoContent);
        }

        // Fallback to built-in manifesto rules
        return this.showBuiltInManifesto(stateManager);
    }

    /**
     * Read manifesto.md file from workspace
     */
    private async readManifestoFile(): Promise<string | null> {
        try {
            // This would need to be implemented with actual file system access
            // For now, return null to use built-in manifesto
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Format manifesto content for display
     */
    private formatManifestoDisplay(manifestoContent: string): string {
        // Truncate if too long for chat
        const maxLength = 2000;
        let response = `📋 **Project Manifesto**\n\n`;

        if (manifestoContent.length > maxLength) {
            response += manifestoContent.substring(0, maxLength) + '\n\n... (truncated)\n\n';
            response += `💡 **Full manifesto available in:**\n• 📋 Manifesto sidebar panel\n• manifesto.md file in workspace`;
        } else {
            response += manifestoContent;
        }

        return response;
    }

    /**
     * Show built-in manifesto rules
     */
    private showBuiltInManifesto(stateManager: StateManager): string {
        let response = `📋 **Development Manifesto Summary:**\n\n`;

        response += `**Core Directives:**\n`;
        response += `• All code must have comprehensive error handling\n`;
        response += `• JSDoc documentation required for all public functions\n`;
        response += `• Unit tests mandatory for all business logic\n`;
        response += `• 80%+ code coverage required\n`;
        response += `• SOLID principles enforced\n`;
        response += `• Input validation on all user-facing functions\n`;
        response += `• API responses must be under 200ms\n`;
        response += `• Security analysis required for all changes\n\n`;

        response += `**Key Prohibitions:**\n`;
        response += `• No iframes/webviews in VSCode extensions\n`;
        response += `• No innerHTML usage (XSS prevention)\n`;
        response += `• No SQL injection vulnerabilities\n\n`;

        response += `**Architecture Requirements:**\n`;
        response += `• Interface-based programming for services\n`;
        response += `• Repository pattern for data access\n`;
        response += `• Dependency injection patterns\n`;
        response += `• Clear separation of concerns\n\n`;

        if (stateManager.manifestoRules && stateManager.manifestoRules.length > 0) {
            response += `**Indexed Rules:** ${stateManager.manifestoRules.length} rules loaded\n\n`;
        }

        response += `The full manifesto is in manifesto.md in your workspace.`;

        return response;
    }

    /**
     * Handle manifesto generation requests
     */
    private async handleManifestoGeneration(input: string, stateManager: StateManager): Promise<string> {
        if (!stateManager.isCodebaseIndexed) {
            return `⚠️ **Codebase not indexed yet!**\n\nI need to analyze your codebase first to generate relevant manifestos.\n\nPlease click "📚 Index Codebase" first, then try again.`;
        }

        // Determine manifesto type
        const manifestoType = this.determineManifestoType(input);
        
        // Analyze codebase for manifesto opportunities
        const analysis = await this.analyzeManifestoOpportunities(stateManager);

        if (analysis.suggestions.length === 0) {
            return this.provideManifestoGenerationOptions();
        }

        return this.generateManifestoResponse(manifestoType, analysis);
    }

    /**
     * Determine the type of manifesto to generate
     */
    private determineManifestoType(input: string): string {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('qa') || lowerInput.includes('testing')) {
            return 'QA/Testing';
        }
        if (lowerInput.includes('security')) {
            return 'Security';
        }
        if (lowerInput.includes('api')) {
            return 'API';
        }
        if (lowerInput.includes('frontend') || lowerInput.includes('ui')) {
            return 'Frontend/UI';
        }
        if (lowerInput.includes('performance')) {
            return 'Performance';
        }

        return 'General';
    }

    /**
     * Analyze codebase for manifesto opportunities
     */
    private async analyzeManifestoOpportunities(stateManager: StateManager): Promise<{ suggestions: string[] }> {
        try {
            const suggestions: string[] = [];
            
            // Analyze indexed files for manifesto compliance opportunities
            for (const [filePath, fileData] of stateManager.codebaseIndex) {
                const content = fileData.content;
                const filename = filePath.split('/').pop() || filePath;

                // Define source code extensions to analyze
                const sourceCodeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.cpp', '.h', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];

                // Only analyze source code files
                const hasSourceExtension = sourceCodeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
                if (!hasSourceExtension) {
                    continue; // Skip non-code files
                }

                // Improved function detection using regex
                const functionDeclarationRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|class\s+\w+|method\s+\w+)/g;
                const hasFunctions = functionDeclarationRegex.test(content);

                // Check for missing error handling (only for files with actual functions)
                if (hasFunctions && !content.includes('try') && !content.includes('catch')) {
                    suggestions.push(`• ${filename}: Consider adding error handling`);
                }

                // Check for missing input validation (only for files with actual functions)
                if (hasFunctions && !content.includes('if') && !content.includes('throw')) {
                    suggestions.push(`• ${filename}: Consider adding input validation`);
                }

                // Check for missing documentation (using improved function detection)
                const functionMatches = content.match(functionDeclarationRegex);
                const functionCount = functionMatches ? functionMatches.length : 0;
                const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
                if (functionCount > jsdocCount) {
                    suggestions.push(`• ${filename}: Missing JSDoc documentation`);
                }
            }

            return { suggestions: suggestions.slice(0, 5) }; // Limit to 5 suggestions
        } catch (error) {
            console.error('Failed to analyze manifesto opportunities:', error);
            return { suggestions: [] };
        }
    }

    /**
     * Provide manifesto generation options
     */
    private provideManifestoGenerationOptions(): string {
        let response = `📋 **Ready to generate manifestos!**\n\n`;
        response += `I can create manifestos based on your codebase patterns:\n\n`;

        response += `**Available types:**\n`;
        response += `• "Generate QA manifesto" - Testing standards\n`;
        response += `• "Generate security manifesto" - Security guidelines\n`;
        response += `• "Generate API manifesto" - API standards\n`;
        response += `• "Generate frontend manifesto" - UI component standards\n`;
        response += `• "Generate performance manifesto" - Performance guidelines\n\n`;

        response += `What type would you like me to create?`;

        return response;
    }

    /**
     * Generate manifesto response based on analysis
     */
    private generateManifestoResponse(manifestoType: string, analysis: { suggestions: string[] }): string {
        let response = `📋 **${manifestoType} Manifesto Generation**\n\n`;

        response += `**Based on your codebase analysis:**\n\n`;
        response += analysis.suggestions.join('\n') + '\n\n';

        response += `**Recommended ${manifestoType} Standards:**\n\n`;

        switch (manifestoType) {
            case 'QA/Testing':
                response += this.generateQAManifesto();
                break;
            case 'Security':
                response += this.generateSecurityManifesto();
                break;
            case 'API':
                response += this.generateAPIManifesto();
                break;
            case 'Frontend/UI':
                response += this.generateFrontendManifesto();
                break;
            case 'Performance':
                response += this.generatePerformanceManifesto();
                break;
            default:
                response += this.generateGeneralManifesto();
        }

        response += `\n\n**To generate:** Just say "Generate ${manifestoType.toLowerCase()} manifesto"`;

        return response;
    }

    /**
     * Generate QA/Testing manifesto content
     */
    private generateQAManifesto(): string {
        return `• Unit tests required for all business logic functions\n` +
               `• Integration tests for all API endpoints\n` +
               `• 80%+ code coverage mandatory\n` +
               `• Test-driven development (TDD) preferred\n` +
               `• Automated testing in CI/CD pipeline\n` +
               `• Performance tests for critical paths\n` +
               `• Security tests for authentication/authorization`;
    }

    /**
     * Generate Security manifesto content
     */
    private generateSecurityManifesto(): string {
        return `• Input validation on all user inputs\n` +
               `• SQL injection prevention mandatory\n` +
               `• XSS prevention (no innerHTML usage)\n` +
               `• Authentication required for protected endpoints\n` +
               `• Encryption for sensitive data\n` +
               `• Security headers in all responses\n` +
               `• Regular security audits and vulnerability scans`;
    }

    /**
     * Generate API manifesto content
     */
    private generateAPIManifesto(): string {
        return `• RESTful design principles\n` +
               `• Consistent error response format\n` +
               `• API versioning strategy\n` +
               `• Rate limiting implementation\n` +
               `• Comprehensive API documentation\n` +
               `• Response time < 200ms for standard endpoints\n` +
               `• Proper HTTP status codes`;
    }

    /**
     * Generate Frontend manifesto content
     */
    private generateFrontendManifesto(): string {
        return `• Component-based architecture\n` +
               `• Responsive design principles\n` +
               `• Accessibility (WCAG 2.1) compliance\n` +
               `• Performance optimization (lazy loading, etc.)\n` +
               `• Consistent UI/UX patterns\n` +
               `• Cross-browser compatibility\n` +
               `• Progressive enhancement`;
    }

    /**
     * Generate Performance manifesto content
     */
    private generatePerformanceManifesto(): string {
        return `• Database query optimization\n` +
               `• Caching strategy implementation\n` +
               `• Memory usage monitoring\n` +
               `• Response time targets < 200ms\n` +
               `• Code splitting and lazy loading\n` +
               `• Performance monitoring and alerting\n` +
               `• Regular performance audits`;
    }

    /**
     * Generate General manifesto content
     */
    private generateGeneralManifesto(): string {
        return `• Comprehensive error handling\n` +
               `• JSDoc documentation for all functions\n` +
               `• SOLID principles adherence\n` +
               `• Dependency injection patterns\n` +
               `• Clean code practices\n` +
               `• Regular code reviews\n` +
               `• Continuous integration/deployment`;
    }
}
