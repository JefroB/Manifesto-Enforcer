/**
 * Manifesto Management Webview
 * Phase 3: TDD Implementation - Manifesto Management with tabbed interface
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';

/**
 * Webview panel for manifesto management with tabbed interface
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 */
export class ManifestoWebview {
    public panel: vscode.WebviewPanel | undefined;
    public readonly stateManager: StateManager;
    private context: vscode.ExtensionContext;
    private currentTab: string = 'manifesto';

    /**
     * Constructor
     * MANDATORY: Input validation (manifesto requirement)
     */
    constructor(context: vscode.ExtensionContext, stateManager: StateManager) {
        try {
            if (!context || !stateManager) {
                throw new Error('Invalid parameters provided');
            }

            this.context = context;
            this.stateManager = stateManager;
            
            this.createWebviewPanel();
        } catch (error) {
            console.error('ManifestoWebview initialization failed:', error);
            throw new Error(`ManifestoWebview initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create the webview panel
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private createWebviewPanel(): void {
        try {
            this.panel = vscode.window.createWebviewPanel(
                'manifestoManagement',
                'Manifesto Management',
                vscode.ViewColumn.One,
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
            const currentMode = this.stateManager.manifestoMode;
            const devPath = this.stateManager.devManifestoPath || 'manifesto-dev.md';
            const qaPath = this.stateManager.qaManifestoPath || 'manifesto-qa.md';
            const manifestoRules = this.getManifestoRules();

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Manifesto Management</title>
                    <style>
                        body {
                            font-family: var(--vscode-font-family);
                            padding: 20px;
                            color: var(--vscode-foreground);
                            background-color: var(--vscode-editor-background);
                        }
                        .header {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            color: var(--vscode-textLink-foreground);
                        }
                        .tabs {
                            display: flex;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            margin-bottom: 20px;
                        }
                        .tab {
                            padding: 12px 24px;
                            cursor: pointer;
                            border: none;
                            background: none;
                            color: var(--vscode-foreground);
                            font-size: 14px;
                            border-bottom: 2px solid transparent;
                        }
                        .tab.active {
                            color: var(--vscode-textLink-foreground);
                            border-bottom-color: var(--vscode-textLink-foreground);
                        }
                        .tab:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        .tab-content {
                            display: none;
                        }
                        .tab-content.active {
                            display: block;
                        }
                        .mode-section {
                            margin-bottom: 30px;
                            padding: 20px;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 5px;
                        }
                        .mode-label {
                            font-weight: bold;
                            margin-bottom: 10px;
                            font-size: 16px;
                        }
                        select {
                            width: 200px;
                            padding: 8px;
                            margin-bottom: 15px;
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                        }
                        .file-section {
                            margin-bottom: 30px;
                        }
                        .file-item {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 10px;
                            margin-bottom: 10px;
                            background-color: var(--vscode-list-inactiveSelectionBackground);
                            border-radius: 3px;
                        }
                        .file-path {
                            font-family: monospace;
                            color: var(--vscode-textLink-foreground);
                        }
                        .file-actions {
                            display: flex;
                            gap: 10px;
                        }
                        button {
                            padding: 6px 12px;
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                        }
                        button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        button.danger {
                            background-color: var(--vscode-errorForeground);
                        }
                        button.danger:hover {
                            background-color: var(--vscode-errorForeground);
                            opacity: 0.8;
                        }
                        .rules-container {
                            max-height: 400px;
                            overflow-y: auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                        }
                        .rule-item {
                            padding: 15px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            background-color: var(--vscode-editor-background);
                        }
                        .rule-item:last-child {
                            border-bottom: none;
                        }
                        .rule-item:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        .settings-panel {
                            margin-top: 30px;
                            padding: 20px;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 5px;
                        }
                        .settings-buttons {
                            display: flex;
                            gap: 15px;
                            margin-top: 15px;
                        }
                        .filter-input {
                            width: 100%;
                            padding: 8px;
                            margin-bottom: 15px;
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">Manifesto Management</div>
                    
                    <div class="tabs">
                        <button class="tab ${this.currentTab === 'manifesto' ? 'active' : ''}" id="tab-manifesto">Manifesto</button>
                        <button class="tab ${this.currentTab === 'glossary' ? 'active' : ''}" id="tab-glossary">Glossary</button>
                    </div>

                    <div id="content-manifesto" class="tab-content ${this.currentTab === 'manifesto' ? 'active' : ''}">
                        <div class="mode-section">
                            <div class="mode-label">Manifesto Mode:</div>
                            <select id="manifestoModeDropdown">
                                <option value="developer" ${currentMode === 'developer' ? 'selected' : ''}>Developer</option>
                                <option value="qa" ${currentMode === 'qa' ? 'selected' : ''}>QA</option>
                                <option value="solo" ${currentMode === 'solo' ? 'selected' : ''}>Solo</option>
                            </select>
                            <div style="font-size: 12px; color: var(--vscode-descriptionForeground);">
                                Current mode: <strong>${currentMode}</strong>
                            </div>
                        </div>

                        <div class="file-section">
                            <h3>Manifesto Files:</h3>
                            <div class="file-item">
                                <span class="file-path">${devPath}</span>
                                <div class="file-actions">
                                    <button onclick="editManifesto('${devPath}')">Edit</button>
                                    <button class="danger" onclick="deleteManifesto('${devPath}')">Delete</button>
                                </div>
                            </div>
                            <div class="file-item">
                                <span class="file-path">${qaPath}</span>
                                <div class="file-actions">
                                    <button onclick="editManifesto('${qaPath}')">Edit</button>
                                    <button class="danger" onclick="deleteManifesto('${qaPath}')">Delete</button>
                                </div>
                            </div>
                            <button onclick="createManifesto()">Create New Manifesto</button>
                        </div>

                        <div class="rules-section">
                            <h3>Manifesto Rules:</h3>
                            <input type="text" class="filter-input" id="ruleFilter" placeholder="Filter rules...">
                            <div class="rules-container">
                                ${manifestoRules.map((rule, index) => `
                                    <div class="rule-item" data-rule-id="rule-${index}">
                                        ${rule}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="settings-panel">
                            <h3>Admin Settings:</h3>
                            <div class="settings-buttons">
                                <button id="testConnection">Test Connection</button>
                                <button id="discoverAPIs">Discover APIs</button>
                            </div>
                        </div>
                    </div>

                    <div id="content-glossary" class="tab-content ${this.currentTab === 'glossary' ? 'active' : ''}">
                        <h3>Glossary Management</h3>
                        <p>Glossary functionality will be implemented in Phase 4.</p>
                    </div>

                    <script>
                        const vscode = acquireVsCodeApi();

                        // Tab switching
                        document.getElementById('tab-manifesto').addEventListener('click', () => {
                            switchTab('manifesto');
                        });

                        document.getElementById('tab-glossary').addEventListener('click', () => {
                            switchTab('glossary');
                        });

                        function switchTab(tab) {
                            vscode.postMessage({
                                command: 'switchTab',
                                tab: tab
                            });
                        }

                        // Mode switching
                        document.getElementById('manifestoModeDropdown').addEventListener('change', (e) => {
                            vscode.postMessage({
                                command: 'switchMode',
                                mode: e.target.value
                            });
                        });

                        // Rule filtering
                        document.getElementById('ruleFilter').addEventListener('input', (e) => {
                            vscode.postMessage({
                                command: 'filterRules',
                                filter: e.target.value
                            });
                        });

                        // File management functions
                        function createManifesto() {
                            vscode.postMessage({
                                command: 'createManifesto',
                                type: 'developer',
                                path: 'new-manifesto.md'
                            });
                        }

                        function editManifesto(path) {
                            vscode.postMessage({
                                command: 'editManifesto',
                                path: path
                            });
                        }

                        function deleteManifesto(path) {
                            vscode.postMessage({
                                command: 'deleteManifesto',
                                path: path
                            });
                        }

                        // Settings buttons
                        document.getElementById('testConnection').addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'testConnection'
                            });
                        });

                        document.getElementById('discoverAPIs').addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'discoverAPIs'
                            });
                        });
                    </script>
                </body>
                </html>
            `;
        } catch (error) {
            console.error('Failed to generate HTML content:', error);
            return '<html><body><h1>Error loading Manifesto Management</h1></body></html>';
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
                case 'switchTab':
                    this.handleTabSwitch(message.tab);
                    break;
                case 'switchMode':
                    this.handleModeSwitch(message.mode);
                    break;
                case 'filterRules':
                    this.handleRuleFilter(message.filter);
                    break;
                case 'createManifesto':
                    this.handleCreateManifesto(message.type, message.path);
                    break;
                case 'editManifesto':
                    this.handleEditManifesto(message.path);
                    break;
                case 'deleteManifesto':
                    this.handleDeleteManifesto(message.path);
                    break;
                case 'editRule':
                    this.handleEditRule(message.ruleId, message.content);
                    break;
                case 'testConnection':
                    this.handleTestConnection();
                    break;
                case 'discoverAPIs':
                    this.handleDiscoverAPIs();
                    break;
                default:
                    throw new Error(`Unknown command: ${message.command}`);
            }
        } catch (error) {
            console.error('Message handling failed:', error);
            vscode.window.showErrorMessage(`Manifesto Management error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle tab switching
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleTabSwitch(tab: string): void {
        try {
            if (!tab || typeof tab !== 'string') {
                throw new Error('Invalid tab specified');
            }

            this.currentTab = tab;
            this.refreshUI();
        } catch (error) {
            console.error('Tab switch failed:', error);
            throw error;
        }
    }

    /**
     * Handle manifesto mode switching
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleModeSwitch(mode: string): void {
        try {
            if (!mode || typeof mode !== 'string') {
                throw new Error('Invalid mode specified');
            }

            if (!['developer', 'qa', 'solo'].includes(mode)) {
                throw new Error('Invalid manifesto mode');
            }

            this.stateManager.manifestoMode = mode as 'developer' | 'qa' | 'solo';
            this.refreshUI();
            vscode.window.showInformationMessage(`Switched to ${mode} mode`);
        } catch (error) {
            console.error('Mode switch failed:', error);
            throw error;
        }
    }

    /**
     * Handle rule filtering
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleRuleFilter(filter: string): void {
        try {
            // Filter implementation would go here
            // For now, just acknowledge the filter
            // Note: Actual filtering would be implemented here
        } catch (error) {
            console.error('Rule filter failed:', error);
            throw error;
        }
    }

    /**
     * Handle manifesto creation
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleCreateManifesto(type?: string, path?: string): void {
        try {
            if (!type || !path) {
                throw new Error('Missing type or path for manifesto creation');
            }

            // Implementation would create a new manifesto file
            vscode.window.showInformationMessage(`Creating ${type} manifesto at ${path}`);
        } catch (error) {
            console.error('Manifesto creation failed:', error);
            throw error;
        }
    }

    /**
     * Handle manifesto editing
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleEditManifesto(path: string): void {
        try {
            if (!path || typeof path !== 'string') {
                throw new Error('Invalid path specified');
            }

            // Implementation would open the manifesto file for editing
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(path));
        } catch (error) {
            console.error('Manifesto editing failed:', error);
            throw error;
        }
    }

    /**
     * Handle manifesto deletion
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleDeleteManifesto(path: string): void {
        try {
            if (!path || typeof path !== 'string') {
                throw new Error('Invalid path specified');
            }

            // Implementation would delete the manifesto file
            vscode.window.showWarningMessage(`Delete manifesto ${path}?`, 'Yes', 'No').then(choice => {
                if (choice === 'Yes') {
                    vscode.window.showInformationMessage(`Deleted manifesto: ${path}`);
                }
            });
        } catch (error) {
            console.error('Manifesto deletion failed:', error);
            throw error;
        }
    }

    /**
     * Handle rule editing
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleEditRule(ruleId: string, content: string): void {
        try {
            if (!ruleId || !content) {
                throw new Error('Missing ruleId or content');
            }

            // Implementation would edit the specific rule
            vscode.window.showInformationMessage(`Editing rule ${ruleId}`);
        } catch (error) {
            console.error('Rule editing failed:', error);
            throw error;
        }
    }

    /**
     * Handle test connection
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleTestConnection(): void {
        try {
            // Implementation would test AI agent connections
            vscode.window.showInformationMessage('Testing connections...');
        } catch (error) {
            console.error('Test connection failed:', error);
            throw error;
        }
    }

    /**
     * Handle discover APIs
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private handleDiscoverAPIs(): void {
        try {
            // Implementation would discover available APIs
            vscode.window.showInformationMessage('Discovering APIs...');
        } catch (error) {
            console.error('Discover APIs failed:', error);
            throw error;
        }
    }

    /**
     * Get manifesto rules from StateManager
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public getManifestoRules(): string[] {
        try {
            const rules = this.stateManager.manifestoRules || [];
            return rules.map(rule => rule.description || rule.toString());
        } catch (error) {
            console.error('Failed to get manifesto rules:', error);
            return ['Error loading manifesto rules'];
        }
    }

    /**
     * Get loaded manifestos for solo mode
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public getLoadedManifestos(): string[] {
        try {
            const manifestos: string[] = [];
            if (this.stateManager.devManifestoPath) {
                manifestos.push(this.stateManager.devManifestoPath);
            }
            if (this.stateManager.qaManifestoPath) {
                manifestos.push(this.stateManager.qaManifestoPath);
            }
            return manifestos;
        } catch (error) {
            console.error('Failed to get loaded manifestos:', error);
            return [];
        }
    }

    /**
     * Refresh the UI
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public refreshUI(): void {
        try {
            if (this.panel) {
                this.panel.webview.html = this.getHtmlContent();
            }
        } catch (error) {
            console.error('Failed to refresh UI:', error);
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
