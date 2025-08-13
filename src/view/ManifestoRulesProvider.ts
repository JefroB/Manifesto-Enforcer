import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';

/**
 * Tree data provider for Manifesto Rules view
 * Shows manifesto management actions and rules
 */
export class ManifestoRulesProvider implements vscode.TreeDataProvider<RuleItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<RuleItem | undefined | null | void> = new vscode.EventEmitter<RuleItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RuleItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private stateManager: StateManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: RuleItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: RuleItem): Thenable<RuleItem[]> {
        if (!element) {
            // Root level - show manifesto actions
            return Promise.resolve([
                new RuleItem('Toggle Manifesto Mode', '🛡️ Toggle Manifesto Mode', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.toggleManifestoMode',
                    title: 'Toggle Manifesto Mode'
                }),
                new RuleItem('Create Manifesto', '📝 Create New Manifesto', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.createManifesto',
                    title: 'Create Manifesto'
                }),
                new RuleItem('Refresh Manifesto', '🔄 Refresh Manifesto', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.refreshManifesto',
                    title: 'Refresh Manifesto'
                }),
                new RuleItem('Validate Compliance', '✅ Validate Compliance', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.validateCompliance',
                    title: 'Validate Compliance'
                }),
                new RuleItem('Settings', '⚙️ Open Settings', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.openSettings',
                    title: 'Open Settings'
                })
            ]);
        }
        return Promise.resolve([]);
    }
}

export class RuleItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.command = command;
    }
}
