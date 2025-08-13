import * as vscode from 'vscode';

/**
 * Tree data provider for Security Review view
 * Shows security-related actions and tools
 */
export class SecurityReviewProvider implements vscode.TreeDataProvider<SecurityItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SecurityItem | undefined | null | void> = new vscode.EventEmitter<SecurityItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SecurityItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SecurityItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SecurityItem): Thenable<SecurityItem[]> {
        if (!element) {
            // Root level - show security actions
            return Promise.resolve([
                new SecurityItem('Review Selected Code', '🔍 Review Selected Code', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.reviewSelectedCode',
                    title: 'Review Selected Code'
                }),
                new SecurityItem('Security Scan', '🛡️ Run Security Scan', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.validateCompliance',
                    title: 'Security Scan'
                }),
                new SecurityItem('Refactor Code', '♻️ Refactor Selected Code', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.refactorSelectedCode',
                    title: 'Refactor Code'
                }),
                new SecurityItem('Explain Code', '❓ Explain Selected Code', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.explainSelectedCode',
                    title: 'Explain Code'
                }),
                new SecurityItem('Send to Amazon Q', '🟠 Send to Amazon Q', vscode.TreeItemCollapsibleState.None, {
                    command: 'manifestoEnforcer.sendToAmazonQ',
                    title: 'Send to Amazon Q'
                })
            ]);
        }
        return Promise.resolve([]);
    }
}

export class SecurityItem extends vscode.TreeItem {
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
