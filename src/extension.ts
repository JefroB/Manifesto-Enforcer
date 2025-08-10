import * as vscode from 'vscode';
import { StateManager } from './core/StateManager';
import { InteractiveDiffProvider } from './view/InteractiveDiffProvider';
import { ManifestoTreeDataProvider } from './view/ManifestoTreeDataProvider';
import { GlossaryTreeDataProvider } from './view/GlossaryTreeDataProvider';
import { ManifestoDiagnosticsProvider } from './diagnostics/ManifestoDiagnosticsProvider';
import { PiggieActionsProvider } from './view/PiggieActionsProvider';
import { SecurityReviewProvider } from './view/SecurityReviewProvider';
import { ManifestoRulesProvider } from './view/ManifestoRulesProvider';
import { ManifestoCodeActionProvider } from './diagnostics/ManifestoCodeActionProvider';
import { ChatCommandManager } from './commands';
import { AgentManager } from './agents/AgentManager';
import { AuggieAdapter } from './agents/adapters/AuggieAdapter';
import { AgentConfig, AgentProvider } from './core/types';

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🐷 Piggie extension is now active!');

    try {
        // Initialize StateManager singleton first
        const stateManager = StateManager.getInstance(context);

        // Index manifesto for token efficiency
        indexManifesto(stateManager);

        // Initialize providers as local constants (StateManager should only manage data, not service instances)
        const diffProvider = new InteractiveDiffProvider(context, stateManager);
        const manifestoTreeProvider = new ManifestoTreeDataProvider(stateManager);
        const glossaryTreeProvider = new GlossaryTreeDataProvider(context, stateManager);
        const piggieActionsProvider = new PiggieActionsProvider();
        const securityReviewProvider = new SecurityReviewProvider();
        const manifestoRulesProvider = new ManifestoRulesProvider(stateManager);
        const diagnosticsProvider = new ManifestoDiagnosticsProvider(stateManager);
        const codeActionProvider = new ManifestoCodeActionProvider(stateManager);

        // Providers are now managed locally in activate function scope

        // Register tree data providers
        context.subscriptions.push(
            vscode.window.registerTreeDataProvider('manifestoView', manifestoTreeProvider),
            vscode.window.registerTreeDataProvider('glossaryView', glossaryTreeProvider),
            vscode.window.registerTreeDataProvider('piggieActions', piggieActionsProvider),
            vscode.window.registerTreeDataProvider('piggieSecurityReview', securityReviewProvider),
            vscode.window.registerTreeDataProvider('manifestoRules', manifestoRulesProvider)
        );

        // Register diagnostic and code action providers
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                { scheme: 'file', language: '*' },
                codeActionProvider,
                {
                    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.SourceFixAll]
                }
            )
        );

        // Initialize diagnostics provider (it manages its own diagnostics collection)
        // The diagnostics provider is automatically activated through its constructor
        // Store reference for proper disposal
        context.subscriptions.push({
            dispose: () => diagnosticsProvider.dispose()
        });

        // Register chat provider with context for persistence
        const provider = new PiggieChatProvider(context.extensionUri, context, stateManager);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('piggieChatPanel', provider)
        );

        // Register all commands
        context.subscriptions.push(
            vscode.commands.registerCommand('manifestoEnforcer.toggleManifestoMode', () => {
                stateManager.isManifestoMode = !stateManager.isManifestoMode;
                vscode.window.showInformationMessage(`🛡️ Manifesto Mode: ${stateManager.isManifestoMode ? 'ON' : 'OFF'}`);
            }),

            vscode.commands.registerCommand('manifestoEnforcer.switchAgent', async () => {
                const agents = ['Auggie', 'Amazon Q', 'Cline'];
                const selected = await vscode.window.showQuickPick(agents, {
                    placeHolder: 'Select AI Agent for Piggie'
                });
                if (selected) {
                    stateManager.currentAgent = selected;
                    vscode.window.showInformationMessage(`🐷 Piggie is now using: ${selected}`);
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.quickChat', async () => {
                const input = await vscode.window.showInputBox({
                    placeHolder: 'Ask Piggie anything...',
                    prompt: 'Quick chat with Piggie'
                });
                if (input) {
                    vscode.commands.executeCommand('piggieChatPanel.focus');
                    // Send message to chat panel
                    provider.handleQuickMessage(input);
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.writeCode', async () => {
                const input = await vscode.window.showInputBox({
                    placeHolder: 'Describe what code you want Piggie to write...',
                    prompt: 'Piggie: Write Code'
                });
                if (input) {
                    vscode.commands.executeCommand('piggieChatPanel.focus');
                    provider.handleQuickMessage(`Write code: ${input}`);
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.openChat', () => {
                vscode.commands.executeCommand('piggieChatPanel.focus');
            }),

            vscode.commands.registerCommand('manifestoEnforcer.validateCompliance', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const text = editor.document.getText();
                    vscode.commands.executeCommand('piggieChatPanel.focus');
                    provider.handleQuickMessage(`Validate manifesto compliance for this code: ${text.substring(0, 500)}...`);
                } else {
                    vscode.window.showWarningMessage('No active editor to validate');
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.createManifesto', async () => {
                const input = await vscode.window.showInputBox({
                    placeHolder: 'Describe your project to create a manifesto...',
                    prompt: 'Create New Manifesto'
                });
                if (input) {
                    vscode.commands.executeCommand('piggieChatPanel.focus');
                    provider.handleQuickMessage(`Create a manifesto for: ${input}`);
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.openSettings', () => {
                vscode.commands.executeCommand('workbench.action.openSettings', 'manifestoEnforcer');
            }),

            vscode.commands.registerCommand('manifestoEnforcer.testConnection', async () => {
                try {
                    vscode.window.showInformationMessage('🔧 Testing Piggie connection...');
                    // Test the current agent connection
                    const testMessage = 'Hello, this is a connection test.';
                    provider.handleQuickMessage(testMessage);
                    vscode.window.showInformationMessage('✅ Piggie connection test sent');
                } catch (error) {
                    vscode.window.showErrorMessage(`❌ Connection test failed: ${error}`);
                }
            }),

            vscode.commands.registerCommand('piggie.discoverAPIs', async () => {
                vscode.commands.executeCommand('piggieChatPanel.focus');
                provider.handleQuickMessage('Discover and analyze available AI agent APIs in this workspace');
            }),

            vscode.commands.registerCommand('manifestoEnforcer.reviewSelectedCode', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.selection) {
                    const selectedText = editor.document.getText(editor.selection);
                    if (selectedText) {
                        vscode.commands.executeCommand('piggieChatPanel.focus');
                        provider.handleQuickMessage(`Review this code for security and compliance: ${selectedText}`);
                    } else {
                        vscode.window.showWarningMessage('No code selected');
                    }
                } else {
                    vscode.window.showWarningMessage('No active editor or selection');
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.refactorSelectedCode', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.selection) {
                    const selectedText = editor.document.getText(editor.selection);
                    if (selectedText) {
                        vscode.commands.executeCommand('piggieChatPanel.focus');
                        provider.handleQuickMessage(`Refactor this code following manifesto guidelines: ${selectedText}`);
                    } else {
                        vscode.window.showWarningMessage('No code selected');
                    }
                } else {
                    vscode.window.showWarningMessage('No active editor or selection');
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.explainSelectedCode', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.selection) {
                    const selectedText = editor.document.getText(editor.selection);
                    if (selectedText) {
                        vscode.commands.executeCommand('piggieChatPanel.focus');
                        provider.handleQuickMessage(`Explain this code: ${selectedText}`);
                    } else {
                        vscode.window.showWarningMessage('No code selected');
                    }
                } else {
                    vscode.window.showWarningMessage('No active editor or selection');
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.sendToAmazonQ', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.selection) {
                    const selectedText = editor.document.getText(editor.selection);
                    if (selectedText) {
                        stateManager.currentAgent = 'Amazon Q';
                        vscode.commands.executeCommand('piggieChatPanel.focus');
                        provider.handleQuickMessage(`[Amazon Q Enhanced] ${selectedText}`);
                    } else {
                        vscode.window.showWarningMessage('No code selected');
                    }
                } else {
                    vscode.window.showWarningMessage('No active editor or selection');
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.refreshManifesto', () => {
                // Reload manifesto by re-indexing it
                indexManifesto(stateManager);
                vscode.window.showInformationMessage('📋 Manifesto refreshed');
            }),

            vscode.commands.registerCommand('manifestoEnforcer.refreshGlossary', () => {
                stateManager.loadGlossaryFromStorage();
                vscode.window.showInformationMessage('📖 Glossary refreshed');
            }),

            vscode.commands.registerCommand('manifestoEnforcer.addGlossaryTermFromTree', async () => {
                try {
                    vscode.commands.executeCommand('piggieChatPanel.focus');
                    provider.showGlossaryPanel();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to show glossary panel: ${error}`);
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.removeGlossaryTerm', async () => {
                try {
                    const terms = Array.from(stateManager.projectGlossary.keys());
                    if (terms.length === 0) {
                        vscode.window.showInformationMessage('No glossary terms to remove');
                        return;
                    }
                    const selected = await vscode.window.showQuickPick(terms, {
                        placeHolder: 'Select term to remove'
                    });
                    if (selected) {
                        stateManager.projectGlossary.delete(selected);
                        await stateManager.saveGlossaryToStorage();
                        vscode.window.showInformationMessage(`Removed term: ${selected}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to remove term: ${error}`);
                }
            })
        );

        // Load saved codebase index on startup
        stateManager.loadCodebaseIndex().then((loaded: boolean) => {
            if (loaded) {
                stateManager.isCodebaseIndexed = true;
            }
        });

        // Load saved glossary on startup
        stateManager.loadGlossaryFromStorage().then(() => {
            // Loaded message is already logged in StateManager
        });

        // Setup file change detection for auto re-indexing
        setupFileChangeDetection(stateManager);

        console.log('🐷 Piggie extension activated successfully');

    } catch (error) {
        console.error('🐷 Extension activation failed:', error);
        vscode.window.showErrorMessage('Failed to activate Manifesto Enforcer: ' + error);
    }
}

/**
 * Extension deactivation
 */
export function deactivate() {
    console.log('🐷 Piggie extension is now deactivated');
}

/**
 * Index manifesto rules for efficient token usage
 */
function indexManifesto(stateManager: StateManager): void {
    try {
        // Basic manifesto rules - can be expanded
        const manifestoRules = [
            {
                id: 'error-handling',
                title: 'Comprehensive Error Handling',
                description: 'All functions must include proper error handling with try-catch blocks',
                category: 'reliability'
            },
            {
                id: 'input-validation',
                title: 'Input Validation',
                description: 'All inputs must be validated before processing',
                category: 'security'
            },
            {
                id: 'documentation',
                title: 'Code Documentation',
                description: 'All public functions and classes must be documented',
                category: 'maintainability'
            }
        ];

        stateManager.manifestoRules = manifestoRules;
        console.log('📋 Manifesto rules indexed successfully');
    } catch (error) {
        console.error('Failed to index manifesto:', error);
    }
}



/**
 * Setup file change detection for auto re-indexing
 */
function setupFileChangeDetection(stateManager: StateManager): void {
    try {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h}');
        
        watcher.onDidChange(() => {
            if (stateManager.isCodebaseIndexed) {
                console.log('🔄 File changed, marking index as stale');
                // Could trigger re-indexing here if desired
            }
        });

        watcher.onDidCreate(() => {
            if (stateManager.isCodebaseIndexed) {
                console.log('📄 New file created, marking index as stale');
            }
        });

        watcher.onDidDelete(() => {
            if (stateManager.isCodebaseIndexed) {
                console.log('🗑️ File deleted, marking index as stale');
            }
        });
    } catch (error) {
        console.error('Failed to setup file change detection:', error);
    }
}



// The old generateManifestoCompliantResponse function has been replaced by the ChatCommandManager
// All command logic is now handled by individual command classes in the src/commands/ directory

// Q-optimized response generation is now handled by individual commands
// Each command can implement its own optimization logic as needed





/**
 * Simple chat provider for the codebase indexing system
 * Now uses the Command Pattern via ChatCommandManager
 */
class PiggieChatProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'piggieChatPanel';
    private _view?: vscode.WebviewView;
    private stateManager: StateManager;
    private commandManager: ChatCommandManager;
    private agentManager: AgentManager;

    constructor(private readonly _extensionUri: vscode.Uri, context?: vscode.ExtensionContext, stateManager?: StateManager) {
        this.stateManager = stateManager || StateManager.getInstance(context);
        this.commandManager = new ChatCommandManager();
        this.agentManager = new AgentManager();
        this.initializeAgents();
    }

    private async initializeAgents(): Promise<void> {
        try {
            const auggieConfig: AgentConfig = {
                id: 'auggie-default',
                name: 'Auggie',
                provider: AgentProvider.AUGGIE,
                isEnabled: true,
            };
            const auggieAdapter = new AuggieAdapter(auggieConfig);
            await this.agentManager.registerAgent(auggieAdapter);
            console.log('🐷 Auggie agent registered successfully.');
        } catch (error) {
            console.error('🐷 Failed to initialize agents:', error);
            vscode.window.showErrorMessage('Piggie failed to connect to its AI agents.');
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            try {
                switch (data.command) {
                    case 'sendMessage':
                        await this.handleUserMessage(data.text);
                        break;
                    case 'indexCodebase':
                        // CRITICAL: Use handleCodebaseIndexing for proper button state management
                        await this.handleCodebaseIndexing();
                        break;
                    case 'newSession':
                        // Start a new chat session - clear any session state
                        console.log('🐷 Starting new chat session');
                        this.stateManager.clearConversationHistory();
                        break;
                    case 'changeSetting':
                        // Handle specific setting changes with proper validation
                        switch (data.key) {
                            case 'isManifestoMode':
                                this.stateManager.isManifestoMode = data.value;
                                console.log(`🛡️ Manifesto Mode: ${data.value ? 'ON' : 'OFF'}`);
                                break;
                            case 'isAgentMode':
                                this.stateManager.isAgentMode = data.value;
                                console.log(`🤖 Agent Mode: ${data.value ? 'ON' : 'OFF'}`);
                                break;
                            case 'currentAgent':
                                this.stateManager.currentAgent = data.value;
                                console.log(`🐷 Piggie using: ${data.value}`);
                                break;
                            case 'isAutoMode':
                                this.stateManager.isAutoMode = data.value;
                                console.log(`⚡ Auto Mode: ${data.value ? 'ON' : 'OFF'}`);
                                break;
                            default:
                                console.warn(`Unknown setting: ${data.key}`);
                        }
                        break;
                }
            } catch (error) {
                this.sendResponse('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
            }
        });

        // Initialize status and restore chat history
        this.updateIndexStatus();
        this.restoreChatHistory();
    }

    private async handleCodebaseIndexing(): Promise<void> {
        try {
            // CRITICAL: Disable button immediately to prevent spam
            this.setIndexButtonState(false, '⏳ Indexing...');

            this.sendResponse('📚 Starting codebase indexing...');

            const result = await this.stateManager.startIndexing();
            this.sendResponse(result.message);
            this.updateIndexStatus();

        } catch (error) {
            console.error('Indexing failed:', error);
            this.sendResponse('❌ Failed to index codebase: ' + (error instanceof Error ? error.message : String(error)));
            this.updateIndexStatus();
        } finally {
            // MANDATORY: Always re-enable button when done
            this.setIndexButtonState(true, this.stateManager.isCodebaseIndexed ? '🔄 Re-index' : '📚 Index Codebase');
        }
    }

    private async handleUserMessage(message: string): Promise<void> {
        try {
            // CRITICAL INFRASTRUCTURE: Validate system health before processing
            const healthCheck = this.validateInfrastructure();
            if (!healthCheck.isHealthy) {
                console.warn('Infrastructure issues detected:', healthCheck.issues);
                // Still process the message but log the issues
            }

            // Add user message to conversation history
            const userMessage: any = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: message,
                timestamp: new Date()
            };
            this.stateManager.addToConversationHistory(userMessage);

            // Use the ChatCommandManager instead of the old if/else if block
            const response = await this.commandManager.handleMessage(message, this.stateManager, this.agentManager);

            // Add assistant response to conversation history
            const assistantMessage: any = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            this.stateManager.addToConversationHistory(assistantMessage);

            this.sendResponse(response);
        } catch (error) {
            this.sendResponse('🐷 Error: ' + error);
        }
    }

    private sendResponse(content: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'addMessage',
                content: content
            });
        }
    }

    public handleQuickMessage(message: string): void {
        // Add the user message to the chat
        if (this._view) {
            this._view.webview.postMessage({
                command: 'addMessage',
                role: 'user',
                content: message
            });
        }
        // Process the message through the normal flow
        this.handleUserMessage(message);
    }

    public showGlossaryPanel(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'showGlossaryPanel'
            });
        }
    }

    private updateIndexStatus(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateIndexStatus',
                isIndexed: this.stateManager.isCodebaseIndexed,
                fileCount: this.stateManager.codebaseIndex.size
            });
        }
    }

    /**
     * Restore chat history when webview reloads
     * CRITICAL: Smart caching to maintain conversation context
     */
    private restoreChatHistory(): void {
        if (!this._view) {
            return;
        }

        try {
            // Get conversation history from StateManager
            const history = this.stateManager.getConversationHistory();

            if (history && history.length > 0) {
                console.log(`🧠 Restoring ${history.length} chat messages`);

                // Send each message to rebuild the chat UI
                for (const message of history) {
                    this._view.webview.postMessage({
                        command: 'restoreMessage',
                        role: message.role,
                        content: message.content,
                        timestamp: message.timestamp
                    });
                }

                // Send a separator to show this is restored content
                this._view.webview.postMessage({
                    command: 'addMessage',
                    content: '--- Chat History Restored ---',
                    role: 'system'
                });
            } else {
                // Send welcome message with CURRENT state (not cached)
                const currentStats = this.stateManager.getIndexingStats();
                const welcomeMessage = this.generateSmartWelcomeMessage(currentStats);

                this._view.webview.postMessage({
                    command: 'addMessage',
                    content: welcomeMessage,
                    role: 'assistant'
                });

                // CRITICAL INFRASTRUCTURE: Show health warnings if needed
                if (currentStats.healthStatus !== 'healthy' && currentStats.healthMessage) {
                    this._view.webview.postMessage({
                        command: 'addMessage',
                        content: `🏥 **Infrastructure Health**: ${currentStats.healthMessage}`,
                        role: 'system'
                    });
                }
            }

        } catch (error) {
            console.error('Failed to restore chat history:', error);
        }
    }

    /**
     * Generate smart welcome message with CURRENT state
     * CRITICAL INFRASTRUCTURE: Shows accurate current state, not stale data
     */
    private generateSmartWelcomeMessage(stats: any): string {
        let message = '🐷 Piggie here! ';

        // CRITICAL: Always show real-time state
        const currentFileCount = this.stateManager.codebaseIndex.size;
        const isCurrentlyIndexed = this.stateManager.isCodebaseIndexed;

        if (isCurrentlyIndexed && currentFileCount > 0) {
            message += `I have indexed ${currentFileCount} files from your codebase`;

            // Show additional context if available
            if (stats.lastResults && stats.lastResults.errors > 0) {
                message += ` (${stats.lastResults.errors} files had errors)`;
            }

            message += ' and can provide intelligent assistance.';

            // CRITICAL: Warn if file count seems wrong
            if (currentFileCount > 200) {
                message += `\n\n⚠️ **WARNING**: File count (${currentFileCount}) seems unusually high. This may indicate indexing issues.`;
            }
        } else {
            message += 'Ready to help! Click "📚 Index Codebase" to enable intelligent code assistance.';
        }

        message += '\n\n🛡️ Manifesto Mode is active - I\'ll ensure all suggestions follow best practices.\n\n';
        message += '**Available Commands:**\n';
        message += '• **Code Generation:** "Create a UserService class", "Generate hello world"\n';
        message += '• **Editing:** "Edit UserService.ts", "Modify the login function"\n';
        message += '• **Linting:** "/lint", "Check code quality", "Fix errors in MyFile.ts"\n';
        message += '• **Code Analysis:** "/graph", "Show references for MyClass", "Analyze impact"\n';
        message += '• **Glossary:** "Define API as Application Programming Interface", "What does JWT mean?"\n';
        message += '• **Cleanup:** "/cleanup", "Clean repository", "Cleanup backups"\n\n';
        message += 'How can I help with your development needs?';

        return message;
    }

    /**
     * Validate critical infrastructure state
     * CRITICAL INFRASTRUCTURE: Ensure chat and indexing state is healthy
     */
    private validateInfrastructure(): { isHealthy: boolean; issues: string[] } {
        const issues: string[] = [];

        // Check StateManager health
        if (!this.stateManager) {
            issues.push('CRITICAL: StateManager not initialized');
        }

        // Check indexing health
        const stats = this.stateManager?.getIndexingStats();
        if (stats) {
            if (stats.healthStatus === 'error') {
                issues.push(`INDEXING ERROR: ${stats.healthMessage}`);
            } else if (stats.healthStatus === 'warning') {
                issues.push(`INDEXING WARNING: ${stats.healthMessage}`);
            }
        }

        // Check conversation history integrity
        const history = this.stateManager?.getConversationHistory();
        if (history && history.length > 100) {
            issues.push('WARNING: Conversation history very large - may impact performance');
        }

        return {
            isHealthy: issues.length === 0,
            issues: issues
        };
    }

    /**
     * Set index button state (enabled/disabled) and text
     * MANDATORY: Prevent button spam during indexing
     */
    private setIndexButtonState(enabled: boolean, text: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'setIndexButtonState',
                enabled: enabled,
                text: text
            });
        }
    }

    private _getHtmlForWebview(_webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Piggie Chat</title>
            <style>
                body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 0; overflow: hidden; }
                .chat-container { height: 100vh; display: flex; flex-direction: column; }

                /* Top toolbar */
                .top-toolbar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-sideBar-border); z-index: 10; flex-shrink: 0; }
                .toolbar-button { padding: 6px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; transition: background-color 0.2s, opacity 0.2s; }
                .toolbar-button:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
                .toolbar-button:disabled { opacity: 0.6; cursor: not-allowed; background: var(--vscode-button-secondaryBackground); }
                .status-indicator { font-size: 11px; color: var(--vscode-descriptionForeground); }

                /* Messages area */
                .messages { flex-grow: 1; overflow-y: auto; padding: 12px; }
                .message { padding: 10px 12px; border-radius: 6px; margin: 8px 0; word-wrap: break-word; line-height: 1.4; }
                .user-message { background: var(--vscode-inputValidation-infoBackground); border-left: 3px solid var(--vscode-inputValidation-infoBorder); margin-left: 20px; }
                .ai-message { background: var(--vscode-textBlockQuote-background); border-left: 3px solid var(--vscode-charts-blue); }
                .system-message { background: var(--vscode-badge-background); border-left: 3px solid var(--vscode-badge-foreground); color: var(--vscode-badge-foreground); font-style: italic; text-align: center; opacity: 0.8; margin: 4px 0; }
                .error { background: var(--vscode-inputValidation-errorBackground); border-left: 3px solid var(--vscode-inputValidation-errorBorder); color: var(--vscode-inputValidation-errorForeground); }

                /* Message content formatting */
                .message strong { font-weight: bold; color: var(--vscode-foreground); }
                .message ul { margin: 8px 0; padding-left: 20px; }
                .message li { margin: 2px 0; }
                .message pre { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 12px; margin: 8px 0; overflow-x: auto; }
                .message code { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 2px 4px; font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
                .message pre code { background: none; border: none; padding: 0; }

                /* Input section */
                .input-section { display: flex; flex-direction: column; height: 120px; min-height: 120px; max-height: 400px; background: var(--vscode-sideBar-background); border-top: 1px solid var(--vscode-sideBar-border); flex-shrink: 0; }
                .resize-handle { height: 3px; background: var(--vscode-input-border, #5a5a5a); cursor: ns-resize; user-select: none; opacity: 0.5; flex-shrink: 0; }
                .resize-handle:hover { opacity: 1; background: var(--vscode-focusBorder, #0e639c); }
                .input-container { display: flex; flex-direction: column; gap: 8px; padding: 12px; flex-grow: 1; min-height: 0; }
                .mode-controls { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
                .mode-select { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); border-radius: 3px; padding: 4px 8px; font-size: 11px; min-width: 100px; }
                .auto-toggle { display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 11px; color: var(--vscode-foreground); user-select: none; }
                .auto-toggle input[type="checkbox"] { margin: 0; }
                .textarea-row { display: flex; gap: 8px; align-items: stretch; flex-grow: 1; min-height: 0; }
                .textarea-container { flex: 1; display: flex; min-width: 0; }
                .message-input { flex: 1; padding: 8px 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; resize: none; font-family: inherit; font-size: inherit; box-sizing: border-box; }
                .send-button { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; white-space: nowrap; flex-shrink: 0; }
                .send-button:hover { background: var(--vscode-button-hoverBackground); }

                /* Hidden glossary panel */
                .glossary-panel { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; min-width: 300px; }
                .glossary-header { font-weight: bold; margin-bottom: 12px; color: var(--vscode-foreground); }
                .glossary-input { display: flex; gap: 8px; align-items: center; }
                .glossary-input input { flex: 1; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; font-size: 12px; }
                .glossary-add-btn { padding: 6px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
                .glossary-close-btn { padding: 6px 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <!-- Top toolbar - clean and minimal -->
                <div class="top-toolbar">
                    <button id="indexButton" class="toolbar-button">📚 Index Codebase</button>
                    <button id="clearChatButton" class="toolbar-button">🗑️ Clear Chat</button>
                    <span id="indexStatus" class="status-indicator">Not indexed</span>
                </div>

                <!-- Messages area -->
                <div id="messages" class="messages">
                    <div class="message ai-message">🐷 Hi, I'm Piggie! Your Security and Compliance Enforcement Agent. I piggyback on top of your AI development agents, making your code more reliable and secure. Oink Oink!</div>
                </div>

                <!-- Hidden glossary panel (accessed via commands) -->
                <div id="glossaryPanel" class="glossary-panel" style="display: none;">
                    <div class="glossary-header">📖 Add Glossary Term</div>
                    <div class="glossary-input">
                        <input type="text" id="termInput" placeholder="Term/Acronym"/>
                        <input type="text" id="definitionInput" placeholder="Definition"/>
                        <button id="addTermButton" class="glossary-add-btn">Add</button>
                        <button id="closeGlossaryBtn" class="glossary-close-btn">✕</button>
                    </div>
                </div>

                <!-- Input section with controls -->
                <div class="input-section" id="inputSection">
                    <!-- Drag handle INSIDE the input section -->
                    <div class="resize-handle" id="resizeHandle"></div>
                    <!-- Text input area -->
                    <div class="input-container">
                        <!-- Mode controls above input -->
                        <div class="mode-controls">
                            <select id="manifestoDropdown" class="mode-select">
                                <option value="manifesto">🛡️ Manifesto Mode</option>
                                <option value="free">🔓 Free Mode</option>
                            </select>
                            <select id="modeDropdown" class="mode-select">
                                <option value="chat">💬 Chat</option>
                                <option value="agent">🤖 Agent</option>
                            </select>
                            <select id="agentDropdown" class="mode-select">
                                <option value="auggie">🤖 Auggie</option>
                                <option value="amazonq">🟠 Amazon Q</option>
                                <option value="cline">🔵 Cline</option>
                            </select>
                            <label class="auto-toggle">
                                <input type="checkbox" id="autoToggle" />
                                ⚡ Auto
                            </label>
                        </div>
                        <!-- Textarea and buttons row -->
                        <div class="textarea-row">
                            <div class="textarea-container">
                                <textarea id="messageInput" class="message-input" placeholder="Ask Piggie anything..." rows="1"></textarea>
                            </div>
                            <button id="sendButton" class="send-button">Send</button>
                            <button id="stopButton" class="send-button" style="display: none; background: var(--vscode-errorForeground);">Stop</button>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                // DOM Elements
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const messagesDiv = document.getElementById('messages');
                const indexButton = document.getElementById('indexButton');
                const clearChatButton = document.getElementById('clearChatButton');
                const indexStatus = document.getElementById('indexStatus');
                const manifestoDropdown = document.getElementById('manifestoDropdown');
                const modeDropdown = document.getElementById('modeDropdown');
                const agentDropdown = document.getElementById('agentDropdown');
                const autoToggle = document.getElementById('autoToggle');
                const glossaryPanel = document.getElementById('glossaryPanel');
                const addTermButton = document.getElementById('addTermButton');
                const closeGlossaryBtn = document.getElementById('closeGlossaryBtn');
                // resizeHandle moved to drag functionality section

                // Event Listeners
                sendButton.addEventListener('click', () => sendMessage());
                messageInput.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                indexButton.addEventListener('click', () => {
                    // CRITICAL: Prevent spam clicking
                    if (indexButton.disabled) {
                        return;
                    }
                    vscode.postMessage({ command: 'indexCodebase' });
                });

                clearChatButton.addEventListener('click', () => {
                    // Clear the chat messages
                    messagesDiv.innerHTML = '<div class="message ai-message">🐷 New session started! Hi, I\\'m Piggie! Your Security and Compliance Enforcement Agent. I piggyback on top of your AI development agents, making your code more reliable and secure. Oink Oink!</div>';

                    // Clear the input
                    messageInput.value = '';

                    // Send command to backend to start new session
                    vscode.postMessage({ command: 'newSession' });
                });

                manifestoDropdown.addEventListener('change', e => {
                    vscode.postMessage({ command: 'changeSetting', key: 'isManifestoMode', value: e.target.value === 'manifesto' });
                });
                modeDropdown.addEventListener('change', e => {
                    vscode.postMessage({ command: 'changeSetting', key: 'isAgentMode', value: e.target.value === 'agent' });
                });
                agentDropdown.addEventListener('change', e => {
                    vscode.postMessage({ command: 'changeSetting', key: 'currentAgent', value: e.target.value });
                });

                autoToggle.addEventListener('change', e => {
                    vscode.postMessage({ command: 'changeSetting', key: 'isAutoMode', value: e.target.checked });
                });

                // Glossary panel controls
                addTermButton.addEventListener('click', () => {
                    const term = document.getElementById('termInput').value.trim();
                    const definition = document.getElementById('definitionInput').value.trim();
                    if (term && definition) {
                        // Use a natural language command that the GlossaryCommand can handle
                        sendMessage(\`Define \${term} as \${definition}\`);
                        document.getElementById('termInput').value = '';
                        document.getElementById('definitionInput').value = '';
                        glossaryPanel.style.display = 'none';
                    }
                });

                closeGlossaryBtn.addEventListener('click', () => {
                    glossaryPanel.style.display = 'none';
                });



                function sendMessage(textOverride) {
                    const text = textOverride || messageInput.value.trim();
                    if (text) {
                        addMessage('user-message', '👤 You: ' + text);
                        vscode.postMessage({ command: 'sendMessage', text: text });
                        if (!textOverride) {
                            messageInput.value = '';
                        }
                    }
                }

                function addMessage(className, content) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + className;

                    // Format the content properly
                    const formattedContent = formatMessageContent(content);
                    messageDiv.innerHTML = formattedContent;

                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                function formatMessageContent(content) {
                    let formatted = content
                        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                        .replace(/^• (.*$)/gm, '<li>$1</li>')
                        .replace(/\\\`\\\`\\\`(\\w+)?\\n([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre><code class="language-$1">$2</code></pre>')
                        .replace(/\\\`([^\\\`]+)\\\`/g, '<code>$1</code>')
                        .replace(/\\n/g, '<br>');

                    if (formatted.includes('<li>')) {
                        formatted = formatted.replace(/<\\/li><br><li>/g, '</li><li>');
                        const liBlock = formatted.match(/(<li>.*<\\/li>)/s);
                        if (liBlock) {
                            const wrapped = '<ul>' + liBlock[0] + '</ul>';
                            formatted = formatted.replace(liBlock[0], wrapped);
                        }
                    }
                    return formatted;
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'addMessage':
                            const prefix = message.role === 'error' ? '❌ Error: ' :
                                          message.role === 'system' ? '📋 System: ' : '🐷 Piggie: ';
                            const className = message.role === 'error' ? 'error' :
                                            message.role === 'system' ? 'system-message' : 'ai-message';
                            addMessage(className, prefix + message.content);
                            break;
                        case 'restoreMessage':
                            // Restore chat history messages with original formatting
                            const rolePrefix = message.role === 'user' ? '👤 You: ' : '🐷 Piggie: ';
                            const roleClass = message.role === 'user' ? 'user-message' : 'ai-message';
                            addMessage(roleClass, rolePrefix + message.content);
                            break;
                        case 'syncState':
                            updateUI(message.state);
                            break;
                        case 'showGlossaryPanel':
                            glossaryPanel.style.display = 'block';
                            document.getElementById('termInput').focus();
                            break;
                        case 'updateIndexStatus':
                            updateIndexStatusUI(message.isIndexed, message.fileCount);
                            break;
                        case 'setIndexButtonState':
                            setIndexButtonState(message.enabled, message.text);
                            break;
                    }
                });

                function updateIndexStatusUI(isIndexed, fileCount) {
                    if (isIndexed) {
                        indexStatus.textContent = \`Indexed (\${fileCount} files)\`;
                        indexButton.textContent = "🔄 Re-index";
                    } else {
                        indexStatus.textContent = "Not Indexed";
                        indexButton.textContent = "📚 Index Codebase";
                    }
                }

                /**
                 * Set index button state - CRITICAL for preventing spam
                 */
                function setIndexButtonState(enabled, text) {
                    indexButton.disabled = !enabled;
                    indexButton.textContent = text;

                    // Visual feedback for disabled state
                    if (enabled) {
                        indexButton.style.opacity = '1';
                        indexButton.style.cursor = 'pointer';
                    } else {
                        indexButton.style.opacity = '0.6';
                        indexButton.style.cursor = 'not-allowed';
                    }
                }

                function updateUI(state) {
                    if (state && state.codebase && state.core) {
                        updateIndexStatusUI(state.codebase.isIndexed, state.codebase.fileCount);
                        manifestoDropdown.value = state.core.isManifestoMode ? 'manifesto' : 'free';
                        modeDropdown.value = state.core.isAgentMode ? 'agent' : 'chat';
                        agentDropdown.value = state.core.currentAgent.toLowerCase();
                        autoToggle.checked = state.core.isAutoMode;
                    }
                }

                // Function to show glossary panel (called from commands)
                window.showGlossaryPanel = function() {
                    glossaryPanel.style.display = 'block';
                    document.getElementById('termInput').focus();
                };

                // Drag handle functionality for resizing input area
                const resizeHandle = document.getElementById('resizeHandle');
                const inputSection = document.getElementById('inputSection');

                let isDragging = false;
                let startY = 0;
                let startHeight = 0;

                if (resizeHandle && inputSection) {
                    resizeHandle.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        startY = e.clientY;
                        startHeight = inputSection.offsetHeight;
                        document.body.style.cursor = 'ns-resize';
                        document.body.style.userSelect = 'none';
                        e.preventDefault();
                    });

                    document.addEventListener('mousemove', (e) => {
                        if (!isDragging) return;

                        // Calculate new height based on mouse movement
                        const deltaY = startY - e.clientY;
                        const newHeight = Math.max(120, Math.min(400, startHeight + deltaY));

                        // Only update the main container's height. Flexbox handles the rest.
                        inputSection.style.height = newHeight + 'px';
                    });

                    document.addEventListener('mouseup', () => {
                        if (isDragging) {
                            isDragging = false;
                            document.body.style.cursor = 'default';
                            document.body.style.userSelect = '';
                        }
                    });
                }
            </script>
        </body>
        </html>`;
    }
}
