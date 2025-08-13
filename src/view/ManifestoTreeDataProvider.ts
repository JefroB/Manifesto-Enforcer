import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../core/StateManager';

/**
 * Tree data provider for the Manifesto sidebar view
 * Implements the Traditional UI part of the Duality Principle for manifesto access
 */
export class ManifestoTreeDataProvider implements vscode.TreeDataProvider<ManifestoItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ManifestoItem | undefined | null | void> = new vscode.EventEmitter<ManifestoItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ManifestoItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private manifestoContent: string = '';
    private manifestoSections: ManifestoSection[] = [];

    constructor(private stateManager: StateManager) {
        this.loadManifesto();
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this.loadManifesto();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get tree item representation
     */
    getTreeItem(element: ManifestoItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children of a tree item
     */
    getChildren(element?: ManifestoItem): Thenable<ManifestoItem[]> {
        if (!element) {
            // Root level - return sections
            return Promise.resolve(this.manifestoSections.map(section => 
                new ManifestoItem(
                    section.title,
                    section.content,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'section'
                )
            ));
        } else if (element.type === 'section') {
            // Section level - return rules
            const section = this.manifestoSections.find(s => s.title === element.label);
            if (section) {
                return Promise.resolve(section.rules.map(rule => 
                    new ManifestoItem(
                        rule.title,
                        rule.content,
                        vscode.TreeItemCollapsibleState.None,
                        'rule'
                    )
                ));
            }
        }
        
        return Promise.resolve([]);
    }

    /**
     * Load manifesto content from file
     */
    private async loadManifesto(): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this.manifestoSections = [{
                    title: 'No Workspace',
                    content: 'Open a workspace to view manifesto',
                    rules: []
                }];
                return;
            }

            // Look for manifesto files
            const manifestoFiles = await vscode.workspace.findFiles(
                '**/*{manifesto,standards,guidelines,rules}*.{md,txt}',
                '**/node_modules/**'
            );

            if (manifestoFiles.length === 0) {
                this.manifestoSections = [{
                    title: 'No Manifesto Found',
                    content: 'Create a manifesto.md file to get started',
                    rules: [{
                        title: 'Create Manifesto',
                        content: 'Use the chat command: /manifesto or create manifesto.md manually'
                    }]
                }];
                return;
            }

            // Read the first manifesto file
            const manifestoFile = manifestoFiles[0];
            const document = await vscode.workspace.openTextDocument(manifestoFile);
            this.manifestoContent = document.getText();
            
            // Parse the manifesto content
            this.parseManifestoContent();

        } catch (error) {
            console.error('Failed to load manifesto:', error);
            this.manifestoSections = [{
                title: 'Error Loading Manifesto',
                content: `Failed to load: ${error instanceof Error ? error.message : String(error)}`,
                rules: []
            }];
        }
    }

    /**
     * Parse manifesto markdown content into sections and rules
     */
    private parseManifestoContent(): void {
        const lines = this.manifestoContent.split('\n');
        const sections: ManifestoSection[] = [];
        let currentSection: ManifestoSection | null = null;
        let currentRule: ManifestoRule | null = null;
        let contentBuffer: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Main section headers (## or #)
            if (trimmedLine.match(/^#{1,2}\s+/)) {
                // Save previous rule if exists
                if (currentRule && contentBuffer.length > 0) {
                    currentRule.content = contentBuffer.join('\n').trim();
                    contentBuffer = [];
                }
                
                // Save previous section if exists
                if (currentSection && currentRule) {
                    currentSection.rules.push(currentRule);
                    currentRule = null;
                }
                
                if (currentSection) {
                    sections.push(currentSection);
                }

                // Start new section
                const title = trimmedLine.replace(/^#{1,2}\s+/, '');
                currentSection = {
                    title,
                    content: '',
                    rules: []
                };
                
            } else if (trimmedLine.match(/^#{3,}\s+/) && currentSection) {
                // Sub-section headers (### or more) - treat as rules
                if (currentRule && contentBuffer.length > 0) {
                    currentRule.content = contentBuffer.join('\n').trim();
                    currentSection.rules.push(currentRule);
                    contentBuffer = [];
                }

                const title = trimmedLine.replace(/^#{3,}\s+/, '');
                currentRule = {
                    title,
                    content: ''
                };
                
            } else if (trimmedLine.startsWith('- **') || trimmedLine.startsWith('* **')) {
                // Bullet points with bold text - treat as rules
                if (!currentSection) {
                    currentSection = {
                        title: 'General Rules',
                        content: '',
                        rules: []
                    };
                }

                if (currentRule && contentBuffer.length > 0) {
                    currentRule.content = contentBuffer.join('\n').trim();
                    currentSection.rules.push(currentRule);
                    contentBuffer = [];
                }

                const match = trimmedLine.match(/^[-*]\s+\*\*([^*]+)\*\*/);
                if (match) {
                    currentRule = {
                        title: match[1],
                        content: trimmedLine
                    };
                }
                
            } else if (trimmedLine.length > 0) {
                // Regular content
                contentBuffer.push(line);
            }
        }

        // Save final rule and section
        if (currentRule && contentBuffer.length > 0) {
            currentRule.content = contentBuffer.join('\n').trim();
        }
        if (currentSection && currentRule) {
            currentSection.rules.push(currentRule);
        }
        if (currentSection) {
            sections.push(currentSection);
        }

        this.manifestoSections = sections.length > 0 ? sections : [{
            title: 'Empty Manifesto',
            content: 'The manifesto file appears to be empty',
            rules: []
        }];
    }

    /**
     * Get the full manifesto content
     */
    getManifestoContent(): string {
        return this.manifestoContent;
    }

    /**
     * Get manifesto sections
     */
    getSections(): ManifestoSection[] {
        return this.manifestoSections;
    }
}

/**
 * Represents a manifesto item in the tree view
 */
export class ManifestoItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly content: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'section' | 'rule'
    ) {
        super(label, collapsibleState);
        
        this.tooltip = content;
        this.description = type === 'section' ? '' : content.substring(0, 50) + (content.length > 50 ? '...' : '');
        
        // Set icons
        if (type === 'section') {
            this.iconPath = new vscode.ThemeIcon('folder');
        } else {
            this.iconPath = new vscode.ThemeIcon('shield');
        }

        // Set context value for commands
        this.contextValue = type;
        
        // Make rules clickable to show content
        if (type === 'rule') {
            this.command = {
                command: 'manifestoEnforcer.showManifestoRule',
                title: 'Show Rule',
                arguments: [this]
            };
        }
    }
}

/**
 * Represents a manifesto section
 */
export interface ManifestoSection {
    title: string;
    content: string;
    rules: ManifestoRule[];
}

/**
 * Represents a manifesto rule
 */
interface ManifestoRule {
    title: string;
    content: string;
}
