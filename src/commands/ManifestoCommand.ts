import * as vscode from 'vscode';
import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';
import { FileLifecycleManager } from '../core/FileLifecycleManager';
import { ChatResponseBuilder } from '../core/ChatResponseBuilder';
import { AutoModeManager } from '../core/AutoModeManager';
import { LanguageService } from '../core/LanguageService';
import { StorageService } from '../core/StorageService';

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
        // Debug: console.log(`🔍 ManifestoCommand checking: "${trimmedInput}"`);
        
        // Handle slash commands
        if (/^\/manifesto\b/i.test(trimmedInput)) {
            // Debug: console.log(`✅ ManifestoCommand matched: slash command`);
            return true;
        }

        // Handle manifesto display requests
        if (/\b(manifesto|rules|read|show|display)\b/i.test(input) && /\b(manifesto|rules)\b/i.test(input)) {
            return true;
        }

        // Handle manifesto generation requests (very forgiving for typos)
        const manifestoVariants = /\b(manifesto|manifsto|manfesto|manifets|manifest|manafesto|manifiest)\b/i;
        const createWords = /\b(generate|create|make|build|write|gen)\b/i;

        if (createWords.test(input) && manifestoVariants.test(input)) {
            // Debug: console.log(`✅ ManifestoCommand matched: create + manifesto pattern`);
            return true;
        }

        // Handle "create me a manifesto" type patterns
        if (/\b(create|make|generate|gen)\b.*\b(me|a|an)\b.*\b(manifesto|manifsto|manfesto|manifest)\b/i.test(input)) {
            // Debug: console.log(`✅ ManifestoCommand matched: "create me a" pattern`);
            return true;
        }

        // Handle "manifesto for [project]" patterns
        if (manifestoVariants.test(input) && /\b(for|project|app|application)\b/i.test(input)) {
            // Debug: console.log(`✅ ManifestoCommand matched: "manifesto for" pattern`);
            return true;
        }

        // Debug: console.log(`❌ ManifestoCommand rejected: "${trimmedInput}"`);
        return false;
    }

    /**
     * Executes the manifesto command
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // Check for manifesto generation requests (use same patterns as canHandle)
            const manifestoVariants = /\b(manifesto|manifsto|manfesto|manifets|manifest|manafesto|manifiest)\b/i;
            const createWords = /\b(generate|create|make|build|write|gen)\b/i;

            if (createWords.test(input) && manifestoVariants.test(input)) {
                return await this.handleManifestoGeneration(input, stateManager, agentManager);
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
     * Read manifesto.md file from StorageService location
     */
    private async readManifestoFile(): Promise<string | null> {
        try {
            const storageService = StorageService.getInstance();
            const manifestoPath = await storageService.getProjectArtifactsPath('manifesto.md');

            // Try to read the manifesto file
            const manifestoUri = vscode.Uri.file(manifestoPath);
            const document = await vscode.workspace.openTextDocument(manifestoUri);
            return document.getText();

        } catch (error) {
            // File doesn't exist or can't be read - this is normal for new projects
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
    private async handleManifestoGeneration(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        // Determine manifesto type
        const manifestoType = this.determineManifestoType(input);

        // Check if codebase is indexed
        if (!stateManager.isCodebaseIndexed) {
            // For empty projects or new projects, provide template-based generation
            return this.generateTemplateBasedManifesto(manifestoType, input, stateManager, agentManager);
        }

        // For existing projects, analyze codebase for manifesto opportunities
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

                // Use LanguageService to get all supported file extensions
                const languageService = LanguageService.getInstance();
                const allLanguages = languageService.getAllLanguages();
                const sourceCodeExtensions = allLanguages.flatMap(lang =>
                    languageService.getFileExtensions(lang).map(ext => `.${ext}`)
                );

                // Only analyze source code files
                const hasSourceExtension = sourceCodeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
                if (!hasSourceExtension) {
                    continue; // Skip non-code files
                }

                if (!content) continue;

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

    /**
     * Generate template-based manifesto for empty/new projects
     */
    private async generateTemplateBasedManifesto(manifestoType: string, input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // Detect project type from input
            const projectType = this.detectProjectType(input);

            // Generate the manifesto content
            const manifestoContent = this.generateManifestoFileContent(manifestoType, projectType);

            // Check if we should auto-execute or show buttons
            const autoModeManager = new AutoModeManager(stateManager);
            const manifestoAction = {
                id: 'create-manifesto',
                label: '📋 Create manifesto.md',
                command: 'createManifesto',
                data: { content: manifestoContent, type: manifestoType }
            };

            if (autoModeManager.shouldAutoExecute(manifestoAction)) {
                // Auto mode ON - execute directly like Cline
                try {
                    const result = await autoModeManager.executeAction(manifestoAction, agentManager);

                    let response = `📋 **${manifestoType} Manifesto Created!**\n\n`;
                    response += `🚀 **Auto-execution complete!** Your manifesto is ready.\n\n`;

                    if (projectType) {
                        response += `**Detected Project Type:** ${projectType}\n\n`;
                    }

                    response += result + '\n\n';

                    response += `**🎯 Next Steps:**\n`;
                    response += `• Create your first file and I'll help you follow these standards\n`;
                    response += `• Try: "Create a hello world script in [language]"\n`;
                    response += `• Use \`/lint\` to check compliance as you code`;

                    return response;
                } catch (error) {
                    // Fall back to button mode if auto-execution fails
                    return this.generateManifestoWithButtons(manifestoType, projectType, manifestoContent, `Auto-execution failed: ${error}. Please use the button below.`);
                }
            } else {
                // Auto mode OFF - show action buttons
                return this.generateManifestoWithButtons(manifestoType, projectType, manifestoContent);
            }
        } catch (error) {
            return `❌ Failed to generate manifesto: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Generate manifesto response with action buttons
     */
    private generateManifestoWithButtons(manifestoType: string, projectType: string | null, manifestoContent: string, extraMessage?: string): string {
        const responseBuilder = new ChatResponseBuilder();

        let content = `📋 **${manifestoType} Manifesto Template**\n\n`;
        content += `🚀 **Perfect for new projects!** I'll create a comprehensive manifesto template for you.\n\n`;

        if (projectType) {
            content += `**Detected Project Type:** ${projectType}\n\n`;
        }

        if (extraMessage) {
            content += `⚠️ ${extraMessage}\n\n`;
        }

        content += `**📋 Generated Manifesto Preview:**\n\n`;
        content += `\`\`\`markdown\n${manifestoContent.substring(0, 300)}...\n\`\`\`\n\n`;

        content += `**🎯 Ready to create your manifesto file!**\n`;
        content += `Click the button below to create \`manifesto.md\` in your project root.\n\n`;

        content += `**Next Steps After Creation:**\n`;
        content += `• Create your first file and I'll help you follow these standards\n`;
        content += `• Try: "Create a hello world script in [language]"\n`;
        content += `• Use \`/lint\` to check compliance as you code`;

        // Add action buttons
        responseBuilder
            .setContent(content)
            .addManifestoCreationAction(manifestoContent, manifestoType)
            .addAction({
                id: 'preview-manifesto',
                label: '👁️ Preview Full Content',
                icon: '👁️',
                command: 'previewManifesto',
                data: { content: manifestoContent, type: manifestoType },
                style: 'secondary'
            });

        // If we detected a project type, add a hello world generation button
        if (projectType) {
            responseBuilder.addAction({
                id: 'create-hello-world',
                label: `🚀 Create Hello World (${projectType})`,
                icon: '🚀',
                command: 'executeTddWorkflow',
                data: { content: `Create a simple 'Hello, World!' script in ${projectType}.` },
                style: 'primary'
            });
        }

        return responseBuilder.buildAsHtml();
    }

    /**
     * Generate the actual manifesto file content
     */
    private generateManifestoFileContent(manifestoType: string, projectType: string | null): string {
        let content = `# ${manifestoType} Development Manifesto\n\n`;
        content += `## CRITICAL INSTRUCTIONS:\n`;
        content += `Follow EVERY principle in the manifesto above\n\n`;

        // Add type-specific content
        content += `### 1. CODE QUALITY ENFORCEMENT\n`;
        content += this.getTemplateContent(manifestoType, 'quality') + '\n\n';

        content += `### 2. ARCHITECTURE COMPLIANCE\n`;
        content += this.getTemplateContent(manifestoType, 'architecture') + '\n\n';

        content += `### 3. SECURITY REQUIREMENTS\n`;
        content += this.getTemplateContent(manifestoType, 'security') + '\n\n';

        if (projectType) {
            content += `### 4. ${projectType.toUpperCase()} SPECIFIC STANDARDS\n`;
            content += this.getProjectTypeSpecificRules(projectType) + '\n\n';
        }

        content += `### 5. COMPLIANCE VALIDATION\n`;
        content += `- **MANDATORY:** All code must pass manifesto compliance checks\n`;
        content += `- **MANDATORY:** Use \`/lint\` command to validate compliance\n`;
        content += `- **MANDATORY:** Address all CRITICAL and ENFORCE violations before commit\n`;
        content += `- **RECOMMENDED:** Regular code reviews with manifesto focus\n\n`;

        content += `---\n`;
        content += `*Generated by Piggie Manifesto Enforcer*\n`;
        content += `*Customize this manifesto to fit your specific project needs*`;

        return content;
    }

    /**
     * Detect project type from user input using LanguageService
     */
    private detectProjectType(input: string): string | null {
        const languageService = LanguageService.getInstance();
        return languageService.detectLanguageFromText(input);
    }

    /**
     * Get template content for specific manifesto type and section
     */
    private getTemplateContent(manifestoType: string, section: string): string {
        const templates: Record<string, Record<string, string>> = {
            'General': {
                'quality': '- **MANDATORY:** All code must include comprehensive error handling\n- **MANDATORY:** All public functions require JSDoc documentation\n- **MANDATORY:** All business logic must have corresponding unit tests\n- **MANDATORY:** Code coverage must be maintained above 80%',
                'architecture': '- **ENFORCE:** SOLID principles in all class designs\n- **ENFORCE:** Dependency injection patterns where applicable\n- **ENFORCE:** Interface-based programming for services\n- **ENFORCE:** Repository pattern for data access',
                'security': '- **CRITICAL:** Input validation on all user-facing functions\n- **CRITICAL:** No innerHTML usage (XSS prevention)\n- **CRITICAL:** Proper authentication and authorization\n- **CRITICAL:** Secure data handling and encryption'
            },
            'QA/Testing': {
                'quality': '- **MANDATORY:** Unit tests for all functions (>90% coverage)\n- **MANDATORY:** Integration tests for all API endpoints\n- **MANDATORY:** E2E tests for critical user journeys\n- **MANDATORY:** Performance tests for key operations',
                'architecture': '- **ENFORCE:** Test-driven development (TDD)\n- **ENFORCE:** Page Object Model for UI tests\n- **ENFORCE:** Mock/stub external dependencies\n- **ENFORCE:** Separate test data management',
                'security': '- **CRITICAL:** Security testing in CI/CD pipeline\n- **CRITICAL:** Vulnerability scanning\n- **CRITICAL:** Authentication/authorization testing\n- **CRITICAL:** Data privacy compliance testing'
            },
            'Security': {
                'quality': '- **MANDATORY:** Security code reviews for all changes\n- **MANDATORY:** Static security analysis (SAST)\n- **MANDATORY:** Dynamic security testing (DAST)\n- **MANDATORY:** Dependency vulnerability scanning',
                'architecture': '- **ENFORCE:** Zero-trust architecture principles\n- **ENFORCE:** Principle of least privilege\n- **ENFORCE:** Defense in depth strategy\n- **ENFORCE:** Secure by design patterns',
                'security': '- **CRITICAL:** OWASP Top 10 compliance\n- **CRITICAL:** Encryption at rest and in transit\n- **CRITICAL:** Secure authentication (MFA, OAuth2)\n- **CRITICAL:** Regular security audits and penetration testing'
            }
        };

        return templates[manifestoType]?.[section] || templates['General']?.[section] || '';
    }

    /**
     * Get project-type specific rules
     */
    private getProjectTypeSpecificRules(projectType: string): string {
        const rules: Record<string, string> = {
            'React': '- **ENFORCE:** Functional components with hooks\n- **ENFORCE:** PropTypes or TypeScript for type safety\n- **ENFORCE:** React Testing Library for component tests\n- **ENFORCE:** ESLint React rules compliance',
            'Node.js': '- **ENFORCE:** Express.js security middleware\n- **ENFORCE:** Environment-based configuration\n- **ENFORCE:** Proper error handling middleware\n- **ENFORCE:** API rate limiting and validation',
            'Python': '- **ENFORCE:** PEP 8 style guide compliance\n- **ENFORCE:** Type hints for all functions\n- **ENFORCE:** Virtual environment usage\n- **ENFORCE:** pytest for testing framework',
            'TypeScript': '- **ENFORCE:** Strict TypeScript configuration\n- **ENFORCE:** Interface definitions for all data structures\n- **ENFORCE:** No any types without justification\n- **ENFORCE:** TSDoc comments for public APIs',
            'JavaScript': '- **ENFORCE:** ES6+ modern syntax\n- **ENFORCE:** ESLint and Prettier configuration\n- **ENFORCE:** JSDoc documentation\n- **ENFORCE:** Jest testing framework'
        };

        return rules[projectType] || '- **ENFORCE:** Follow language-specific best practices\n- **ENFORCE:** Use recommended linting tools\n- **ENFORCE:** Implement proper testing strategies\n- **ENFORCE:** Maintain consistent code style';
    }
}
