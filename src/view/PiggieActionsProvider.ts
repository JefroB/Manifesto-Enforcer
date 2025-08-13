import * as vscode from 'vscode';

/**
 * Tree data provider for Piggie Actions view
 * Shows available Piggie commands and actions
 */
export class PiggieActionsProvider implements vscode.TreeDataProvider<ActionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ActionItem | undefined | null | void> = new vscode.EventEmitter<ActionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ActionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ActionItem): Thenable<ActionItem[]> {
        if (!element) {
            // Root level - show main action categories
            return Promise.resolve([
                new ActionItem('Quick Chat', '💬 Quick Chat with Piggie', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.quickChat',
                    title: 'Quick Chat'
                }),
                new ActionItem('Write Code', '📝 Write Code', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.writeCode',
                    title: 'Write Code'
                }),
                new ActionItem('Validate Compliance', '✅ Validate Compliance', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.validateCompliance',
                    title: 'Validate Compliance'
                }),
                new ActionItem('Switch Agent', '🤖 Switch AI Agent', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.switchAgent',
                    title: 'Switch Agent'
                }),
                new ActionItem('Test Connection', '🔧 Test Connection', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.testConnection',
                    title: 'Test Connection'
                }),
                new ActionItem('Discover APIs', '🔍 Discover APIs', vscode.TreeItemCollapsibleState.None, {
                    command: 'piggie.discoverAPIs',
                    title: 'Discover APIs'
                })
            ]);
        }
        return Promise.resolve([]);
    }
}

export class ActionItem extends vscode.TreeItem {
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
