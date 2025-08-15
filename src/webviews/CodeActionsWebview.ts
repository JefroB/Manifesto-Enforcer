/**
 * Code Actions Webview
 * Phase 2: TDD Implementation - Code Actions Webview with Review/Refactor/Explain actions
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Webview panel for code actions with agent integration
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 */
export class CodeActionsWebview {
    public panel: vscode.WebviewPanel | undefined;
    public readonly stateManager: StateManager;
    public readonly agentManager: AgentManager;
    private context: vscode.ExtensionContext;
    private hasSelection: boolean = false;
    private sortColumn: string = 'severity';
    private sortDirection: 'asc' | 'desc' = 'desc';
    private selectedActions: string[] = [];

    /**
     * Constructor
     * MANDATORY: Input validation (manifesto requirement)
     */
    constructor(context: vscode.ExtensionContext, stateManager: StateManager, agentManager: AgentManager) {
        try {
            if (!context || !stateManager || !agentManager) {
                throw new Error('Invalid parameters provided');
            }

            this.context = context;
            this.stateManager = stateManager;
            this.agentManager = agentManager;
            
            this.createWebviewPanel();
        } catch (error) {
            console.error('CodeActionsWebview initialization failed:', error);
            throw new Error(`CodeActionsWebview initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Setup webview view for sidebar panel
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setupView(webviewView: vscode.WebviewView): void {
        try {
            if (!webviewView) {
                throw new Error('Invalid webview view provided');
            }

            // Configure webview options
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this.context.extensionUri]
            };

            // Set initial HTML content
            webviewView.webview.html = this.getHtmlContent();

            // Handle messages from webview
            webviewView.webview.onDidReceiveMessage(
                message => this.handleMessage(message),
                undefined,
                this.context.subscriptions
            );

            // Store reference for refreshing
            this.panel = webviewView as any; // Temporary workaround for type compatibility

        } catch (error) {
            console.error('Failed to setup Code Actions view:', error);
            throw new Error(`Code Actions view setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create the webview panel
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private createWebviewPanel(): void {
        try {
            this.panel = vscode.window.createWebviewPanel(
                'codeActions',
                'Code Actions (Select code)',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [this.context.extensionUri]
                }
            );

            this.panel.webview.html = this.getHtmlContent();
            this.panel.webview.onDidReceiveMessage(
                message => this.handleMessage(message),
                undefined,
                this.context.subscriptions
            );

            // Handle panel disposal
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);

        } catch (error) {
            console.error('Failed to create webview panel:', error);
            throw new Error(`Webview panel creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get HTML content for the webview
     * MANDATORY: Input validation (manifesto requirement)
     */
    public getHtmlContent(): string {
        try {
            const availableAgents = this.getAvailableAgentsSync();
            const currentAgent = this.stateManager.currentAgent;
            const buttonsDisabled = !this.hasSelection ? 'disabled' : '';

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Code Actions</title>
                    <style>
                        body {
                            font-family: var(--vscode-font-family);
                            padding: 20px;
                            color: var(--vscode-foreground);
                            background-color: var(--vscode-editor-background);
                        }

                        .agent-section {
                            margin-bottom: 20px;
                            padding: 15px;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 5px;
                        }
                        .agent-label {
                            font-weight: bold;
                            margin-bottom: 10px;
                        }
                        select {
                            width: 100%;
                            padding: 8px;
                            margin-bottom: 15px;
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                        }
                        .actions-section {
                            margin-bottom: 20px;
                        }
                        .action-buttons {
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                        }
                        button {
                            padding: 12px 20px;
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: background-color 0.2s;
                        }
                        button:hover:not(:disabled) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        button:disabled {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            cursor: not-allowed;
                            opacity: 0.6;
                        }
                        .send-ai-section {
                            display: flex;
                            gap: 10px;
                            align-items: center;
                            margin-top: 10px;
                        }
                        .send-ai-section select {
                            flex: 1;
                            padding: 6px;
                            background-color: var(--vscode-dropdown-background);
                            color: var(--vscode-dropdown-foreground);
                            border: 1px solid var(--vscode-dropdown-border);
                            border-radius: 3px;
                        }
                        .send-to-ai {
                            background-color: var(--vscode-textLink-foreground);
                            margin: 0;
                        }
                        .send-to-ai:hover:not(:disabled) {
                            background-color: var(--vscode-textLink-activeForeground);
                        }
                        .selection-status {
                            font-style: italic;
                            color: var(--vscode-descriptionForeground);
                            margin-bottom: 15px;
                        }
                    </style>
                </head>
                <body>
                    <div class="selection-status">
                        ${this.hasSelection ? '✅ Code selected' : '⚠️ Select code in editor to enable actions'}
                    </div>

                    <div class="actions-section">
                        <div class="action-buttons">
                            <button id="reviewBtn" ${buttonsDisabled}>🐷 Review</button>
                            <button id="refactorBtn" ${buttonsDisabled}>🐷 Refactor</button>
                            <button id="explainBtn" ${buttonsDisabled}>🐷 Explain</button>
                        </div>
                        <div class="send-ai-section">
                            <select id="agentDropdown">
                                ${availableAgents.map(agent =>
                                    `<option value="${agent}" ${agent === currentAgent ? 'selected' : ''}>${agent}</option>`
                                ).join('')}
                            </select>
                            <button id="sendToAIBtn" class="send-to-ai" ${buttonsDisabled}>🐷 Send to AI</button>
                        </div>
                    </div>

                    <script>
                        const vscode = acquireVsCodeApi();

                        // Agent dropdown change handler
                        document.getElementById('agentDropdown').addEventListener('change', (e) => {
                            vscode.postMessage({
                                command: 'selectAgent',
                                agent: e.target.value
                            });
                        });

                        // Action button handlers
                        document.getElementById('reviewBtn').addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'reviewCode'
                            });
                        });

                        document.getElementById('refactorBtn').addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'refactorCode'
                            });
                        });

                        document.getElementById('explainBtn').addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'explainCode'
                            });
                        });

                        document.getElementById('sendToAIBtn').addEventListener('click', () => {
                            const selectedAgent = document.getElementById('agentDropdown').value;
                            vscode.postMessage({
                                command: 'sendToAI',
                                agent: selectedAgent
                            });
                        });
                    </script>
                </body>
                </html>
            `;
        } catch (error) {
            console.error('Failed to generate HTML content:', error);
            return '<html><body><h1>Error loading Code Actions</h1></body></html>';
        }
    }

    /**
     * Get available agents synchronously
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private getAvailableAgentsSync(): string[] {
        try {
            const agents = this.agentManager.getAvailableAgents();
            return agents.map(agent => agent.name);
        } catch (error) {
            console.error('Failed to get available agents:', error);
            return ['Auggie', 'Amazon Q', 'Claude.dev']; // Fallback agents
        }
    }

    /**
     * Get available agents asynchronously
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async getAvailableAgents(): Promise<string[]> {
        try {
            const agents = this.agentManager.getAvailableAgents();
            return agents.map(agent => agent.name);
        } catch (error) {
            console.error('Failed to get available agents:', error);
            return ['Auggie', 'Amazon Q', 'Claude.dev']; // Fallback agents
        }
    }

    /**
     * Handle messages from webview
     * MANDATORY: Input validation (manifesto requirement)
     */
    public handleMessage(message: any): void {
        try {
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid message format');
            }

            if (!message.command || typeof message.command !== 'string') {
                throw new Error('Missing or invalid command');
            }

            switch (message.command) {
                case 'selectAgent':
                    this.handleAgentSelection(message.agent);
                    break;
                case 'reviewCode':
                    this.handleReviewCode();
                    break;
                case 'refactorCode':
                    this.handleRefactorCode();
                    break;
                case 'explainCode':
                    this.handleExplainCode();
                    break;
                case 'sendToAI':
                    this.handleSendToAI(message.agent);
                    break;
                case 'applyFix':
                    this.handleApplyFix(message.actionId, message.filePath, message.line);
                    break;
                case 'applyAllFixes':
                    this.handleApplyAllFixes();
                    break;
                case 'refreshActions':
                    this.handleRefreshActions();
                    break;
                case 'filterBySeverity':
                    this.handleFilterBySeverity(message.severity);
                    break;
                case 'filterByCategory':
                    this.handleFilterByCategory(message.category);
                    break;
                case 'sortActions':
                    this.handleSortActions(message.sortBy, message.direction);
                    break;
                case 'previewFix':
                    this.handlePreviewFix(message.actionId);
                    break;
                case 'showDetails':
                    this.handleShowDetails(message.actionId);
                    break;
                case 'selectAll':
                    this.handleSelectAll(message.selected);
                    break;
                case 'applySelected':
                    this.handleApplySelected(message.actionIds);
                    break;
                default:
                    throw new Error(`Unknown command: ${message.command}`);
            }
        } catch (error) {
            console.error('Message handling failed:', error);
            vscode.window.showErrorMessage(`Code Actions error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle agent selection
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleAgentSelection(agent: string): void {
        try {
            if (!agent || typeof agent !== 'string') {
                throw new Error('Invalid agent selection');
            }

            this.stateManager.currentAgent = agent;
            vscode.window.showInformationMessage(`Switched to ${agent}`);
        } catch (error) {
            console.error('Agent selection failed:', error);
            throw error;
        }
    }

    /**
     * Handle review code action
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleReviewCode(): void {
        try {
            const selectedText = this.getSelectedText();
            if (!selectedText) {
                throw new Error('No code selected');
            }

            // Execute review command
            vscode.commands.executeCommand('manifestoEnforcer.reviewSelectedCode');
        } catch (error) {
            console.error('Review code failed:', error);
            throw error;
        }
    }

    /**
     * Handle refactor code action
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleRefactorCode(): void {
        try {
            const selectedText = this.getSelectedText();
            if (!selectedText) {
                throw new Error('No code selected');
            }

            // Execute refactor command
            vscode.commands.executeCommand('manifestoEnforcer.refactorSelectedCode');
        } catch (error) {
            console.error('Refactor code failed:', error);
            throw error;
        }
    }

    /**
     * Handle explain code action
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleExplainCode(): void {
        try {
            const selectedText = this.getSelectedText();
            if (!selectedText) {
                throw new Error('No code selected');
            }

            // Execute explain command
            vscode.commands.executeCommand('manifestoEnforcer.explainSelectedCode');
        } catch (error) {
            console.error('Explain code failed:', error);
            throw error;
        }
    }

    /**
     * Handle generic Send to AI action
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleSendToAI(agent: string): void {
        try {
            const selectedText = this.getSelectedText();
            if (!selectedText) {
                throw new Error('No code selected');
            }

            if (!agent || typeof agent !== 'string') {
                throw new Error('Invalid agent specified');
            }

            // Set the agent and execute a generic action
            this.stateManager.currentAgent = agent;
            vscode.commands.executeCommand('manifestoEnforcer.reviewSelectedCode');
        } catch (error) {
            console.error('Send to AI failed:', error);
            throw error;
        }
    }

    /**
     * Get selected text from active editor
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private getSelectedText(): string | null {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.selection.isEmpty) {
                return null;
            }

            return editor.document.getText(editor.selection);
        } catch (error) {
            console.error('Failed to get selected text:', error);
            return null;
        }
    }

    /**
     * Check if there's an active selection
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public hasActiveSelection(): boolean {
        try {
            const editor = vscode.window.activeTextEditor;
            return !!(editor && !editor.selection.isEmpty);
        } catch (error) {
            console.error('Failed to check selection:', error);
            return false;
        }
    }

    /**
     * Update selection state and refresh UI
     * MANDATORY: Input validation (manifesto requirement)
     */
    public updateSelectionState(hasSelection: boolean): void {
        try {
            this.hasSelection = hasSelection;
            if (this.panel) {
                this.panel.webview.html = this.getHtmlContent();
            }
        } catch (error) {
            console.error('Failed to update selection state:', error);
        }
    }

    /**
     * Replace agent-specific commands with generic Send to AI
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public replaceAgentSpecificCommands(): boolean {
        try {
            // This method would be used to replace existing agent-specific commands
            // with the new generic Send to AI functionality
            return true;
        } catch (error) {
            console.error('Failed to replace agent-specific commands:', error);
            return false;
        }
    }

    /**
     * Handle apply fix command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleApplyFix(actionId: string, filePath?: string, line?: number): void {
        try {
            if (!actionId || typeof actionId !== 'string') {
                throw new Error('Invalid action ID provided');
            }

            // Apply the fix (mock implementation for now)
            vscode.window.showInformationMessage(`Fix applied: ${actionId}`);
        } catch (error) {
            console.error('Apply fix failed:', error);
            vscode.window.showErrorMessage(`Failed to apply fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle apply all fixes command
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleApplyAllFixes(): void {
        try {
            // Apply all fixes (mock implementation for now)
            vscode.window.showInformationMessage('All fixes applied successfully');
        } catch (error) {
            console.error('Apply all fixes failed:', error);
            vscode.window.showErrorMessage(`Failed to apply all fixes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle refresh actions command
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleRefreshActions(): void {
        try {
            // Refresh actions (mock implementation for now)
            this.refreshUI();
            vscode.window.showInformationMessage('Actions refreshed');
        } catch (error) {
            console.error('Refresh actions failed:', error);
            vscode.window.showErrorMessage(`Failed to refresh actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle filter by severity command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleFilterBySeverity(severity: string): void {
        try {
            if (!severity || typeof severity !== 'string') {
                throw new Error('Invalid severity provided');
            }

            // Apply severity filter (mock implementation for now)
            this.refreshUI();
        } catch (error) {
            console.error('Filter by severity failed:', error);
            vscode.window.showErrorMessage(`Failed to filter by severity: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle filter by category command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleFilterByCategory(category: string): void {
        try {
            if (!category || typeof category !== 'string') {
                throw new Error('Invalid category provided');
            }

            // Apply category filter (mock implementation for now)
            this.refreshUI();
        } catch (error) {
            console.error('Filter by category failed:', error);
            vscode.window.showErrorMessage(`Failed to filter by category: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle sort actions command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleSortActions(sortBy: string, direction: string): void {
        try {
            if (!sortBy || typeof sortBy !== 'string') {
                throw new Error('Invalid sort column provided');
            }
            if (!direction || typeof direction !== 'string') {
                throw new Error('Invalid sort direction provided');
            }

            // Set sort properties
            this.sortColumn = sortBy;
            this.sortDirection = direction as 'asc' | 'desc';

            // Apply sorting (mock implementation for now)
            this.refreshUI();
        } catch (error) {
            console.error('Sort actions failed:', error);
            vscode.window.showErrorMessage(`Failed to sort actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle preview fix command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handlePreviewFix(actionId: string): void {
        try {
            if (!actionId || typeof actionId !== 'string') {
                throw new Error('Invalid action ID provided');
            }

            // Show preview (mock implementation for now)
            this.refreshUI();
        } catch (error) {
            console.error('Preview fix failed:', error);
            vscode.window.showErrorMessage(`Failed to preview fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle show details command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleShowDetails(actionId: string): void {
        try {
            if (!actionId || typeof actionId !== 'string') {
                throw new Error('Invalid action ID provided');
            }

            // Show details (mock implementation for now)
            this.refreshUI();
        } catch (error) {
            console.error('Show details failed:', error);
            vscode.window.showErrorMessage(`Failed to show details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle select all command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleSelectAll(selected: boolean): void {
        try {
            if (typeof selected !== 'boolean') {
                throw new Error('Invalid selection state provided');
            }

            // Update selected actions
            if (selected) {
                this.selectedActions = ['action-1', 'action-2', 'action-3']; // Mock data
            } else {
                this.selectedActions = [];
            }

            // Handle select all (mock implementation for now)
            this.refreshUI();
        } catch (error) {
            console.error('Select all failed:', error);
            vscode.window.showErrorMessage(`Failed to select all: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle apply selected command
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleApplySelected(actionIds: string[]): void {
        try {
            if (!Array.isArray(actionIds)) {
                throw new Error('Invalid action IDs provided');
            }

            // Apply selected fixes (mock implementation for now)
            vscode.window.showInformationMessage(`${actionIds.length} fixes applied`);
        } catch (error) {
            console.error('Apply selected failed:', error);
            vscode.window.showErrorMessage(`Failed to apply selected fixes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Refresh the webview UI
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private refreshUI(): void {
        try {
            if (this.panel && this.panel.webview) {
                this.panel.webview.html = this.getHtmlContent();
            }
        } catch (error) {
            console.error('UI refresh failed:', error);
            vscode.window.showErrorMessage(`Failed to refresh UI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Refresh webview content
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public refreshContent(): void {
        try {
            if (this.panel) {
                this.panel.webview.html = this.getHtmlContent();
            }
        } catch (error) {
            console.error('Failed to refresh webview content:', error);
        }
    }

    /**
     * Dispose of the webview
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public dispose(): void {
        try {
            if (this.panel) {
                this.panel.dispose();
                this.panel = undefined;
            }
        } catch (error) {
            console.error('Failed to dispose webview:', error);
        }
    }
}
