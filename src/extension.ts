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

    constructor(private readonly _extensionUri: vscode.Uri, context?: vscode.ExtensionContext, stateManager?: StateManager) {
        this.stateManager = stateManager || StateManager.getInstance(context);
        this.commandManager = new ChatCommandManager();
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
                        // This is now handled through the StateManager for consistency
                        await this.stateManager.startIndexing();
                        this.updateIndexStatus(); // Notify UI of completion
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

        // Initialize status
        this.updateIndexStatus();
    }

    private async handleCodebaseIndexing(): Promise<void> {
        try {
            this.sendResponse('📚 Starting codebase indexing...');

            const result = await this.stateManager.startIndexing();
            this.sendResponse(result.message);
            this.updateIndexStatus();

        } catch (error) {
            console.error('Indexing failed:', error);
            this.sendResponse('❌ Failed to index codebase: ' + (error instanceof Error ? error.message : String(error)));
            this.updateIndexStatus();
        }
    }

    private async handleUserMessage(message: string): Promise<void> {
        try {
            // Use the ChatCommandManager instead of the old if/else if block
            const response = await this.commandManager.handleMessage(message, this.stateManager);
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

    private _getHtmlForWebview(_webview: vscode.Webview): string {
        // This is the original V1 UI, which will be adapted to the V2 architecture.
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Piggie Chat</title>
            <style>
                body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 0; overflow: hidden; }
                .chat-container { display: flex; flex-direction: column; height: 100vh; }

                /* Top toolbar */
                .top-toolbar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-sideBar-border); }
                .toolbar-button { padding: 6px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
                .toolbar-button:hover { background: var(--vscode-button-hoverBackground); }
                .status-indicator { font-size: 11px; color: var(--vscode-descriptionForeground); }

                /* Messages area */
                .messages { flex: 1; overflow-y: auto; padding: 12px; min-height: 0; }
                .message { padding: 10px 12px; border-radius: 6px; margin: 8px 0; word-wrap: break-word; line-height: 1.4; }
                .user-message { background: var(--vscode-inputValidation-infoBackground); border-left: 3px solid var(--vscode-inputValidation-infoBorder); margin-left: 20px; }
                .ai-message { background: var(--vscode-textBlockQuote-background); border-left: 3px solid var(--vscode-charts-blue); }

                /* Message content formatting */
                .message strong { font-weight: bold; color: var(--vscode-foreground); }
                .message ul { margin: 8px 0; padding-left: 20px; }
                .message li { margin: 2px 0; }
                .message pre { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 12px; margin: 8px 0; overflow-x: auto; }
                .message code { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 2px 4px; font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
                .message pre code { background: none; border: none; padding: 0; }

                /* Message content formatting */
                .message strong { font-weight: bold; color: var(--vscode-foreground); }
                .message ul { margin: 8px 0; padding-left: 20px; }
                .message li { margin: 2px 0; }
                .message pre { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 12px; margin: 8px 0; overflow-x: auto; }
                .message code { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 2px 4px; font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
                .message pre code { background: none; border: none; padding: 0; }
                /* Input section */
                .input-section { flex-shrink: 0; padding: 12px; background: var(--vscode-sideBar-background); border-top: 1px solid var(--vscode-sideBar-border); }
                .mode-controls { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
                .mode-select { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); border-radius: 3px; padding: 4px 8px; font-size: 11px; min-width: 100px; }
                .auto-toggle { display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 11px; color: var(--vscode-foreground); user-select: none; }
                .auto-toggle input[type="checkbox"] { margin: 0; }
                .input-container { display: flex; gap: 8px; align-items: stretch; }
                .textarea-container { flex: 1; position: relative; display: flex; flex-direction: column; min-width: 0; }
                .resize-handle { height: 12px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-bottom: none; border-radius: 3px 3px 0 0; cursor: ns-resize; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--vscode-descriptionForeground); user-select: none; opacity: 0.7; }
                .message-input { width: 100%; padding: 8px 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-top: none; border-radius: 0 0 3px 3px; resize: none; min-height: 36px; max-height: 120px; font-family: inherit; font-size: inherit; box-sizing: border-box; }
                .send-button { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; align-self: flex-end; white-space: nowrap; flex-shrink: 0; }
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
                <div class="input-section">
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

                    <!-- Text input area -->
                    <div class="input-container">
                        <div class="textarea-container">
                            <div class="resize-handle" id="resizeHandle">⋯</div>
                            <textarea id="messageInput" class="message-input" placeholder="Ask Piggie anything..." rows="1"></textarea>
                        </div>
                        <button id="sendButton" class="send-button">Send</button>
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
                const indexStatus = document.getElementById('indexStatus');
                const manifestoDropdown = document.getElementById('manifestoDropdown');
                const modeDropdown = document.getElementById('modeDropdown');
                const agentDropdown = document.getElementById('agentDropdown');
                const autoToggle = document.getElementById('autoToggle');
                const glossaryPanel = document.getElementById('glossaryPanel');
                const addTermButton = document.getElementById('addTermButton');
                const closeGlossaryBtn = document.getElementById('closeGlossaryBtn');
                const resizeHandle = document.getElementById('resizeHandle');

                // Event Listeners
                sendButton.addEventListener('click', sendMessage);
                messageInput.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                indexButton.addEventListener('click', () => {
                    vscode.postMessage({ command: 'indexCodebase' });
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

                // Resize handle functionality
                let isResizing = false;
                let startY = 0;
                let startHeight = 0;

                resizeHandle.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    startY = e.clientY;
                    startHeight = messageInput.offsetHeight;
                    document.addEventListener('mousemove', handleResize);
                    document.addEventListener('mouseup', stopResize);
                    e.preventDefault();
                });

                function handleResize(e) {
                    if (!isResizing) return;
                    const deltaY = startY - e.clientY;
                    const newHeight = Math.max(36, Math.min(120, startHeight + deltaY));
                    messageInput.style.height = newHeight + 'px';
                }

                function stopResize() {
                    isResizing = false;
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', stopResize);
                }

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
                    // Basic markdown-like formatting for better readability
                    let formatted = content
                        // Convert **bold** to <strong>
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        // Convert bullet points to proper list items
                        .replace(/^• (.*$)/gm, '<li>$1</li>')
                        // Convert code blocks
                        .replace(/\`\`\`(\w+)?\n([\s\S]*?)\`\`\`/g, '<pre><code class="language-$1">$2</code></pre>')
                        // Convert inline code
                        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                        // Convert line breaks to <br>
                        .replace(/\n/g, '<br>');

                    // Wrap consecutive list items in <ul>
                    formatted = formatted.replace(/(<li>.*<\/li>)(<br>)*(<li>.*<\/li>)/g, '<ul>$1$3</ul>');
                    formatted = formatted.replace(/(<li>.*<\/li>)(<br>)*(<li>.*<\/li>)(<br>)*(<li>.*<\/li>)/g, '<ul>$1$3$5</ul>');
                    formatted = formatted.replace(/(<li>.*<\/li>)(<br>)*(<li>.*<\/li>)(<br>)*(<li>.*<\/li>)(<br>)*(<li>.*<\/li>)/g, '<ul>$1$3$5$7</ul>');

                    return formatted;
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'addMessage':
                            const prefix = message.role === 'error' ? '❌ Error: ' : '🐷 Piggie: ';
                            addMessage(message.role === 'error' ? 'error' : 'ai-message', prefix + message.content);
                            break;
                        case 'syncState':
                            updateUI(message.state);
                            break;
                        case 'showGlossaryPanel':
                            glossaryPanel.style.display = 'block';
                            document.getElementById('termInput').focus();
                            break;
                    }
                });

                function updateUI(state) {
                    // Update Index Status
                    if (state.codebase.isIndexed) {
                        indexStatus.textContent = \`Indexed (\${state.codebase.fileCount} files)\`;
                        indexButton.textContent = "🔄 Re-index";
                    } else {
                        indexStatus.textContent = "Not Indexed";
                        indexButton.textContent = "📚 Index Codebase";
                    }

                    // Update Mode Dropdowns and Toggles
                    manifestoDropdown.value = state.core.isManifestoMode ? 'manifesto' : 'free';
                    modeDropdown.value = state.core.isAgentMode ? 'agent' : 'chat';
                    agentDropdown.value = state.core.currentAgent.toLowerCase();
                    autoToggle.checked = state.core.isAutoMode;
                }

                // Function to show glossary panel (called from commands)
                window.showGlossaryPanel = function() {
                    glossaryPanel.style.display = 'block';
                    document.getElementById('termInput').focus();
                };
            </script>
        </body>
        </html>`;
    }
}
