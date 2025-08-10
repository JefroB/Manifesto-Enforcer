import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Command for handling code graph and analysis requests
 * Handles patterns like "/references", "/impact", "/graph"
 */
export class GraphCommand implements IChatCommand {
    public readonly command = '/graph';

    /**
     * Determines if this command can handle the given input
     */
    canHandle(input: string): boolean {
        const trimmedInput = input.trim();
        
        // Handle slash commands for code graph analysis
        if (/^\/(?:references|impact|graph)\b/i.test(trimmedInput)) {
            return true;
        }

        // Handle natural language graph requests
        if (/\b(references|dependencies|impact|graph|analyze|structure|relationships)\b/i.test(input) &&
            /\b(code|codebase|project|files|modules)\b/i.test(input)) {
            return true;
        }

        return false;
    }

    /**
     * Executes the graph command
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            if (!stateManager.isCodebaseIndexed) {
                return `⚠️ **Codebase not indexed yet!**\n\nI need to analyze your codebase first to generate code graphs.\n\nPlease click "📚 Index Codebase" first, then try again.`;
            }

            const trimmedInput = input.trim();

            // Determine the type of graph analysis requested
            if (/^\/references\b/i.test(trimmedInput) || /\breferences\b/i.test(input)) {
                return await this.analyzeReferences(input, stateManager);
            }
            
            if (/^\/impact\b/i.test(trimmedInput) || /\bimpact\b/i.test(input)) {
                return await this.analyzeImpact(input, stateManager);
            }

            // General graph analysis
            return await this.generateCodeGraph(stateManager);

        } catch (error) {
            return `❌ Graph analysis failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Analyze references for a specific symbol or file
     */
    private async analyzeReferences(input: string, stateManager: StateManager): Promise<string> {
        // Extract symbol or file name from input
        const symbolMatch = input.match(/(?:references?\s+(?:for\s+)?|\/references\s+)(\w+)/i);
        const fileMatch = input.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h))/i);

        if (symbolMatch) {
            return this.findSymbolReferences(symbolMatch[1], stateManager);
        }

        if (fileMatch) {
            return this.findFileReferences(fileMatch[1], stateManager);
        }

        return `🔍 **Reference Analysis**\n\nPlease specify what to analyze:\n\n**Examples:**\n• "/references UserService" - Find all references to UserService\n• "/references UserService.ts" - Find all files that import UserService.ts\n• "Show references for validateInput" - Find where validateInput is used`;
    }

    /**
     * Analyze impact of changes to a specific symbol or file
     */
    private async analyzeImpact(input: string, stateManager: StateManager): Promise<string> {
        const symbolMatch = input.match(/(?:impact\s+(?:of\s+)?|\/impact\s+)(\w+)/i);
        const fileMatch = input.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h))/i);

        if (symbolMatch) {
            return this.analyzeSymbolImpact(symbolMatch[1], stateManager);
        }

        if (fileMatch) {
            return this.analyzeFileImpact(fileMatch[1], stateManager);
        }

        return `📊 **Impact Analysis**\n\nPlease specify what to analyze:\n\n**Examples:**\n• "/impact UserService" - Analyze impact of changing UserService\n• "/impact database.ts" - Analyze impact of changing database.ts\n• "What's the impact of modifying validateUser?" - Analyze function impact`;
    }

    /**
     * Generate a general code graph overview
     */
    private async generateCodeGraph(stateManager: StateManager): Promise<string> {
        const stats = this.calculateCodebaseStats(stateManager);
        const dependencies = this.analyzeDependencies(stateManager);
        const hotspots = this.identifyHotspots(stateManager);

        let response = `📊 **Codebase Graph Analysis**\n\n`;
        
        response += `**Overview:**\n`;
        response += `• ${stats.totalFiles} files indexed\n`;
        response += `• ${stats.totalFunctions} functions found\n`;
        response += `• ${stats.totalClasses} classes found\n`;
        response += `• ${stats.totalInterfaces} interfaces found\n\n`;

        response += `**Dependencies:**\n`;
        dependencies.slice(0, 5).forEach(dep => {
            response += `• ${dep.file} → imports ${dep.imports.length} modules\n`;
        });
        response += '\n';

        response += `**Complexity Hotspots:**\n`;
        hotspots.slice(0, 5).forEach(hotspot => {
            response += `• ${hotspot.file} (${hotspot.complexity} complexity score)\n`;
        });
        response += '\n';

        response += `**Available Commands:**\n`;
        response += `• "/references [symbol]" - Find where a symbol is used\n`;
        response += `• "/impact [file]" - Analyze change impact\n`;
        response += `• "/graph dependencies" - Show dependency graph\n`;

        return response;
    }

    /**
     * Find all references to a specific symbol
     */
    private findSymbolReferences(symbolName: string, stateManager: StateManager): string {
        const references: Array<{file: string, line: number, context: string}> = [];

        for (const [filePath, fileData] of stateManager.codebaseIndex) {
            const lines = fileData.content.split('\n');
            lines.forEach((line: string, index: number) => {
                if (line.includes(symbolName) && !line.trim().startsWith('//')) {
                    references.push({
                        file: filePath.split('/').pop() || filePath,
                        line: index + 1,
                        context: line.trim()
                    });
                }
            });
        }

        if (references.length === 0) {
            return `🔍 **No references found for "${symbolName}"**\n\nThe symbol might be:\n• Misspelled\n• Not in indexed files\n• Used in comments only`;
        }

        let response = `🔍 **References for "${symbolName}"** (${references.length} found)\n\n`;
        
        references.slice(0, 10).forEach(ref => {
            response += `**${ref.file}:${ref.line}**\n`;
            response += `\`${ref.context}\`\n\n`;
        });

        if (references.length > 10) {
            response += `... and ${references.length - 10} more references\n\n`;
        }

        response += `💡 **Impact**: Changes to "${symbolName}" will affect ${references.length} locations`;

        return response;
    }

    /**
     * Find all files that reference a specific file
     */
    private findFileReferences(filename: string, stateManager: StateManager): string {
        const references: Array<{file: string, importLine: string}> = [];
        const baseFilename = filename.replace(/\.(ts|js|tsx|jsx)$/, '');

        for (const [filePath, fileData] of stateManager.codebaseIndex) {
            const lines = fileData.content.split('\n');
            lines.forEach((line: string) => {
                if (line.includes('import') &&
                    (line.includes(filename) || line.includes(baseFilename))) {
                    references.push({
                        file: filePath.split('/').pop() || filePath,
                        importLine: line.trim()
                    });
                }
            });
        }

        if (references.length === 0) {
            return `🔍 **No imports found for "${filename}"**\n\nThe file might be:\n• Not imported by other files\n• Used differently (require, dynamic imports)\n• Not in the indexed codebase`;
        }

        let response = `🔍 **Files importing "${filename}"** (${references.length} found)\n\n`;
        
        references.forEach(ref => {
            response += `**${ref.file}**\n`;
            response += `\`${ref.importLine}\`\n\n`;
        });

        response += `💡 **Impact**: Changes to "${filename}" will affect ${references.length} importing files`;

        return response;
    }

    /**
     * Analyze the impact of changing a specific symbol
     */
    private analyzeSymbolImpact(symbolName: string, stateManager: StateManager): string {
        const references = this.findSymbolReferences(symbolName, stateManager);
        const referenceCount = (references.match(/\*\*/g) || []).length / 2; // Rough count

        let impact = 'LOW';
        if (referenceCount > 10) impact = 'HIGH';
        else if (referenceCount > 5) impact = 'MEDIUM';

        let response = `📊 **Impact Analysis for "${symbolName}"**\n\n`;
        response += `**Risk Level:** ${impact}\n`;
        response += `**Affected Locations:** ${referenceCount}\n\n`;

        response += `**Recommendations:**\n`;
        if (impact === 'HIGH') {
            response += `• ⚠️ High-risk change - extensive testing required\n`;
            response += `• Consider backward compatibility\n`;
            response += `• Plan phased rollout\n`;
            response += `• Update all affected documentation\n`;
        } else if (impact === 'MEDIUM') {
            response += `• 🔶 Medium-risk change - thorough testing needed\n`;
            response += `• Review all affected files\n`;
            response += `• Update relevant tests\n`;
        } else {
            response += `• ✅ Low-risk change - standard testing sufficient\n`;
            response += `• Verify functionality in affected areas\n`;
        }

        response += `\n${references}`;

        return response;
    }

    /**
     * Analyze the impact of changing a specific file
     */
    private analyzeFileImpact(filename: string, stateManager: StateManager): string {
        const references = this.findFileReferences(filename, stateManager);
        const referenceCount = (references.match(/\*\*/g) || []).length / 2;

        let impact = 'LOW';
        if (referenceCount > 8) impact = 'HIGH';
        else if (referenceCount > 3) impact = 'MEDIUM';

        let response = `📊 **Impact Analysis for "${filename}"**\n\n`;
        response += `**Risk Level:** ${impact}\n`;
        response += `**Importing Files:** ${referenceCount}\n\n`;

        response += `**Change Impact:**\n`;
        if (impact === 'HIGH') {
            response += `• ⚠️ Core module - changes affect many files\n`;
            response += `• Breaking changes will cascade\n`;
            response += `• Requires comprehensive regression testing\n`;
        } else if (impact === 'MEDIUM') {
            response += `• 🔶 Shared module - moderate impact\n`;
            response += `• Test all importing modules\n`;
            response += `• Check for breaking changes\n`;
        } else {
            response += `• ✅ Isolated module - minimal impact\n`;
            response += `• Standard testing procedures apply\n`;
        }

        response += `\n${references}`;

        return response;
    }

    /**
     * Calculate basic codebase statistics
     */
    private calculateCodebaseStats(stateManager: StateManager): any {
        let totalFunctions = 0;
        let totalClasses = 0;
        let totalInterfaces = 0;

        for (const [, fileData] of stateManager.codebaseIndex) {
            const content = fileData.content;
            totalFunctions += (content.match(/function\s+\w+/g) || []).length;
            totalClasses += (content.match(/class\s+\w+/g) || []).length;
            totalInterfaces += (content.match(/interface\s+\w+/g) || []).length;
        }

        return {
            totalFiles: stateManager.codebaseIndex.size,
            totalFunctions,
            totalClasses,
            totalInterfaces
        };
    }

    /**
     * Analyze dependencies between files
     */
    private analyzeDependencies(stateManager: StateManager): Array<{file: string, imports: string[]}> {
        const dependencies: Array<{file: string, imports: string[]}> = [];

        for (const [filePath, fileData] of stateManager.codebaseIndex) {
            const imports = fileData.content
                .split('\n')
                .filter((line: string) => line.trim().startsWith('import'))
                .map((line: string) => line.trim());

            if (imports.length > 0) {
                dependencies.push({
                    file: filePath.split('/').pop() || filePath,
                    imports
                });
            }
        }

        return dependencies.sort((a, b) => b.imports.length - a.imports.length);
    }

    /**
     * Identify complexity hotspots in the codebase
     */
    private identifyHotspots(stateManager: StateManager): Array<{file: string, complexity: number}> {
        const hotspots: Array<{file: string, complexity: number}> = [];

        for (const [filePath, fileData] of stateManager.codebaseIndex) {
            const content = fileData.content;
            
            // Simple complexity calculation based on various factors
            let complexity = 0;
            complexity += (content.match(/if\s*\(/g) || []).length * 1;
            complexity += (content.match(/for\s*\(/g) || []).length * 2;
            complexity += (content.match(/while\s*\(/g) || []).length * 2;
            complexity += (content.match(/switch\s*\(/g) || []).length * 3;
            complexity += (content.match(/catch\s*\(/g) || []).length * 1;
            complexity += Math.floor(content.length / 1000); // Size factor

            if (complexity > 5) {
                hotspots.push({
                    file: filePath.split('/').pop() || filePath,
                    complexity
                });
            }
        }

        return hotspots.sort((a, b) => b.complexity - a.complexity);
    }
}
