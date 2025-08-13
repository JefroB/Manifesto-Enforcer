import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';
import { GlossaryTerm } from '../core/types';

/**
 * Tree data provider for the Glossary sidebar view
 * Implements the Traditional UI part of the Duality Principle for glossary access
 */
export class GlossaryTreeDataProvider implements vscode.TreeDataProvider<GlossaryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<GlossaryItem | undefined | null | void> = new vscode.EventEmitter<GlossaryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GlossaryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private glossaryTerms: Map<string, GlossaryTerm> = new Map();

    constructor(private context: vscode.ExtensionContext, private stateManager: StateManager) {
        this.loadGlossary();
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this.loadGlossary();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get tree item representation
     */
    getTreeItem(element: GlossaryItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children of a tree item
     */
    getChildren(element?: GlossaryItem): Thenable<GlossaryItem[]> {
        if (!element) {
            // Root level - return all terms
            if (this.glossaryTerms.size === 0) {
                return Promise.resolve([
                    new GlossaryItem(
                        'No Terms Defined',
                        'Use chat commands to add terms: "Define API as Application Programming Interface"',
                        'empty'
                    )
                ]);
            }

            const sortedTerms = Array.from(this.glossaryTerms.values())
                .sort((a, b) => a.term.localeCompare(b.term));

            return Promise.resolve(sortedTerms.map(term => 
                new GlossaryItem(
                    term.term,
                    term.definition,
                    'term',
                    term.usage
                )
            ));
        }
        
        return Promise.resolve([]);
    }

    /**
     * Load glossary from StateManager
     */
    private loadGlossary(): void {
        try {
            // Sync with StateManager's projectGlossary
            this.glossaryTerms = new Map(this.stateManager.projectGlossary);
        } catch (error) {
            console.error('Failed to load glossary:', error);
        }
    }

    /**
     * Add a new term to the glossary
     */
    async addTerm(term: string, definition: string): Promise<boolean> {
        try {
            // Validate input
            if (!term || !definition || term.trim() === '' || definition.trim() === '') {
                return false;
            }

            const glossaryTerm: GlossaryTerm = {
                term,
                definition,
                dateAdded: new Date(),
                usage: 0
            };

            const upperTerm = term.toUpperCase();
            this.stateManager.projectGlossary.set(upperTerm, glossaryTerm);

            try {
                await this.saveGlossary();
                this.refresh();
                return true;
            } catch (saveError) {
                // Rollback on save failure
                this.stateManager.projectGlossary.delete(upperTerm);
                console.error('Error saving term:', saveError);
                return false;
            }
        } catch (error) {
            console.error('Error adding term:', error);
            return false;
        }
    }

    /**
     * Remove a term from the glossary
     */
    async removeTerm(term: string): Promise<boolean> {
        try {
            // Validate input
            if (!term || term.trim() === '') {
                return false;
            }

            const upperTerm = term.toUpperCase();
            const existed = this.stateManager.projectGlossary.has(upperTerm);

            if (!existed) {
                return false;
            }

            this.stateManager.projectGlossary.delete(upperTerm);
            await this.saveGlossary();
            this.refresh();
            return true;
        } catch (error) {
            console.error('Error removing term:', error);
            return false;
        }
    }

    /**
     * Update term usage
     */
    async incrementUsage(term: string): Promise<boolean> {
        try {
            // Validate input
            if (!term || term.trim() === '') {
                return false;
            }

            const upperTerm = term.toUpperCase();
            const glossaryTerm = this.stateManager.projectGlossary.get(upperTerm);

            if (!glossaryTerm) {
                return false;
            }

            glossaryTerm.usage = (glossaryTerm.usage || 0) + 1;
            await this.saveGlossary();
            this.refresh();
            return true;
        } catch (error) {
            console.error('Error incrementing usage:', error);
            return false;
        }
    }

    /**
     * Save glossary to extension storage
     */
    private async saveGlossary(): Promise<void> {
        try {
            const glossaryObject: any = {};
            for (const [key, value] of this.stateManager.projectGlossary) {
                glossaryObject[key] = value;
            }
            await this.context.workspaceState.update('projectGlossary', {
                timestamp: Date.now(),
                terms: Array.from(this.stateManager.projectGlossary.entries()).map(([key, value]) => ({
                    key,
                    term: value.term,
                    definition: value.definition,
                    dateAdded: value.dateAdded,
                    usage: value.usage
                }))
            });
        } catch (error) {
            console.error('Failed to save glossary:', error);
            throw error; // Re-throw so callers can handle it
        }
    }

    /**
     * Get all terms
     */
    getTerms(): Map<string, GlossaryTerm> {
        return new Map(this.stateManager.projectGlossary);
    }

    /**
     * Search for terms
     */
    searchTerms(query: string): GlossaryTerm[] {
        const results: GlossaryTerm[] = [];
        const lowerQuery = query.toLowerCase();
        
        for (const term of this.stateManager.projectGlossary.values()) {
            if (term.term.toLowerCase().includes(lowerQuery) || 
                term.definition.toLowerCase().includes(lowerQuery)) {
                results.push(term);
            }
        }
        
        return results.sort((a, b) => a.term.localeCompare(b.term));
    }

    /**
     * Get term by name
     */
    getTerm(termName: string): GlossaryTerm | undefined {
        return this.stateManager.projectGlossary.get(termName.toUpperCase());
    }

    /**
     * Export glossary to JSON
     */
    exportToJSON(): string {
        const exportData: any = {};
        for (const [, value] of this.stateManager.projectGlossary) {
            exportData[value.term] = value.definition;
        }
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import glossary from JSON
     */
    async importFromJSON(jsonContent: string): Promise<number> {
        try {
            const data = JSON.parse(jsonContent);
            let importedCount = 0;
            
            for (const [term, definition] of Object.entries(data)) {
                if (typeof definition === 'string') {
                    await this.addTerm(term, definition);
                    importedCount++;
                }
            }
            
            return importedCount;
        } catch (error) {
            throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Represents a glossary item in the tree view
 */
export class GlossaryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly definition: string,
        public readonly type: 'term' | 'empty',
        public readonly usage: number = 0
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        
        if (type === 'term') {
            this.tooltip = `${label}: ${definition}\nUsed ${usage} time${usage !== 1 ? 's' : ''}`;
            this.description = `${definition.substring(0, 40)}${definition.length > 40 ? '...' : ''}`;
            this.iconPath = new vscode.ThemeIcon('book');
            
            // Show usage count if > 0
            if (usage > 0) {
                this.description += ` (${usage}x)`;
            }
            
            // Make clickable to show full definition
            this.command = {
                command: 'manifestoEnforcer.showGlossaryTerm',
                title: 'Show Definition',
                arguments: [this]
            };
        } else {
            this.tooltip = definition;
            this.iconPath = new vscode.ThemeIcon('info');
        }

        this.contextValue = type;
    }
}


