/**
 * Gitignore Parser - Parses .gitignore files and checks if files should be ignored
 * Following manifesto: comprehensive error handling, input validation
 */

import * as path from 'path';
import { promises as fs } from 'fs';

export class GitignoreParser {
    private patterns: GitignorePattern[] = [];
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        // MANDATORY: Input validation
        if (!workspaceRoot || typeof workspaceRoot !== 'string') {
            throw new Error('Invalid workspace root: must be non-empty string');
        }
        
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Load and parse .gitignore file
     * MANDATORY: Comprehensive error handling
     */
    public async loadGitignore(): Promise<void> {
        try {
            const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
            
            let content = '';
            try {
                content = await fs.readFile(gitignorePath, 'utf8');
            } catch (error) {
                // .gitignore doesn't exist - that's okay
                console.log('📝 No .gitignore found, using default exclusions only');
                return;
            }

            this.patterns = this.parseGitignoreContent(content);
            console.log(`📝 Loaded ${this.patterns.length} gitignore patterns`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown gitignore parsing error';
            throw new Error(`Failed to load .gitignore: ${errorMessage}`);
        }
    }

    /**
     * Check if a file path should be ignored based on .gitignore patterns
     */
    public isIgnored(filePath: string): boolean {
        try {
            // MANDATORY: Input validation
            if (!filePath || typeof filePath !== 'string') {
                return false;
            }

            // Convert absolute path to relative path from workspace root
            const relativePath = path.relative(this.workspaceRoot, filePath);
            
            // Normalize path separators for cross-platform compatibility
            const normalizedPath = relativePath.replace(/\\/g, '/');

            // Check against all patterns
            for (const pattern of this.patterns) {
                if (this.matchesPattern(normalizedPath, pattern)) {
                    return !pattern.negation; // If negation pattern matches, file is NOT ignored
                }
            }

            return false;

        } catch (error) {
            console.warn('Error checking gitignore pattern:', error);
            return false; // Default to not ignored if there's an error
        }
    }

    /**
     * Get exclusion pattern for vscode.workspace.findFiles
     * CRITICAL: Fixed to ensure proper exclusions
     */
    public getVSCodeExclusionPattern(): string {
        try {
            // CRITICAL: Use STRICT exclusions that actually work with VSCode
            const strictPatterns: string[] = [
                // Core exclusions that MUST work
                '**/node_modules/**',
                '**/out/**',
                '**/dist/**',
                '**/build/**',
                '**/.git/**',
                '**/.piggie/**',

                // File type exclusions
                '**/*.js.map',
                '**/*.vsix',
                '**/*.log',

                // Test exclusions (these might be causing over-indexing)
                '**/__tests__/**',
                '**/test/**',
                '**/tests/**',
                '**/*.test.ts',
                '**/*.test.js',
                '**/*.spec.ts',
                '**/*.spec.js',

                // CRITICAL: Prevent AI response loops - exclude ONLY problematic AI-generated files
                // These files cause response loops when indexed:
                '**/security-analysis-*.md',     // Security analysis results
                '**/code-review-*.md',           // Code review results
                '**/analysis-report-*.md',       // Analysis reports
                '**/diagnostic-*.md',            // Diagnostic outputs
                '**/temp-analysis-*.md',         // Temporary analysis files
                '**/ai-response-*.md',           // Direct AI responses
                '**/context-*.txt',              // Context generation files
                '**/project_context.txt'         // Generated project context

                // NOTE: We DO want to index these AI-generated files:
                // - glossary.json (project glossary)
                // - manifesto-*.md (generated manifestos)
                // - generated code files (.ts, .js)
                // - documentation updates
            ];

            console.log(`🔍 GITIGNORE: Using ${strictPatterns.length} strict exclusion patterns`);

            // CRITICAL: Don't add gitignore patterns for now - they might be causing issues
            // TODO: Re-enable after confirming base exclusions work
            console.log(`⚠️ GITIGNORE: Temporarily using only strict patterns to fix over-indexing`);

            const result = strictPatterns.join(',');
            console.log(`🔍 GITIGNORE: Final exclusion pattern: ${result}`);
            return result;

        } catch (error) {
            console.error('❌ CRITICAL: VSCode exclusion pattern generation failed:', error);
            // MANDATORY: Fallback to minimal safe defaults
            return '**/node_modules/**,**/out/**,**/dist/**,**/build/**,**/*.js.map,**/.piggie/**,**/.git/**';
        }
    }

    /**
     * Parse .gitignore content into patterns
     */
    private parseGitignoreContent(content: string): GitignorePattern[] {
        const patterns: GitignorePattern[] = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            // Check for negation pattern
            const negation = trimmed.startsWith('!');
            const pattern = negation ? trimmed.slice(1) : trimmed;

            patterns.push({
                pattern: pattern,
                negation: negation,
                isDirectory: pattern.endsWith('/'),
                isGlob: pattern.includes('*') || pattern.includes('?')
            });
        }

        return patterns;
    }

    /**
     * Check if a path matches a gitignore pattern
     */
    private matchesPattern(filePath: string, pattern: GitignorePattern): boolean {
        try {
            let patternToMatch = pattern.pattern;

            // Handle directory patterns
            if (pattern.isDirectory) {
                patternToMatch = patternToMatch.slice(0, -1); // Remove trailing slash
                // Check if any part of the path matches the directory pattern
                const pathParts = filePath.split('/');
                for (let i = 0; i < pathParts.length; i++) {
                    const partialPath = pathParts.slice(0, i + 1).join('/');
                    if (this.simpleGlobMatch(partialPath, patternToMatch)) {
                        return true;
                    }
                }
                return false;
            }

            // Handle glob patterns
            if (pattern.isGlob) {
                return this.simpleGlobMatch(filePath, patternToMatch);
            }

            // Simple string matching
            return filePath === patternToMatch || filePath.endsWith('/' + patternToMatch);

        } catch (error) {
            console.warn('Error matching pattern:', error);
            return false;
        }
    }

    /**
     * Simple glob matching (supports * and ? wildcards)
     */
    private simpleGlobMatch(text: string, pattern: string): boolean {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(text);
    }

    /**
     * Check if a gitignore pattern can be converted to VSCode exclusion pattern
     */
    private canConvertToVSCodePattern(pattern: string): boolean {
        // VSCode patterns support basic globs, avoid complex patterns
        return !pattern.includes('[') && !pattern.includes('{') && !pattern.includes('\\');
    }

    /**
     * Convert gitignore pattern to VSCode exclusion pattern
     */
    private convertToVSCodePattern(pattern: string): string {
        // Add ** prefix if pattern doesn't start with /
        if (!pattern.startsWith('/')) {
            return `**/${pattern}`;
        }
        
        return pattern.slice(1); // Remove leading slash
    }
}

interface GitignorePattern {
    pattern: string;
    negation: boolean;
    isDirectory: boolean;
    isGlob: boolean;
}
