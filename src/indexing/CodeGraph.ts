import * as vscode from 'vscode';

/**
 * Represents a symbol in the code graph with its relationships
 */
export interface CodeSymbol {
    name: string;
    kind: vscode.SymbolKind;
    location: vscode.Location;
    containerName?: string;
    references: vscode.Location[];
    implementations: vscode.Location[];
    callers: CodeSymbol[];
    callees: CodeSymbol[];
}

/**
 * Advanced code graph that understands relationships between symbols
 * Replaces the simple codebase indexer with intelligent relationship mapping
 */
export class CodeGraph {
    private symbols: Map<string, CodeSymbol> = new Map();
    private fileSymbols: Map<string, CodeSymbol[]> = new Map();
    private isIndexed = false;
    private indexTimestamp = 0;

    /**
     * Build the complete code graph for the workspace
     */
    async buildGraph(): Promise<void> {
        console.log('🔍 Building code graph...');
        
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        // Find all code files
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h}',
            '**/node_modules/**'
        );

        let processedFiles = 0;
        
        for (const file of files) {
            try {
                await this.indexFile(file);
                processedFiles++;
                
                if (processedFiles % 10 === 0) {
                    console.log(`📊 Processed ${processedFiles}/${files.length} files`);
                }
            } catch (error) {
                console.warn(`Failed to index ${file.fsPath}:`, error);
            }
        }

        // Build relationships after all symbols are indexed
        await this.buildRelationships();
        
        this.isIndexed = true;
        this.indexTimestamp = Date.now();
        console.log(`✅ Code graph built: ${this.symbols.size} symbols, ${files.length} files`);
    }

    /**
     * Index a single file and extract its symbols
     */
    private async indexFile(fileUri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            fileUri
        );

        if (!symbols) return;

        const fileSymbols: CodeSymbol[] = [];
        
        for (const symbol of symbols) {
            const codeSymbol = await this.createCodeSymbol(symbol, document);
            if (codeSymbol) {
                this.symbols.set(this.getSymbolKey(codeSymbol), codeSymbol);
                fileSymbols.push(codeSymbol);
            }
        }

        this.fileSymbols.set(fileUri.fsPath, fileSymbols);
    }

    /**
     * Create a CodeSymbol from a DocumentSymbol
     */
    private async createCodeSymbol(symbol: vscode.DocumentSymbol, document: vscode.TextDocument): Promise<CodeSymbol | null> {
        try {
            const location = new vscode.Location(document.uri, symbol.range);
            
            // Get references for this symbol
            const references = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                document.uri,
                symbol.range.start
            ) || [];

            // Get implementations
            const implementations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeImplementationProvider',
                document.uri,
                symbol.range.start
            ) || [];

            return {
                name: symbol.name,
                kind: symbol.kind,
                location,
                containerName: undefined, // DocumentSymbol doesn't have containerName
                references,
                implementations,
                callers: [],
                callees: []
            };
        } catch (error) {
            console.warn(`Failed to create symbol for ${symbol.name}:`, error);
            return null;
        }
    }

    /**
     * Build caller/callee relationships between symbols
     */
    private async buildRelationships(): Promise<void> {
        console.log('🔗 Building symbol relationships...');
        
        for (const [, symbol] of this.symbols) {
            // Analyze references to build caller relationships
            for (const ref of symbol.references) {
                const callerSymbol = this.findSymbolAtLocation(ref);
                if (callerSymbol && callerSymbol !== symbol) {
                    symbol.callers.push(callerSymbol);
                    callerSymbol.callees.push(symbol);
                }
            }
        }
    }

    /**
     * Find symbol at a specific location
     */
    private findSymbolAtLocation(location: vscode.Location): CodeSymbol | null {
        const fileSymbols = this.fileSymbols.get(location.uri.fsPath);
        if (!fileSymbols) return null;

        return fileSymbols.find(symbol => 
            symbol.location.range.contains(location.range.start)
        ) || null;
    }

    /**
     * Get unique key for a symbol
     */
    private getSymbolKey(symbol: CodeSymbol): string {
        return `${symbol.location.uri.fsPath}:${symbol.name}:${symbol.kind}`;
    }

    /**
     * Find all references to a symbol by name
     */
    findReferences(symbolName: string): CodeSymbol[] {
        const results: CodeSymbol[] = [];
        
        for (const [, symbol] of this.symbols) {
            if (symbol.name.toLowerCase().includes(symbolName.toLowerCase())) {
                results.push(symbol);
            }
        }
        
        return results;
    }

    /**
     * Analyze impact of changing code at a specific location
     */
    analyzeImpact(fileUri: vscode.Uri, line: number): {
        directImpact: CodeSymbol[];
        indirectImpact: CodeSymbol[];
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    } {
        const position = new vscode.Position(line, 0);
        const location = new vscode.Location(fileUri, position);
        
        const symbol = this.findSymbolAtLocation(location);
        if (!symbol) {
            return { directImpact: [], indirectImpact: [], riskLevel: 'LOW' };
        }

        const directImpact = [...symbol.callers];
        const indirectImpact: CodeSymbol[] = [];
        
        // Find indirect impact (callers of callers)
        for (const caller of symbol.callers) {
            indirectImpact.push(...caller.callers);
        }

        // Assess risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (directImpact.length > 10 || indirectImpact.length > 20) {
            riskLevel = 'HIGH';
        } else if (directImpact.length > 3 || indirectImpact.length > 5) {
            riskLevel = 'MEDIUM';
        }

        return { directImpact, indirectImpact, riskLevel };
    }

    /**
     * Get graph statistics
     */
    getStats(): {
        symbolCount: number;
        fileCount: number;
        isIndexed: boolean;
        lastIndexed: number;
    } {
        return {
            symbolCount: this.symbols.size,
            fileCount: this.fileSymbols.size,
            isIndexed: this.isIndexed,
            lastIndexed: this.indexTimestamp
        };
    }

    /**
     * Check if graph needs rebuilding
     */
    needsRebuild(): boolean {
        if (!this.isIndexed) return true;
        
        // Rebuild if older than 1 hour
        const oneHour = 60 * 60 * 1000;
        return (Date.now() - this.indexTimestamp) > oneHour;
    }
}