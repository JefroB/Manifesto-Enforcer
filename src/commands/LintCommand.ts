import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Command for handling lint and fix requests
 * Handles patterns like "/lint", "/fix", and general linting requests
 */
export class LintCommand implements IChatCommand {
    public readonly command = '/lint';

    /**
     * Determines if this command can handle the given input
     */
    canHandle(input: string): boolean {
        const trimmedInput = input.trim();
        
        // Handle slash commands
        if (/^\/(?:lint|fix)\b/i.test(trimmedInput)) {
            return true;
        }

        // Handle natural language lint requests
        if (/\b(lint|linting|fix|fixing|check|validate|analyze)\b/i.test(input) &&
            /\b(code|file|project|errors|warnings|issues)\b/i.test(input)) {
            return true;
        }

        return false;
    }

    /**
     * Executes the lint command
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            if (!stateManager.isCodebaseIndexed) {
                return `⚠️ **Codebase not indexed yet!**\n\nI need to analyze your codebase first to provide linting.\n\nPlease click "📚 Index Codebase" first, then try again.`;
            }

            // Check if specific file is mentioned
            const fileMatch = input.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h))/i);
            if (fileMatch) {
                return await this.lintSpecificFile(fileMatch[1], stateManager);
            }

            // General project linting
            return await this.lintProject(stateManager);

        } catch (error) {
            return `❌ Linting failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Lint a specific file
     */
    private async lintSpecificFile(filename: string, stateManager: StateManager): Promise<string> {
        const fileData = Array.from(stateManager.codebaseIndex.values())
            .find(f => f.path.endsWith(filename));

        if (!fileData) {
            return `❌ File "${filename}" not found in indexed codebase.`;
        }

        const issues = this.analyzeFileForIssues(fileData.content, filename);
        
        if (issues.length === 0) {
            return `✅ **${filename}** looks good!\n\nNo manifesto compliance issues found.`;
        }

        let response = `🔍 **Linting Results for ${filename}:**\n\n`;
        issues.forEach((issue, index) => {
            response += `${index + 1}. **${issue.severity}**: ${issue.message}\n`;
            if (issue.line) {
                response += `   Line ${issue.line}: \`${issue.code}\`\n`;
            }
            response += `   **Fix**: ${issue.fix}\n\n`;
        });

        return response;
    }

    /**
     * Lint the entire project
     */
    private async lintProject(stateManager: StateManager): Promise<string> {
        const allIssues: Array<{file: string, issues: any[]}> = [];
        let totalIssues = 0;

        // Analyze up to 10 files to avoid overwhelming response
        const filesToAnalyze = Array.from(stateManager.codebaseIndex.values()).slice(0, 10);

        for (const fileData of filesToAnalyze) {
            const issues = this.analyzeFileForIssues(fileData.content, fileData.path);
            if (issues.length > 0) {
                allIssues.push({
                    file: fileData.path.split('/').pop() || fileData.path,
                    issues
                });
                totalIssues += issues.length;
            }
        }

        if (totalIssues === 0) {
            return `✅ **Project Linting Complete**\n\nNo manifesto compliance issues found in ${filesToAnalyze.length} analyzed files.\n\n🛡️ Your codebase follows manifesto standards!`;
        }

        let response = `🔍 **Project Linting Results**\n\n`;
        response += `**Summary**: ${totalIssues} issues found across ${allIssues.length} files\n\n`;

        allIssues.forEach(({file, issues}) => {
            response += `**${file}** (${issues.length} issues):\n`;
            issues.slice(0, 3).forEach(issue => {
                response += `• ${issue.severity}: ${issue.message}\n`;
            });
            if (issues.length > 3) {
                response += `• ... and ${issues.length - 3} more issues\n`;
            }
            response += '\n';
        });

        response += `💡 **Tip**: Use "/lint filename.ts" to get detailed fixes for a specific file.`;

        return response;
    }

    /**
     * Analyze file content for manifesto compliance issues
     */
    private analyzeFileForIssues(content: string, filename: string): Array<{
        severity: string;
        message: string;
        line?: number;
        code?: string;
        fix: string;
    }> {
        const issues: any[] = [];
        const lines = content.split('\n');

        // Define source code extensions to analyze
        const sourceCodeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.cpp', '.h', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];

        // Guard clause: Only analyze source code files
        const hasSourceExtension = sourceCodeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
        if (!hasSourceExtension) {
            return []; // Skip analysis for non-code files (e.g., .md, .json, .txt)
        }

        // Improved function detection using regex instead of simple string matching
        const functionDeclarationRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|class\s+\w+|method\s+\w+)/g;
        const hasFunctions = functionDeclarationRegex.test(content);

        // Check for missing error handling (only for files with actual function declarations)
        if (hasFunctions && !content.includes('try') && !content.includes('catch')) {
            issues.push({
                severity: 'HIGH',
                message: 'Missing error handling',
                fix: 'Add try-catch blocks around function logic'
            });
        }

        // Check for missing input validation (only for files with actual function declarations)
        if (hasFunctions && !content.includes('if') && !content.includes('throw')) {
            issues.push({
                severity: 'MEDIUM',
                message: 'Missing input validation',
                fix: 'Add parameter validation with appropriate error throwing'
            });
        }

        // Check for missing JSDoc documentation (using improved function detection)
        const functionMatches = content.match(functionDeclarationRegex);
        const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g);

        if (functionMatches && functionMatches.length > 0) {
            const functionCount = functionMatches.length;
            const jsdocCount = jsdocMatches ? jsdocMatches.length : 0;

            if (jsdocCount < functionCount) {
                issues.push({
                    severity: 'MEDIUM',
                    message: `${functionCount - jsdocCount} functions missing JSDoc documentation`,
                    fix: 'Add JSDoc comments above function declarations'
                });
            }
        }

        // Check for potential security issues
        if (content.includes('innerHTML')) {
            const lineNumber = lines.findIndex(line => line.includes('innerHTML')) + 1;
            issues.push({
                severity: 'HIGH',
                message: 'Potential XSS vulnerability with innerHTML',
                line: lineNumber,
                code: lines[lineNumber - 1]?.trim(),
                fix: 'Use textContent or proper DOM manipulation instead of innerHTML'
            });
        }

        // Check for console.log in production code (if not in test files)
        if (!filename.includes('test') && !filename.includes('spec') && content.includes('console.log')) {
            issues.push({
                severity: 'LOW',
                message: 'Console.log statements found',
                fix: 'Replace with proper logging framework or remove for production'
            });
        }

        return issues;
    }
}
