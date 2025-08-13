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
import { AutoModeManager } from './core/AutoModeManager';
import { AuggieAdapter } from './agents/adapters/AuggieAdapter';
import { LocalAgent } from './agents/adapters/LocalAgent';
import { AmazonQAdapter } from './agents/adapters/AmazonQAdapter';
import { ClineAdapter } from './agents/adapters/ClineAdapter';
import { OllamaAdapter } from './agents/adapters/OllamaAdapter';
import { AgentConfig, AgentProvider, RuleSeverity, RuleCategory } from './core/types';
import { ManifestoEngine } from './core/ManifestoEngine';

/**
 * Index manifesto rules for efficient token usage
 */
function indexManifesto(stateManager: StateManager): void {
    try {
        // Basic manifesto rules - can be expanded
        const manifestoRules = [
            {
                id: 'error-handling',
                text: 'Comprehensive Error Handling',
                description: 'All functions must include try-catch blocks with specific error handling',
                severity: RuleSeverity.CRITICAL,
                category: RuleCategory.ERROR_HANDLING,
                pattern: /try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{[\s\S]*?}/g,
                examples: ['try { ... } catch (error) { ... }']
            },
            {
                id: 'input-validation',
                text: 'Input Validation',
                description: 'All user inputs must be validated before processing',
                severity: RuleSeverity.CRITICAL,
                category: RuleCategory.SECURITY,
                pattern: /function\s+\w+\s*\([^)]*\)\s*{(?![\s\S]*if\s*\(.*\))/g,
                examples: ['if (!input || typeof input !== "string") throw new Error("Invalid input");']
            },
            {
                id: 'jsdoc-required',
                text: 'JSDoc Documentation',
                description: 'All public functions must have JSDoc comments',
                severity: RuleSeverity.REQUIRED,
                category: RuleCategory.DOCUMENTATION,
                pattern: /(?:export\s+)?(?:async\s+)?function\s+\w+/g,
                examples: ['/** * Function description * @param {type} param - description */']
            }
        ];

        stateManager.manifestoRules = manifestoRules;
        console.log(`📋 Indexed ${manifestoRules.length} manifesto rules`);
    } catch (error) {
        console.error('Failed to index manifesto:', error);
    }
}

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🐷 Piggie extension is now active!');

    try {
        // CRITICAL: Add detailed logging to debug activation issues
        console.log('🔍 Starting extension activation...');
        console.log('📁 Extension path:', context.extensionPath);
        console.log('🔧 VSCode version:', vscode.version);

        // Initialize StateManager singleton first
        console.log('🏗️ Initializing StateManager...');
        const stateManager = StateManager.getInstance(context);
        console.log('✅ StateManager initialized successfully');

        // CRITICAL: Initialize ManifestoEngine for enforcement
        console.log('🏗️ Initializing ManifestoEngine...');
        const manifestoEngine = new ManifestoEngine();
        stateManager.manifestoEngine = manifestoEngine;
        console.log('✅ ManifestoEngine initialized successfully');

        // Index manifesto for token efficiency
        console.log('📚 Indexing manifesto...');
        indexManifesto(stateManager);
        console.log('✅ Manifesto indexed successfully');

        // Initialize providers as local constants (StateManager should only manage data, not service instances)
        console.log('🏗️ Creating providers...');
        const diffProvider = new InteractiveDiffProvider(context, stateManager);
        console.log('✅ InteractiveDiffProvider created');
        const manifestoTreeProvider = new ManifestoTreeDataProvider(stateManager);
        console.log('✅ ManifestoTreeDataProvider created');
        const glossaryTreeProvider = new GlossaryTreeDataProvider(context, stateManager);
        console.log('✅ GlossaryTreeDataProvider created');
        const piggieActionsProvider = new PiggieActionsProvider();
        console.log('✅ PiggieActionsProvider created');
        const securityReviewProvider = new SecurityReviewProvider();
        console.log('✅ SecurityReviewProvider created');
        const manifestoRulesProvider = new ManifestoRulesProvider(stateManager);
        console.log('✅ ManifestoRulesProvider created');
        const diagnosticsProvider = new ManifestoDiagnosticsProvider(stateManager);
        console.log('✅ ManifestoDiagnosticsProvider created');
        const codeActionProvider = new ManifestoCodeActionProvider(stateManager);

        // CRITICAL: Set diagnostics provider in StateManager for enforcement commands
        stateManager.diagnosticsProvider = diagnosticsProvider;

        // Providers are now managed locally in activate function scope

        // Register tree data providers with error handling
        try {
            context.subscriptions.push(
                vscode.window.registerTreeDataProvider('manifestoView', manifestoTreeProvider),
                vscode.window.registerTreeDataProvider('glossaryView', glossaryTreeProvider),
                vscode.window.registerTreeDataProvider('piggieActions', piggieActionsProvider),
                vscode.window.registerTreeDataProvider('piggieSecurityReview', securityReviewProvider),
                vscode.window.registerTreeDataProvider('manifestoRules', manifestoRulesProvider)
            );
            console.log('✅ All tree data providers registered successfully');
        } catch (error) {
            console.error('❌ Failed to register tree data providers:', error);
            // Try to register them individually to see which one fails
            try {
                context.subscriptions.push(vscode.window.registerTreeDataProvider('manifestoView', manifestoTreeProvider));
                console.log('✅ manifestoView registered');
            } catch (e) { console.error('❌ manifestoView failed:', e); }

            try {
                context.subscriptions.push(vscode.window.registerTreeDataProvider('glossaryView', glossaryTreeProvider));
                console.log('✅ glossaryView registered');
            } catch (e) { console.error('❌ glossaryView failed:', e); }

            try {
                context.subscriptions.push(vscode.window.registerTreeDataProvider('piggieActions', piggieActionsProvider));
                console.log('✅ piggieActions registered');
            } catch (e) { console.error('❌ piggieActions failed:', e); }

            try {
                context.subscriptions.push(vscode.window.registerTreeDataProvider('piggieSecurityReview', securityReviewProvider));
                console.log('✅ piggieSecurityReview registered');
            } catch (e) { console.error('❌ piggieSecurityReview failed:', e); }

            try {
                context.subscriptions.push(vscode.window.registerTreeDataProvider('manifestoRules', manifestoRulesProvider));
                console.log('✅ manifestoRules registered');
            } catch (e) { console.error('❌ manifestoRules failed:', e); }
        }

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

        // CRITICAL: Register document save enforcement
        context.subscriptions.push(
            vscode.workspace.onWillSaveTextDocument(async (event) => {
                try {
                    // MANDATORY: Enforce manifesto compliance on save
                    const document = event.document;

                    // Skip non-source files
                    if (!document.fileName.match(/\.(ts|js|tsx|jsx|py|java|cpp|c|cs|go|rs|php)$/)) {
                        return;
                    }

                    const manifestoEngine = stateManager.manifestoEngine;
                    if (!manifestoEngine) {
                        return;
                    }

                    // REQUIRED: Validate document content
                    const text = document.getText();
                    const violations = await manifestoEngine.validateCode(text, document.fileName);

                    if (violations.length > 0) {
                        // CRITICAL: Show violations but don't block save (allow user to fix)
                        vscode.window.showWarningMessage(
                            `⚠️ Manifesto violations detected in ${document.fileName}: ${violations.length} issues found`
                        );

                        // Update diagnostics to show violations
                        const diagnostics = stateManager.diagnosticsProvider;
                        if (diagnostics) {
                            diagnostics.updateDiagnostics();
                        }
                    }
                } catch (error) {
                    console.error('Document save enforcement failed:', error);
                }
            })
        );

        // Register chat provider with context for persistence
        const provider = new PiggieChatProvider(context.extensionUri, context, stateManager);
        try {
            context.subscriptions.push(
                vscode.window.registerWebviewViewProvider('piggieChatPanel', provider)
            );
        } catch (error) {
            console.warn('⚠️ Chat provider registration failed (may already be registered):', error);
            // Continue activation even if chat provider fails
        }

        // Add provider to subscriptions for proper disposal
        context.subscriptions.push({
            dispose: () => provider.dispose()
        });

        // Register all commands
        context.subscriptions.push(
            vscode.commands.registerCommand('manifestoEnforcer.toggleManifestoMode', () => {
                stateManager.isManifestoMode = !stateManager.isManifestoMode;
                vscode.window.showInformationMessage(`🛡️ Manifesto Mode: ${stateManager.isManifestoMode ? 'ON' : 'OFF'}`);
            }),

            vscode.commands.registerCommand('manifestoEnforcer.switchAgent', async () => {
                try {
                    const agents = ['Auggie', 'Amazon Q', 'Cline'];
                    const selected = await vscode.window.showQuickPick(agents, {
                        placeHolder: 'Select AI Agent for Piggie'
                    });
                    if (selected) {
                        stateManager.currentAgent = selected;
                        vscode.window.showInformationMessage(`🐷 Piggie is now using: ${selected}`);
                    }
                } catch (error) {
                    console.error('Error in switchAgent command:', error);
                    vscode.window.showErrorMessage('Failed to switch agent');
                }
            }),

            vscode.commands.registerCommand('manifestoEnforcer.quickChat', async () => {
                try {
                    const input = await vscode.window.showInputBox({
                        placeHolder: 'Ask Piggie anything...',
                        prompt: 'Quick chat with Piggie'
                    });
                    if (input) {
                        vscode.commands.executeCommand('piggieChatPanel.focus');
                        // Send message to chat panel
                        provider.handleQuickMessage(input);
                    }
                } catch (error) {
                    console.error('Error in quickChat command:', error);
                    vscode.window.showErrorMessage('Failed to process quick chat');
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
                    provider.handleQuickMessage(`Generate manifesto for ${input} project`);
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

            // CRITICAL: TDD Enforcement Commands
            vscode.commands.registerCommand('manifesto-enforcer.validateCommit', async () => {
                try {
                    // MANDATORY: Validate commit against manifesto rules
                    const manifestoEngine = stateManager.manifestoEngine;
                    if (!manifestoEngine) {
                        vscode.window.showErrorMessage('Manifesto engine not initialized');
                        return false;
                    }

                    // REQUIRED: Run tests before allowing commit
                    const testResult = await vscode.commands.executeCommand('manifestoEnforcer.runTests');
                    if (!testResult) {
                        vscode.window.showErrorMessage('❌ Commit blocked: Tests are failing');
                        return false;
                    }

                    // CRITICAL: Check for manifesto violations
                    const violations = await manifestoEngine.validateWorkspace();
                    if (violations.length > 0) {
                        vscode.window.showErrorMessage(`❌ Commit blocked: ${violations.length} manifesto violations found`);
                        return false;
                    }

                    vscode.window.showInformationMessage('✅ Commit validation passed');
                    return true;
                } catch (error) {
                    console.error('Commit validation failed:', error);
                    vscode.window.showErrorMessage('❌ Commit validation failed');
                    return false;
                }
            }),

            vscode.commands.registerCommand('manifesto-enforcer.enforceCompliance', async () => {
                try {
                    // MANDATORY: Enforce manifesto compliance
                    const manifestoEngine = stateManager.manifestoEngine;
                    if (!manifestoEngine) {
                        vscode.window.showErrorMessage('Manifesto engine not initialized');
                        return false;
                    }

                    const violations = await manifestoEngine.validateWorkspace();
                    if (violations.length > 0) {
                        vscode.window.showWarningMessage(`⚠️ Found ${violations.length} manifesto violations`);
                        // Show violations in problems panel
                        const diagnostics = stateManager.diagnosticsProvider;
                        if (diagnostics) {
                            diagnostics.updateDiagnostics();
                        }
                        return false;
                    }

                    vscode.window.showInformationMessage('✅ All manifesto compliance checks passed');
                    return true;
                } catch (error) {
                    console.error('Compliance enforcement failed:', error);
                    vscode.window.showErrorMessage('❌ Compliance enforcement failed');
                    return false;
                }
            }),

            vscode.commands.registerCommand('manifesto-enforcer.verifyAIResponse', async (response: string) => {
                try {
                    // CRITICAL: Verify AI response follows manifesto
                    if (!response || typeof response !== 'string') {
                        return false;
                    }

                    // MANDATORY: Check for manifesto violations in AI response
                    const violations = [
                        'skip the tests',
                        'fix them later',
                        'temporary solution',
                        'quick hack',
                        'TODO: implement',
                        'ignore the error',
                        'disable the warning'
                    ];

                    const lowerResponse = response.toLowerCase();
                    const hasViolations = violations.some(violation =>
                        lowerResponse.includes(violation.toLowerCase())
                    );

                    if (hasViolations) {
                        vscode.window.showWarningMessage('⚠️ AI response contains manifesto violations');
                        return false;
                    }

                    return true;
                } catch (error) {
                    console.error('AI response verification failed:', error);
                    return false;
                }
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
            }),

            vscode.commands.registerCommand('manifestoEnforcer.executeCodeAction', async (data: { code: string; language: string; fileName: string }) => {
                try {
                    // CRITICAL: Input validation
                    if (!data || !data.code || !data.language) {
                        throw new Error('Invalid code execution data provided');
                    }

                    // Import TerminalManager dynamically to avoid circular dependencies
                    const { TerminalManager } = await import('./core/TerminalManager');

                    // Execute the code using TerminalManager
                    const result = await TerminalManager.executeScriptInTerminal(data.code, data.language);

                    // Show success message
                    vscode.window.showInformationMessage('🚀 Code executed successfully! Check the terminal for output.');

                    // Optionally, send result back to chat
                    provider.handleQuickMessage(`✅ **Manual Execution Completed**\n\n${result}`);

                } catch (error) {
                    // MANDATORY: Comprehensive error handling (manifesto requirement)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
                    console.error('Code execution command failed:', error);
                    vscode.window.showErrorMessage(`Code execution failed: ${errorMessage}`);

                    // Send error back to chat
                    provider.handleQuickMessage(`❌ **Manual Execution Failed**: ${errorMessage}`);
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
 * MANDATORY: Proper resource disposal to prevent memory leaks
 */
export async function deactivate(): Promise<void> {
    try {
        console.log('🐷 Piggie extension deactivating...');

        // Dispose StateManager singleton to clean up resources
        const stateManager = StateManager.getInstance();
        if (stateManager) {
            await stateManager.dispose();
        }

        console.log('🐷 Piggie extension is now deactivated');
    } catch (error) {
        console.error('Error during extension deactivation:', error);
    }
}

/**
 * Setup file change detection for auto re-indexing
 */
export function setupFileChangeDetection(stateManager: StateManager): void {
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
        // Don't initialize agents in constructor - do it lazily when needed
    }

    private async initializeAgents(): Promise<void> {
        try {
            // Always register LocalAgent first as guaranteed fallback
            const localConfig: AgentConfig = {
                id: 'local-agent',
                name: 'Local Assistant',
                provider: AgentProvider.LOCAL,
                isEnabled: true,
            };
            const localAgent = new LocalAgent(localConfig);
            await this.agentManager.registerAgent(localAgent);
            console.log('🐷 Local agent registered successfully.');

            // Register all available agents with graceful fallbacks
            await this.registerAgentWithFallback('Amazon Q', () => {
                const config: AgentConfig = {
                    id: 'amazonq-default',
                    name: 'Amazon Q',
                    provider: AgentProvider.AMAZON_Q,
                    isEnabled: true,
                };
                return new AmazonQAdapter(config);
            });

            await this.registerAgentWithFallback('Auggie', () => {
                const config: AgentConfig = {
                    id: 'auggie-default',
                    name: 'Auggie',
                    provider: AgentProvider.AUGGIE,
                    isEnabled: true,
                };
                return new AuggieAdapter(config);
            });

            await this.registerAgentWithFallback('Cline', () => {
                const config: AgentConfig = {
                    id: 'cline-default',
                    name: 'Cline',
                    provider: AgentProvider.CLINE,
                    isEnabled: true,
                };
                return new ClineAdapter(config);
            });

            await this.registerAgentWithFallback('Ollama', () => {
                const config: AgentConfig = {
                    id: 'ollama-default',
                    name: 'Ollama',
                    provider: AgentProvider.OLLAMA,
                    isEnabled: true,
                };
                return new OllamaAdapter(config);
            });

            // Ensure at least one agent is available (LocalAgent should always be available)
            const availableAgents = this.agentManager.getAvailableAgents();
            console.log(`🐷 Initialized ${availableAgents.length} agents:`, availableAgents.map(a => a.name).join(', '));

        } catch (error) {
            console.error('🐷 Failed to initialize agents:', error);
            vscode.window.showErrorMessage('Piggie failed to initialize AI agents.');
        }
    }

    /**
     * Register an agent with graceful fallback handling
     */
    private async registerAgentWithFallback(agentName: string, createAgent: () => any): Promise<void> {
        try {
            const agent = createAgent();
            await this.agentManager.registerAgent(agent);
            console.log(`🐷 ${agentName} agent registered successfully.`);
        } catch (error) {
            console.warn(`🐷 ${agentName} agent registration failed (graceful fallback):`, error);
            // Don't show error to user - graceful degradation
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        // Initialize agents when webview is first resolved
        this.initializeAgents().catch(error => {
            console.error('🐷 Failed to initialize agents in webview:', error);
        });

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
                                console.log(`🔧 Toggle received: isAgentMode = ${data.value} (UI sent: ${data.value ? 'agent' : 'chat'})`);
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
                            case 'isTddMode':
                                this.stateManager.isTddMode = data.value;
                                console.log(`🧪 TDD Mode: ${data.value ? 'ON' : 'OFF'}`);
                                break;
                            default:
                                console.warn(`Unknown setting: ${data.key}`);
                        }
                        break;
                    case 'executeAction':
                        await this.handleActionExecution(data.actionCommand, data.actionId, data.actionData);
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

    /**
     * Handle action button execution from chat
     */
    private async handleActionExecution(actionCommand: string, actionId: string, actionData: any): Promise<void> {
        try {
            const autoModeManager = new AutoModeManager(this.stateManager);

            // Create action object
            const action = {
                id: actionId,
                label: `Execute ${actionCommand}`,
                command: actionCommand,
                data: actionData
            };

            // Execute the action
            const result = await autoModeManager.executeAction(action);

            // Send success response to chat
            this.sendResponse(`✅ **Action Completed!**\n\n${result}`);

        } catch (error) {
            // Send error response to chat
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.sendResponse(`❌ **Action Failed:** ${errorMessage}`);
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
                .status-container { padding: 4px 12px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-sideBar-border); }
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

                /* Action buttons in chat responses */
                .chat-actions { margin: 12px 0; display: flex; flex-wrap: wrap; gap: 8px; }
                .action-button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
                .action-button:hover { opacity: 0.8; transform: translateY(-1px); }
                .action-button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
                .action-button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
                .action-button.success { background: #28a745; color: white; }
                .action-button.warning { background: #ffc107; color: #212529; }
                .action-button.danger { background: #dc3545; color: white; }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <!-- Top toolbar - clean and minimal -->
                <div class="top-toolbar">
                    <button id="indexButton" class="toolbar-button">📚 Index Codebase</button>
                    <button id="clearChatButton" class="toolbar-button">🗑️ Clear Chat</button>
                    <label class="auto-toggle">
                        <input type="checkbox" id="tddToggle" />
                        🧪 TDD
                    </label>
                    <label class="auto-toggle">
                        <input type="checkbox" id="uiTestsToggle" />
                        🎭 UI Tests
                    </label>
                </div>

                <!-- Index status indicator -->
                <div class="status-container">
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

                tddToggle.addEventListener('change', e => {
                    vscode.postMessage({ command: 'changeSetting', key: 'isTddMode', value: e.target.checked });
                });

                uiTestsToggle.addEventListener('change', e => {
                    vscode.postMessage({ command: 'changeSetting', key: 'isUiTddMode', value: e.target.checked });
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

                    // Add event listeners to any action buttons in the new message
                    const actionButtons = messageDiv.querySelectorAll('.action-button');
                    actionButtons.forEach(button => {
                        button.addEventListener('click', () => {
                            const command = button.getAttribute('data-action-command');
                            const actionId = button.getAttribute('data-action-id');
                            const actionData = button.getAttribute('data-action-data');

                            if (command) {
                                vscode.postMessage({
                                    command: 'executeAction',
                                    actionCommand: command,
                                    actionId: actionId,
                                    actionData: actionData ? JSON.parse(actionData) : {}
                                });
                            }
                        });
                    });
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
                        tddToggle.checked = state.core.isTddMode;
                        uiTestsToggle.checked = state.core.isUiTddMode;

                        // Debug logging to verify state sync
                        console.log('🔧 UI State Update:', {
                            isAgentMode: state.core.isAgentMode,
                            modeDropdownValue: modeDropdown.value,
                            isAutoMode: state.core.isAutoMode,
                            autoToggleChecked: autoToggle.checked,
                            isTddMode: state.core.isTddMode,
                            tddToggleChecked: tddToggle.checked,
                            isUiTddMode: state.core.isUiTddMode,
                            uiTestsToggleChecked: uiTestsToggle.checked
                        });
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

    /**
     * Dispose resources to prevent memory leaks
     * MANDATORY: Proper resource disposal (manifesto requirement)
     */
    public dispose(): void {
        try {
            // Clear webview reference
            this._view = undefined;

            // Dispose agent manager
            if (this.agentManager) {
                this.agentManager.dispose();
            }

            // Clear command manager
            if (this.commandManager) {
                // CommandManager doesn't have dispose yet, but clear any references
                this.commandManager = undefined as any;
            }

            console.log('🗑️ PiggieChatProvider disposed successfully');
        } catch (error) {
            console.error('Error disposing PiggieChatProvider:', error);
        }
    }
}
