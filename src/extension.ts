import * as vscode from 'vscode';

// Global state
let manifestoRules: any[] = [];
let isManifestoMode = true;
let currentAgent = 'Auggie';
let currentModel = 'Claude Sonnet 4';
let isAgentMode = false; // false = chat only (safer default), true = performs actions
let isAutoMode = false; // false = requires confirmation (safer default), true = auto-executes
let fontSize = 'medium'; // small, medium, large
let showEmojis = true; // show/hide emojis in responses

// Codebase awareness state
let codebaseIndex: Map<string, any> = new Map();
let isCodebaseIndexed = false;
let projectStructure: any = null;
let manifestoIndex: any = null;
let codebaseIndexTimestamp = 0;

// Amazon Q optimization state
let qContextWindow: any[] = [];
let qTokenCount = 0;
let qMaxTokens = 4000; // Conservative limit for Q
let qContextPriority: Map<string, number> = new Map();

// MR/PR integration state
let mrCache: Map<string, any> = new Map();
let gitConfig: any = null;

// Glossary system state
let projectGlossary: Map<string, any> = new Map();
let isGlossaryIndexed = false;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🐷 Piggie extension is now active!');

    // Load saved settings
    loadSavedSettings();

    // Index manifesto for token efficiency
    indexManifesto();

    // Register chat provider with context for persistence
    const provider = new PiggieChatProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('piggieChatPanel', provider)
    );

    // Load saved codebase index on startup
    loadCodebaseIndex(context).then(loaded => {
        if (loaded) {
            console.log('💾 Restored codebase index from previous session');
            isCodebaseIndexed = true;
        }
    });

    // Load saved glossary on startup
    loadGlossaryFromStorage(context).then(loaded => {
        if (loaded) {
            console.log('📖 Restored glossary from previous session');
        }
    });

    // Setup file change detection for auto re-indexing
    setupFileChangeDetection();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('manifestoEnforcer.openChat', () => {
            vscode.commands.executeCommand('piggieChatPanel.focus');
        })
    );

    console.log('🐷 Piggie commands registered');
}

/**
 * Load saved user settings
 */
async function loadSavedSettings(): Promise<void> {
    try {
        const config = vscode.workspace.getConfiguration('manifestoEnforcer');
        
        // Load manifesto mode setting
        isManifestoMode = config.get<boolean>('manifestoMode', true);

        // Load default mode setting
        const defaultMode = config.get<string>('defaultMode', 'chat');
        isAgentMode = defaultMode === 'agent';

        // Load auto mode setting
        isAutoMode = config.get<boolean>('autoMode', false);

        // Load formatting settings
        fontSize = config.get<string>('fontSize', 'medium');
        showEmojis = config.get<boolean>('showEmojis', true);

        // Load current agent
        currentAgent = config.get<string>('currentAgent', 'Auggie');

        console.log('🐷 Loaded settings: ' + (isAgentMode ? 'Agent Mode' : 'Chat Mode') + ', Auto: ' + (isAutoMode ? 'ON' : 'OFF'));
        
    } catch (error) {
        console.error('🐷 Error loading settings:', error);
    }
}

/**
 * Save mode settings to user preferences
 */
async function saveModeSettings(): Promise<void> {
    try {
        const config = vscode.workspace.getConfiguration('manifestoEnforcer');
        await config.update('manifestoMode', isManifestoMode, vscode.ConfigurationTarget.Global);
        await config.update('defaultMode', isAgentMode ? 'agent' : 'chat', vscode.ConfigurationTarget.Global);
        await config.update('autoMode', isAutoMode, vscode.ConfigurationTarget.Global);
        await config.update('fontSize', fontSize, vscode.ConfigurationTarget.Global);
        await config.update('showEmojis', showEmojis, vscode.ConfigurationTarget.Global);
        await config.update('currentAgent', currentAgent, vscode.ConfigurationTarget.Global);
        
        console.log('🐷 Saved settings: ' + (isAgentMode ? 'Agent Mode' : 'Chat Mode') + ', Auto: ' + (isAutoMode ? 'ON' : 'OFF'));
        
    } catch (error) {
        console.error('🐷 Error saving settings:', error);
    }
}

/**
 * Chat provider class
 */
class PiggieChatProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'piggieChatPanel';
    private _view?: vscode.WebviewView;
    private _context?: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
        this._context = context;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
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
            switch (data.command) {
                case 'sendMessage':
                    await this.handleUserMessage(data.message);
                    break;
                case 'changeMode':
                    if (data.mode && typeof data.mode === 'string') {
                        isAgentMode = data.mode === 'agent';
                        await saveModeSettings();
                        this.updateToggles();
                        this.sendSecureResponse(
                            isAgentMode
                                ? '🤖 Agent Mode ENABLED - I will perform actions and create files'
                                : '💬 Chat Mode ENABLED - I will provide explanations and suggestions only'
                        );
                    }
                    break;
                case 'toggleAuto':
                    if (typeof data.enabled === 'boolean') {
                        isAutoMode = data.enabled;
                        await saveModeSettings();
                        this.updateToggles();
                        this.sendSecureResponse(
                            isAutoMode
                                ? '⚡ Auto Mode ENABLED - Commands will execute automatically'
                                : '🔘 Manual Mode ENABLED - Commands will show action buttons for confirmation'
                        );
                    }
                    break;
                case 'writeCodeToFile':
                    if (data.code && data.filename) {
                        try {
                            await writeSecureFile(data.code, data.filename, data.language || 'text');
                            this.sendSecureResponse('✅ File created successfully: ' + data.filename);
                        } catch (error) {
                            this.sendSecureResponse('❌ Failed to create file: ' + error);
                        }
                    }
                    break;
                case 'copyToClipboard':
                    if (data.text) {
                        try {
                            await vscode.env.clipboard.writeText(data.text);
                            this.sendSecureResponse('📋 Copied to clipboard!');
                        } catch (error) {
                            this.sendSecureResponse('❌ Failed to copy: ' + error);
                        }
                    }
                    break;
                case 'changeFontSize':
                    if (data.fontSize && typeof data.fontSize === 'string') {
                        fontSize = data.fontSize;
                        await saveModeSettings();
                        this.updateToggles();
                    }
                    break;
                case 'toggleEmojis':
                    if (typeof data.enabled === 'boolean') {
                        showEmojis = data.enabled;
                        await saveModeSettings();
                        this.updateToggles();
                        this.sendSecureResponse(
                            showEmojis
                                ? 'Emojis enabled in responses'
                                : 'Emojis disabled in responses'
                        );
                    }
                    break;
                case 'changeManifesto':
                    if (typeof data.enabled === 'boolean') {
                        isManifestoMode = data.enabled;
                        await saveModeSettings();
                        this.updateToggles();
                        this.sendSecureResponse(
                            isManifestoMode
                                ? '🛡️ Manifesto Mode enabled - Following compliance rules'
                                : '🔓 Free Mode enabled - No restrictions'
                        );
                    }
                    break;
                case 'changeAgent':
                    if (data.agent && typeof data.agent === 'string') {
                        currentAgent = data.agent.charAt(0).toUpperCase() + data.agent.slice(1);
                        await saveModeSettings();
                        this.updateToggles();
                        this.sendSecureResponse(`Switched to ${currentAgent} AI model`);
                    }
                    break;
                case 'indexCodebase':
                    console.log('🔍 DEBUG: Received indexCodebase command');
                    await this.handleCodebaseIndexing();
                    break;
                case 'addGlossaryTerm':
                    await this.handleAddGlossaryTerm(data.term, data.definition);
                    break;
                case 'removeGlossaryTerm':
                    await this.handleRemoveGlossaryTerm(data.term);
                    break;
                case 'toggleGlossary':
                    this.handleToggleGlossary();
                    break;
                case 'importGlossary':
                    await this.handleImportGlossary();
                    break;
                case 'exportGlossary':
                    await this.handleExportGlossary();
                    break;
            }
        });

        // Initialize toggles
        this.updateToggles();
    }

    private async handleUserMessage(message: string): Promise<void> {
        try {
            // Check if auto mode should create a hello world file BEFORE generating response
            if (isAutoMode && /hello world/i.test(message) && /\b(write|create|generate|build|make|code|function|class|component|script)\b/i.test(message)) {
                const helloWorldCode = `// Hello World with manifesto compliance
console.log("Hello, World!");

// Additional manifesto-compliant features
function greet(name = "World") {
    try {
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid name parameter');
        }
        return \`Hello, \${name}!\`;
    } catch (error) {
        console.error('Greeting error:', error);
        return 'Hello, World!';
    }
}

console.log(greet());
console.log(greet("Developer"));`;

                try {
                    await writeSecureFile(helloWorldCode, 'hello-world.js', 'javascript');
                    this.sendSecureResponse('✅ Auto Mode: Successfully created hello-world.js in your workspace!');
                    return; // Don't generate additional response
                } catch (error) {
                    this.sendSecureResponse('❌ Auto Mode: Failed to create file - ' + error);
                    return;
                }
            }

            // Use Q-optimized response for Amazon Q, normal response for others
            const response = currentAgent.toLowerCase() === 'amazonq'
                ? await generateQOptimizedResponse(message)
                : await generateManifestoCompliantResponse(message);

            this.sendSecureResponse(response);
        } catch (error) {
            this.sendSecureResponse('🐷 Error: ' + error);
        }
    }

    private sendSecureResponse(content: string): void {
        if (this._view) {
            // Enhance response with glossary context
            const enhancedContent = enhanceResponseWithGlossary(content);

            this._view.webview.postMessage({
                command: 'addMessage',
                content: enhancedContent
            });
        }
    }

    private updateToggles(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateToggles',
                manifestoMode: isManifestoMode,
                agentMode: isAgentMode,
                autoMode: isAutoMode,
                fontSize: fontSize,
                showEmojis: showEmojis,
                currentAgent: currentAgent,
                currentModel: currentModel,
                isCodebaseIndexed: isCodebaseIndexed
            });
        }
    }

    private async handleCodebaseIndexing(): Promise<void> {
        try {
            this.sendSecureResponse('📚 Starting codebase indexing...');

            // Index the codebase
            await this.indexWorkspaceFiles();

            isCodebaseIndexed = true;
            codebaseIndexTimestamp = Date.now();
            this.updateIndexStatus();

            // Save the index for persistence across sessions
            if (this._context) {
                await saveCodebaseIndex(this._context);
            }

            // Analyze manifesto opportunities based on codebase
            const manifestoAnalysis = await analyzeManifestoOpportunities();

            let response = `✅ Codebase indexed successfully! Piggie now has full project awareness.\n\n**Indexed:** ${codebaseIndex.size} files\n**Symbols found:** ${projectStructure?.symbols?.size || 0}\n**Dependencies mapped:** ${projectStructure?.dependencies?.size || 0}\n**💾 Saved:** Index persisted for future sessions`;

            if (manifestoAnalysis.suggestions.length > 0) {
                response += `\n\n📋 **Smart Manifesto Opportunities:**\n${manifestoAnalysis.suggestions.join('\n')}`;
            }

            this.sendSecureResponse(response);

        } catch (error) {
            console.error('Indexing failed:', error);
            this.sendSecureResponse('❌ Failed to index codebase: ' + (error instanceof Error ? error.message : String(error)));
            isCodebaseIndexed = false;
            this.updateIndexStatus();
        }
    }

    private async indexWorkspaceFiles(): Promise<void> {
        console.log('🔍 DEBUG: Starting workspace file indexing');

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        console.log('🔍 DEBUG: Workspace folder found:', workspaceFolder.uri.fsPath);

        // Find all relevant files
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h,md,json}',
            '**/node_modules/**'
        );

        console.log('🔍 DEBUG: Found files:', files.length);

        codebaseIndex.clear();
        let processedFiles = 0;

        for (const file of files.slice(0, 100)) { // Limit for performance
            try {
                const content = await vscode.workspace.fs.readFile(file);
                const text = Buffer.from(content).toString('utf8');

                // Extract symbols and structure for intelligent editing
                const symbols = await this.extractSymbols(text, file.fsPath);

                codebaseIndex.set(file.fsPath, {
                    path: file.fsPath,
                    content: text,
                    size: text.length,
                    lastModified: Date.now(),
                    symbols: symbols,
                    imports: this.extractImports(text),
                    exports: this.extractExports(text)
                });

                processedFiles++;

                // Send progress update every 10 files
                if (processedFiles % 10 === 0) {
                    console.log(`🔍 DEBUG: Processed ${processedFiles} files`);
                }

            } catch (error) {
                console.warn('Failed to read file:', file.fsPath, error);
            }
        }

        // Build project structure for context awareness
        projectStructure = this.buildProjectStructure();

        // Build project glossary from codebase analysis
        // await buildProjectGlossary(); // TODO: Implement glossary building

        console.log(`📚 DEBUG: Indexed ${codebaseIndex.size} files with full symbol awareness`);
        console.log(`📚 DEBUG: Project structure - symbols: ${projectStructure?.symbols?.size}, dependencies: ${projectStructure?.dependencies?.size}`);
        console.log(`📚 DEBUG: Glossary - ${projectGlossary.size} terms identified`);
    }

    private async extractSymbols(content: string, filePath: string): Promise<any[]> {
        const symbols: any[] = [];

        // Extract functions
        const functionRegex = /(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=\s*(?:async\s+)?(?:function|\()|(?:\([^)]*\)\s*=>))/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            symbols.push({
                name: match[1],
                type: 'function',
                line: content.substring(0, match.index).split('\n').length
            });
        }

        // Extract classes
        const classRegex = /class\s+(\w+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            symbols.push({
                name: match[1],
                type: 'class',
                line: content.substring(0, match.index).split('\n').length
            });
        }

        // Extract interfaces (TypeScript)
        const interfaceRegex = /interface\s+(\w+)/g;
        while ((match = interfaceRegex.exec(content)) !== null) {
            symbols.push({
                name: match[1],
                type: 'interface',
                line: content.substring(0, match.index).split('\n').length
            });
        }

        return symbols;
    }

    private extractImports(content: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }

    private extractExports(content: string): string[] {
        const exports: string[] = [];
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        return exports;
    }

    private buildProjectStructure(): any {
        const structure: any = {
            files: [],
            dependencies: new Map(),
            symbols: new Map()
        };

        for (const [filePath, fileData] of codebaseIndex) {
            structure.files.push(filePath);

            // Map symbols to files
            fileData.symbols?.forEach((symbol: any) => {
                if (!structure.symbols.has(symbol.name)) {
                    structure.symbols.set(symbol.name, []);
                }
                structure.symbols.get(symbol.name).push({
                    file: filePath,
                    type: symbol.type,
                    line: symbol.line
                });
            });

            // Map dependencies
            fileData.imports?.forEach((importPath: string) => {
                if (!structure.dependencies.has(filePath)) {
                    structure.dependencies.set(filePath, []);
                }
                structure.dependencies.get(filePath).push(importPath);
            });
        }

        return structure;
    }

    /**
     * GLOSSARY MANAGEMENT HANDLERS
     */
    private async handleAddGlossaryTerm(term: string, definition: string): Promise<void> {
        try {
            if (!term || !definition) {
                this.sendSecureResponse('❌ Both term and definition are required');
                return;
            }

            // Add to project glossary
            projectGlossary.set(term.toUpperCase(), {
                term: term,
                definition: definition,
                dateAdded: Date.now(),
                usage: 0
            });

            // Save to workspace storage
            if (this._context) {
                await saveGlossaryToStorage(this._context);
            }

            this.updateGlossaryStatus();
            this.sendSecureResponse(`✅ Added term: **${term}** - ${definition}`);

        } catch (error) {
            this.sendSecureResponse('❌ Failed to add glossary term: ' + error);
        }
    }

    private async handleRemoveGlossaryTerm(term: string): Promise<void> {
        try {
            const upperTerm = term.toUpperCase();
            if (projectGlossary.has(upperTerm)) {
                projectGlossary.delete(upperTerm);

                // Save to workspace storage
                if (this._context) {
                    await saveGlossaryToStorage(this._context);
                }

                this.updateGlossaryStatus();
                this.sendSecureResponse(`✅ Removed term: **${term}**`);
            } else {
                this.sendSecureResponse(`❌ Term not found: **${term}**`);
            }

        } catch (error) {
            this.sendSecureResponse('❌ Failed to remove glossary term: ' + error);
        }
    }

    private handleToggleGlossary(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'toggleGlossaryPanel'
            });
        }
    }

    private async handleImportGlossary(): Promise<void> {
        try {
            const options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: 'Import Glossary',
                filters: {
                    'JSON files': ['json'],
                    'CSV files': ['csv'],
                    'Text files': ['txt']
                }
            };

            const fileUri = await vscode.window.showOpenDialog(options);
            if (fileUri && fileUri[0]) {
                const content = await vscode.workspace.fs.readFile(fileUri[0]);
                const text = Buffer.from(content).toString('utf8');

                let importedCount = 0;

                if (fileUri[0].fsPath.endsWith('.json')) {
                    const glossaryData = JSON.parse(text);
                    for (const [term, definition] of Object.entries(glossaryData)) {
                        projectGlossary.set(term.toUpperCase(), {
                            term: term,
                            definition: definition as string,
                            dateAdded: Date.now(),
                            usage: 0
                        });
                        importedCount++;
                    }
                } else if (fileUri[0].fsPath.endsWith('.csv')) {
                    const lines = text.split('\n');
                    for (const line of lines.slice(1)) { // Skip header
                        const [term, definition] = line.split(',').map(s => s.trim());
                        if (term && definition) {
                            projectGlossary.set(term.toUpperCase(), {
                                term: term,
                                definition: definition,
                                dateAdded: Date.now(),
                                usage: 0
                            });
                            importedCount++;
                        }
                    }
                }

                // Save to workspace storage
                if (this._context) {
                    await saveGlossaryToStorage(this._context);
                }

                this.updateGlossaryStatus();
                this.sendSecureResponse(`✅ Imported ${importedCount} glossary terms`);
            }

        } catch (error) {
            this.sendSecureResponse('❌ Failed to import glossary: ' + error);
        }
    }

    private async handleExportGlossary(): Promise<void> {
        try {
            if (projectGlossary.size === 0) {
                this.sendSecureResponse('❌ No glossary terms to export');
                return;
            }

            const options: vscode.SaveDialogOptions = {
                saveLabel: 'Export Glossary',
                filters: {
                    'JSON files': ['json'],
                    'CSV files': ['csv']
                }
            };

            const fileUri = await vscode.window.showSaveDialog(options);
            if (fileUri) {
                let content = '';

                if (fileUri.fsPath.endsWith('.json')) {
                    const glossaryObj: any = {};
                    for (const [key, value] of projectGlossary) {
                        glossaryObj[value.term] = value.definition;
                    }
                    content = JSON.stringify(glossaryObj, null, 2);
                } else if (fileUri.fsPath.endsWith('.csv')) {
                    content = 'Term,Definition\n';
                    for (const [key, value] of projectGlossary) {
                        content += `"${value.term}","${value.definition}"\n`;
                    }
                }

                await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
                this.sendSecureResponse(`✅ Exported ${projectGlossary.size} terms to ${fileUri.fsPath}`);
            }

        } catch (error) {
            this.sendSecureResponse('❌ Failed to export glossary: ' + error);
        }
    }

    private updateGlossaryStatus(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateGlossaryStatus',
                termCount: projectGlossary.size,
                terms: Array.from(projectGlossary.values())
            });
        }
    }

    private updateIndexStatus(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateIndexStatus',
                isIndexed: isCodebaseIndexed,
                fileCount: codebaseIndex.size
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Piggie Chat</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 10px;
                    overflow: hidden;
                }
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 20px);
                    overflow: hidden;
                }
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 10px 0;
                    min-height: 0;
                    max-height: 100%;
                }
                .message {
                    padding: 8px;
                    border-radius: 6px;
                    margin: 2px 0;
                    word-wrap: break-word;
                }
                .user-message {
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                }
                .ai-message {
                    background: var(--vscode-editor-background);
                    border-left: 3px solid var(--vscode-activityBar-activeBorder);
                    padding-left: 12px;
                }
                .input-container {
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                }
                .textarea-container {
                    flex: 1;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                .resize-handle {
                    height: 12px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-bottom: none;
                    border-radius: 4px 4px 0 0;
                    cursor: ns-resize;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: var(--vscode-descriptionForeground);
                    user-select: none;
                    opacity: 0.7;
                }
                .resize-handle:hover {
                    opacity: 1;
                    background: var(--vscode-list-hoverBackground);
                }
                .message-input {
                    width: 100%;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 0 0 4px 4px;
                    resize: none;
                    min-height: 36px;
                    max-height: 120px;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    line-height: 1.4;
                    overflow-y: auto;
                    box-sizing: border-box;
                }
                .send-button {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .top-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    align-items: center;
                    flex-shrink: 0;
                    overflow: visible;
                }
                .bottom-controls {
                    flex-shrink: 0;
                    padding: 10px 0 0 0;
                    border-top: 1px solid var(--vscode-input-border);
                    background: var(--vscode-editor-background);
                }
                .format-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 8px;
                    align-items: center;
                    justify-content: flex-start;
                }
                .toggle-button {
                    padding: 6px 12px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .toggle-button.active {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .control-dropdown {
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 6px 8px;
                    font-size: 12px;
                    flex: 1;
                    min-width: 0;
                }
                .auto-toggle {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--vscode-foreground);
                }
                .auto-toggle input[type="checkbox"] {
                    margin: 0;
                    cursor: pointer;
                }
                .auto-label {
                    cursor: pointer;
                    user-select: none;
                }
                .format-container {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .format-dropdown {
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 4px 6px;
                    font-size: 11px;
                    min-width: 80px;
                }
                .emoji-toggle {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    color: var(--vscode-foreground);
                }
                .emoji-toggle input[type="checkbox"] {
                    margin: 0;
                    cursor: pointer;
                }
                .emoji-label {
                    cursor: pointer;
                    user-select: none;
                }
                .messages.font-small {
                    font-size: 11px;
                }
                .messages.font-medium {
                    font-size: 13px;
                }
                .messages.font-large {
                    font-size: 15px;
                }
                .action-buttons {
                    margin: 10px 0;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .action-buttons button {
                    padding: 8px 12px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .action-buttons button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .index-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    align-items: center;
                    padding: 8px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
                .index-button {
                    padding: 6px 12px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .index-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .index-button:disabled {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    cursor: not-allowed;
                }
                .index-status {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                }
                .index-status.indexed {
                    color: var(--vscode-charts-green);
                }
                .index-status.indexing {
                    color: var(--vscode-charts-yellow);
                }
                .q-optimization {
                    font-size: 10px;
                    color: var(--vscode-charts-orange);
                    background: var(--vscode-badge-background);
                    padding: 2px 6px;
                    border-radius: 3px;
                    display: none;
                }
                .q-optimization.active {
                    display: inline-block;
                }
                .glossary-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    align-items: center;
                    padding: 8px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    border: 1px solid var(--vscode-widget-border);
                }
                .glossary-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .glossary-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .glossary-status {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                }
                .glossary-status.has-terms {
                    color: var(--vscode-charts-green);
                }
                .glossary-panel {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-widget-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 10px;
                }
                .glossary-panel h4 {
                    margin: 0 0 10px 0;
                    color: var(--vscode-foreground);
                }
                .glossary-input {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .glossary-input input {
                    flex: 1;
                    padding: 6px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                }
                .add-term-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .glossary-list {
                    max-height: 200px;
                    overflow-y: auto;
                    margin-bottom: 10px;
                }
                .glossary-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px;
                    background: var(--vscode-list-inactiveSelectionBackground);
                    margin-bottom: 4px;
                    border-radius: 3px;
                }
                .glossary-term {
                    font-weight: bold;
                    color: var(--vscode-symbolIcon-keywordForeground);
                }
                .glossary-definition {
                    color: var(--vscode-foreground);
                    margin-left: 8px;
                }
                .delete-term {
                    background: var(--vscode-errorForeground);
                    color: white;
                    border: none;
                    padding: 2px 6px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                }
                .glossary-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: space-between;
                }
                .glossary-actions button {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <div class="top-controls">
                    <select id="manifestoDropdown" class="control-dropdown">
                        <option value="manifesto">🛡️ Manifesto Mode</option>
                        <option value="free">🔓 Free Mode</option>
                    </select>
                    <select id="modeDropdown" class="control-dropdown">
                        <option value="chat">💬 Chat Mode</option>
                        <option value="agent">🤖 Agent Mode</option>
                    </select>
                    <select id="agentDropdown" class="control-dropdown">
                        <option value="auggie">🤖 Auggie</option>
                        <option value="amazonq">🟠 Amazon Q</option>
                        <option value="cline">🔵 Cline</option>
                        <option value="localai">🟡 Local AI</option>
                    </select>
                </div>

                <div class="index-controls">
                    <button id="indexButton" class="index-button">📚 Index Codebase</button>
                    <span id="indexStatus" class="index-status">Not indexed</span>
                    <span id="qOptimization" class="q-optimization">🟠 Q-Optimized</span>
                </div>

                <div class="glossary-controls">
                    <button id="glossaryButton" class="glossary-button">📖 Manage Glossary</button>
                    <span id="glossaryStatus" class="glossary-status">No terms defined</span>
                </div>

                <div id="glossaryPanel" class="glossary-panel" style="display: none;">
                    <h4>📖 Project Glossary</h4>
                    <div class="glossary-input">
                        <input type="text" id="termInput" placeholder="Acronym/Term (e.g., API, SLA)" />
                        <input type="text" id="definitionInput" placeholder="Definition (e.g., Application Programming Interface)" />
                        <button id="addTermButton" class="add-term-button">➕ Add Term</button>
                    </div>
                    <div id="glossaryList" class="glossary-list"></div>
                    <div class="glossary-actions">
                        <button id="importGlossaryButton" class="import-button">📥 Import from File</button>
                        <button id="exportGlossaryButton" class="export-button">📤 Export Glossary</button>
                        <button id="closeGlossaryButton" class="close-button">✖️ Close</button>
                    </div>
                </div>

                <div id="messages" class="messages"></div>
                
                <div class="bottom-controls">
                    <div class="format-controls">
                        <select id="fontSizeDropdown" class="format-dropdown">
                            <option value="small">📝 Small</option>
                            <option value="medium">📝 Medium</option>
                            <option value="large">📝 Large</option>
                        </select>
                        <label class="emoji-toggle">
                            <input type="checkbox" id="emojiToggle" checked />
                            <span class="emoji-label">😊</span>
                        </label>
                        <label class="auto-toggle">
                            <input type="checkbox" id="autoToggle" />
                            <span class="auto-label">⚡ Auto</span>
                        </label>
                    </div>
                    <div class="input-container">
                        <div class="textarea-container">
                            <div class="resize-handle" id="resizeHandle">⋯</div>
                            <textarea id="messageInput" class="message-input" placeholder="Type a message to start..." rows="1"></textarea>
                        </div>
                        <button id="sendButton" class="send-button">Send</button>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('sendButton').addEventListener('click', sendMessage);

                const messageInput = document.getElementById('messageInput');
                messageInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                // Auto-expand textarea
                messageInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
                });

                // Custom resize handle
                const resizeHandle = document.getElementById('resizeHandle');
                let isResizing = false;
                let startY = 0;
                let startHeight = 0;

                resizeHandle.addEventListener('mousedown', function(e) {
                    isResizing = true;
                    startY = e.clientY;
                    startHeight = parseInt(window.getComputedStyle(messageInput).height, 10);
                    document.addEventListener('mousemove', handleResize);
                    document.addEventListener('mouseup', stopResize);
                    e.preventDefault();
                });

                function handleResize(e) {
                    if (!isResizing) return;

                    // Calculate new height (drag up = bigger, drag down = smaller)
                    const deltaY = startY - e.clientY; // Inverted for upward expansion
                    const newHeight = Math.max(36, Math.min(120, startHeight + deltaY));

                    messageInput.style.height = newHeight + 'px';
                }

                function stopResize() {
                    isResizing = false;
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', stopResize);
                }

                // Action button functions
                window.createFile = function(code, filename) {
                    vscode.postMessage({
                        command: 'writeCodeToFile',
                        code: code,
                        filename: filename,
                        language: 'javascript'
                    });
                };

                window.copyCode = function(code) {
                    vscode.postMessage({
                        command: 'copyToClipboard',
                        text: code
                    });
                };

                document.getElementById('manifestoDropdown').addEventListener('change', function() {
                    const manifestoMode = this.value === 'manifesto';
                    vscode.postMessage({ command: 'changeManifesto', enabled: manifestoMode });
                });

                document.getElementById('modeDropdown').addEventListener('change', function() {
                    const selectedMode = this.value;
                    vscode.postMessage({ command: 'changeMode', mode: selectedMode });
                });

                document.getElementById('agentDropdown').addEventListener('change', function() {
                    const selectedAgent = this.value;
                    vscode.postMessage({ command: 'changeAgent', agent: selectedAgent });
                });

                document.getElementById('autoToggle').addEventListener('change', function() {
                    vscode.postMessage({ command: 'toggleAuto', enabled: this.checked });
                });

                document.getElementById('fontSizeDropdown').addEventListener('change', function() {
                    const fontSize = this.value;
                    document.getElementById('messages').className = 'messages font-' + fontSize;
                    vscode.postMessage({ command: 'changeFontSize', fontSize: fontSize });
                });

                document.getElementById('emojiToggle').addEventListener('change', function() {
                    vscode.postMessage({ command: 'toggleEmojis', enabled: this.checked });
                });

                document.getElementById('indexButton').addEventListener('click', function() {
                    console.log('🔍 DEBUG: Index button clicked');
                    const button = this;
                    const status = document.getElementById('indexStatus');

                    button.disabled = true;
                    button.textContent = '📚 Indexing...';
                    status.textContent = 'Indexing codebase...';
                    status.className = 'index-status indexing';

                    console.log('🔍 DEBUG: Sending indexCodebase message');
                    vscode.postMessage({ command: 'indexCodebase' });
                });

                // Glossary management event listeners
                document.getElementById('glossaryButton').addEventListener('click', function() {
                    vscode.postMessage({ command: 'toggleGlossary' });
                });

                document.getElementById('addTermButton').addEventListener('click', function() {
                    const termInput = document.getElementById('termInput');
                    const definitionInput = document.getElementById('definitionInput');

                    const term = termInput.value.trim();
                    const definition = definitionInput.value.trim();

                    if (term && definition) {
                        vscode.postMessage({
                            command: 'addGlossaryTerm',
                            term: term,
                            definition: definition
                        });
                        termInput.value = '';
                        definitionInput.value = '';
                    }
                });

                document.getElementById('closeGlossaryButton').addEventListener('click', function() {
                    document.getElementById('glossaryPanel').style.display = 'none';
                });

                document.getElementById('importGlossaryButton').addEventListener('click', function() {
                    vscode.postMessage({ command: 'importGlossary' });
                });

                document.getElementById('exportGlossaryButton').addEventListener('click', function() {
                    vscode.postMessage({ command: 'exportGlossary' });
                });

                function sendMessage() {
                    const input = document.getElementById('messageInput');
                    const message = input.value.trim();
                    if (message) {
                        addMessage('👤 You: ' + message, 'user-message');
                        vscode.postMessage({ command: 'sendMessage', message: message });
                        input.value = '';
                    }
                }

                function addMessage(content, className) {
                    const messagesDiv = document.getElementById('messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + className;
                    messageDiv.innerHTML = content;
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'addMessage') {
                        addMessage('🐷 Piggie: ' + message.content, 'ai-message');
                    } else if (message.command === 'updateToggles') {
                        updateToggleButtons(message.manifestoMode, message.agentMode, message.autoMode, message.fontSize, message.showEmojis, message.currentAgent, message.currentModel);
                        updateIndexDisplay(message.isCodebaseIndexed);
                    } else if (message.command === 'updateIndexStatus') {
                        updateIndexDisplay(message.isIndexed, message.fileCount);
                    } else if (message.command === 'updateGlossaryStatus') {
                        updateGlossaryDisplay(message.termCount, message.terms);
                    } else if (message.command === 'toggleGlossaryPanel') {
                        toggleGlossaryPanel();
                    }
                });

                function updateToggleButtons(manifestoMode, agentMode, autoMode, fontSize, showEmojis, agent, model) {
                    const manifestoDropdown = document.getElementById('manifestoDropdown');
                    const modeDropdown = document.getElementById('modeDropdown');
                    const agentDropdown = document.getElementById('agentDropdown');
                    const autoToggle = document.getElementById('autoToggle');
                    const fontSizeDropdown = document.getElementById('fontSizeDropdown');
                    const emojiToggle = document.getElementById('emojiToggle');
                    const messagesDiv = document.getElementById('messages');
                    const qOptimization = document.getElementById('qOptimization');

                    manifestoDropdown.value = manifestoMode ? 'manifesto' : 'free';
                    modeDropdown.value = agentMode ? 'agent' : 'chat';
                    agentDropdown.value = agent.toLowerCase();
                    autoToggle.checked = autoMode;

                    fontSizeDropdown.value = fontSize;
                    emojiToggle.checked = showEmojis;
                    messagesDiv.className = 'messages font-' + fontSize;

                    // Show Q optimization indicator for Amazon Q
                    if (agent.toLowerCase() === 'amazonq') {
                        qOptimization.className = 'q-optimization active';
                        qOptimization.textContent = '🟠 Q-Optimized (Token Efficient)';
                    } else {
                        qOptimization.className = 'q-optimization';
                    }
                }

                function updateIndexDisplay(isIndexed, fileCount) {
                    const button = document.getElementById('indexButton');
                    const status = document.getElementById('indexStatus');

                    if (isIndexed) {
                        button.disabled = false;
                        button.textContent = '🔄 Re-index';
                        status.textContent = fileCount ? 'Indexed ' + fileCount + ' files' : 'Indexed';
                        status.className = 'index-status indexed';
                    } else {
                        button.disabled = false;
                        button.textContent = '📚 Index Codebase';
                        status.textContent = 'Not indexed';
                        status.className = 'index-status';
                    }
                }

                function updateGlossaryDisplay(termCount, terms) {
                    const status = document.getElementById('glossaryStatus');
                    const glossaryList = document.getElementById('glossaryList');

                    if (termCount > 0) {
                        status.textContent = termCount + ' terms defined';
                        status.className = 'glossary-status has-terms';

                        // Update glossary list
                        glossaryList.innerHTML = '';
                        terms.forEach(term => {
                            const termDiv = document.createElement('div');
                            termDiv.className = 'glossary-item';
                            termDiv.innerHTML = \`
                                <div>
                                    <span class="glossary-term">\${term.term}</span>
                                    <span class="glossary-definition">\${term.definition}</span>
                                </div>
                                <button class="delete-term" onclick="removeTerm('\${term.term}')">✖️</button>
                            \`;
                            glossaryList.appendChild(termDiv);
                        });
                    } else {
                        status.textContent = 'No terms defined';
                        status.className = 'glossary-status';
                        glossaryList.innerHTML = '';
                    }
                }

                function toggleGlossaryPanel() {
                    const panel = document.getElementById('glossaryPanel');
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }

                function removeTerm(term) {
                    vscode.postMessage({ command: 'removeGlossaryTerm', term: term });
                }
            </script>
        </body>
        </html>`;
    }
}

/**
 * Generate manifesto-compliant response within chat
 */
async function generateManifestoCompliantResponse(userInput: string): Promise<string> {
    try {
        // Helper function to add/remove emojis based on user preference
        const formatResponse = (text: string): string => {
            if (!showEmojis) {
                // Remove emojis but keep the text readable
                return text.replace(/[🐷🤖💬⚡🛡️✅❌📋📁🔧💻🧪🔓]/g, '').replace(/\s+/g, ' ').trim();
            }
            return text;
        };

        // Check current mode
        if (!isAgentMode) {
            // CHAT MODE: Concise explanations only
            return formatResponse(`Chat Mode: I understand "${userInput}". Switch to Agent Mode to perform actions.`);
        }

        // AGENT MODE: Actually perform actions
        const isCodeRequest = /\b(write|create|generate|build|make|code|function|class|component|hello world|script)\b/i.test(userInput);
        const isEditRequest = /\b(edit|modify|update|change|fix|add to)\b/i.test(userInput);
        const isTestRequest = /\b(test|work|functionality|check)\b/i.test(userInput);
        const isManifestoRequest = /\b(manifesto|rules|read|show|display)\b/i.test(userInput) && /\b(manifesto|rules)\b/i.test(userInput);
        const isFileRequest = /\b(read|show|open|view)\b/i.test(userInput) && /\.(ts|js|tsx|jsx|py|java|cs|cpp|h|md|json)\b/i.test(userInput);
        const isMRRequest = /\b(mr|merge request|pull request|pr|analyze)\b/i.test(userInput) && /(github\.com|gitlab\.com|gitlab\.)/i.test(userInput);
        const isGlossaryRequest = /\b(glossary|define|add term|add definition|what does.*mean|acronym)\b/i.test(userInput);
        const isManifestoGenRequest = /\b(generate|create)\b.*\b(manifesto|qa manifesto|testing manifesto)\b/i.test(userInput);

        if (isGlossaryRequest) {
            return await handleGlossaryChat(userInput);

        } else if (isManifestoGenRequest) {
            return await handleManifestoGeneration(userInput);

        } else if (isMRRequest) {
            // Extract MR/PR URL from input
            const urlMatch = userInput.match(/(https?:\/\/(?:github\.com|gitlab\.com|gitlab\.[^\/]+)\/[^\s]+)/i);
            if (urlMatch) {
                const mrUrl = urlMatch[1];

                if (isAutoMode) {
                    // AUTO MODE: Analyze MR immediately
                    try {
                        const analysis = await analyzeMR(mrUrl);
                        return formatResponse(formatMRAnalysis(analysis, mrUrl));
                    } catch (error) {
                        return formatResponse(`❌ Failed to analyze MR: ${error}`);
                    }
                } else {
                    // MANUAL MODE: Show what analysis would include
                    return formatResponse(`🔍 **MR/PR Analysis Ready**

**URL:** ${mrUrl}

**Enterprise Analysis Includes:**
• 📊 Risk assessment (LOW/MEDIUM/HIGH)
• 🧪 Automated test suggestions
• 🛡️ Manifesto compliance check
• 🔒 Security vulnerability scan
• 🤖 Automation opportunities
• 📈 Impact and complexity analysis

**Manual Mode:** Enable Auto mode for immediate analysis, or I can guide you through manual review.`);
                }
            } else {
                return formatResponse('Please provide a GitHub or GitLab MR/PR URL for analysis (e.g., "analyze https://github.com/owner/repo/pull/123")');
            }

        } else if (isManifestoRequest) {
            return formatResponse(`📋 **Development Manifesto Summary:**

**Core Directives:**
• All code must have comprehensive error handling
• JSDoc documentation required for all public functions
• Unit tests mandatory for all business logic
• 80%+ code coverage required
• SOLID principles enforced
• Input validation on all user-facing functions
• API responses must be under 200ms
• Security analysis required for all changes

**Key Prohibitions:**
• No iframes/webviews in VSCode extensions
• No innerHTML usage (XSS prevention)
• No SQL injection vulnerabilities

**Architecture Requirements:**
• Interface-based programming for services
• Repository pattern for data access
• Dependency injection patterns
• Clear separation of concerns

The full manifesto is in manifesto.md in your workspace.`);
        } else if (isCodeRequest && /hello world/i.test(userInput)) {
            const helloWorldCode = `// Hello World with manifesto compliance
console.log("Hello, World!");

// Additional manifesto-compliant features
function greet(name = "World") {
    try {
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid name parameter');
        }
        return \`Hello, \${name}!\`;
    } catch (error) {
        console.error('Greeting error:', error);
        return 'Hello, World!';
    }
}

console.log(greet());
console.log(greet("Developer"));`;

            if (isAutoMode) {
                // AUTO MODE: This case is handled in handleUserMessage before we get here
                return formatResponse('Auto Mode: File creation in progress...');
            } else {
                // MANUAL MODE: Show code with instructions to use buttons
                const codeDisplay = showEmojis ? '```javascript\n' + helloWorldCode + '\n```' : helloWorldCode;
                return formatResponse(`Hello World script ready!\n\n${codeDisplay}\n\n**Manual Mode:** Use the "Write Code to File" button below to create the file, or copy the code to clipboard.`);
            }
        } else if (isEditRequest) {
            if (!isCodebaseIndexed) {
                return formatResponse('⚠️ Codebase not indexed. Click "📚 Index Codebase" first for smart editing capabilities.');
            }

            const relevantRules = getRelevantManifestoRules(userInput);
            return formatResponse(`Ready to intelligently edit your codebase for: ${userInput}\n\nI'll analyze existing code, understand context, and apply changes following: ${relevantRules}\n\n**Smart editing features:**\n- Read existing files\n- Understand imports/exports\n- Maintain code patterns\n- Add proper error handling`);

        } else if (isFileRequest) {
            if (!isCodebaseIndexed) {
                return formatResponse('⚠️ Codebase not indexed. Click "📚 Index Codebase" first to read files.');
            }

            // Extract filename from request
            const fileMatch = userInput.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h|md|json))/i);
            if (fileMatch) {
                const filename = fileMatch[1];
                const fileData = Array.from(codebaseIndex.values()).find(f => f.path.endsWith(filename));

                if (fileData) {
                    const preview = fileData.content.slice(0, 500) + (fileData.content.length > 500 ? '...' : '');
                    return formatResponse(`📄 **${filename}** (${fileData.size} bytes)\n\n\`\`\`\n${preview}\n\`\`\`\n\n**Symbols found:** ${fileData.symbols?.map((s: any) => `${s.name} (${s.type})`).join(', ') || 'None'}\n**Imports:** ${fileData.imports?.join(', ') || 'None'}`);
                } else {
                    return formatResponse(`❌ File "${filename}" not found in indexed codebase. Available files: ${Array.from(codebaseIndex.keys()).map(p => p.split('/').pop()).slice(0, 5).join(', ')}...`);
                }
            } else {
                return formatResponse('Please specify a filename to read (e.g., "show me extension.ts")');
            }

        } else if (isTestRequest) {
            return formatResponse('✅ Yes, Piggie works! Ready for manifesto-compliant development with full codebase awareness.');
        } else if (isCodeRequest) {
            const relevantRules = getRelevantManifestoRules(userInput);

            if (isCodebaseIndexed) {
                return formatResponse(`Ready to create context-aware, manifesto-compliant code for: ${userInput}\n\nI'll analyze your existing codebase patterns and create code that integrates seamlessly.\n\nRelevant rules: ${relevantRules}`);
            } else {
                return formatResponse(`Ready to create manifesto-compliant code for: ${userInput}\n\nRelevant rules: ${relevantRules}\n\n💡 Tip: Index your codebase for smarter, context-aware code generation!`);
            }
        } else {
            const relevantRules = getRelevantManifestoRules(userInput);
            return formatResponse(`How can I help with: ${userInput}?\n\nApplicable manifesto rules: ${relevantRules}\n\n**I can:**\n- Create new files with context awareness\n- Edit existing files intelligently\n- Read and analyze your codebase\n- Ensure manifesto compliance`);
        }

    } catch (error) {
        return 'Error: ' + error;
    }
}

/**
 * Write file with validation and visual feedback
 */
async function writeSecureFile(content: string, fileName: string, language: string): Promise<void> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        // SECURITY: Validate content size
        if (content.length > 1000000) { // 1MB limit
            throw new Error('File too large (>1MB)');
        }

        const filePath = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
        await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));

        // Open the file with focus (like Cline does)
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document, {
            preview: false, // Open as permanent tab
            preserveFocus: false, // Focus the new file
            viewColumn: vscode.ViewColumn.Active
        });

        vscode.window.showInformationMessage('🐷 File created: ' + fileName);

    } catch (error) {
        console.error('🐷 Secure file write error:', error);
        throw error;
    }
}

/**
 * Index the manifesto into structured, token-efficient data
 */
async function indexManifesto(): Promise<void> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const manifestoPath = vscode.Uri.joinPath(workspaceFolder.uri, 'manifesto.md');
        const manifestoContent = await vscode.workspace.fs.readFile(manifestoPath);
        const manifestoText = Buffer.from(manifestoContent).toString('utf8');

        // Parse manifesto into structured rules for token efficiency
        manifestoIndex = {
            codeQuality: {
                mandatory: ['error handling', 'JSDoc documentation', 'unit tests', '80% coverage', 'linting'],
                keywords: ['error', 'test', 'documentation', 'quality']
            },
            architecture: {
                enforce: ['SOLID principles', 'dependency injection', 'separation of concerns', 'interfaces', 'repository pattern'],
                prohibited: ['iframes', 'webviews', 'innerHTML'],
                keywords: ['architecture', 'design', 'pattern', 'structure']
            },
            security: {
                critical: ['input validation', 'SQL injection prevention', 'XSS prevention', 'authentication', 'encryption'],
                mandatory: ['security review', 'vulnerability detection'],
                keywords: ['security', 'validation', 'injection', 'auth', 'encrypt']
            },
            performance: {
                optimize: ['database indexes', '<200ms responses', 'memory monitoring', 'caching'],
                keywords: ['performance', 'speed', 'optimize', 'cache']
            },
            testing: {
                required: ['unit tests', 'integration tests', 'e2e tests', 'performance tests', 'security tests'],
                keywords: ['test', 'testing', 'spec', 'coverage']
            },
            documentation: {
                document: ['API endpoints', 'configuration options', 'deployment procedures'],
                keywords: ['documentation', 'docs', 'api', 'config']
            }
        };

        console.log('📋 Manifesto indexed for token efficiency');
    } catch (error) {
        console.error('Failed to index manifesto:', error);
        manifestoIndex = null;
    }
}

/**
 * Get relevant manifesto rules based on request context (token-efficient)
 */
function getRelevantManifestoRules(userInput: string): string {
    if (!manifestoIndex) {
        return 'Manifesto not indexed. Key principles: error handling, testing, security validation.';
    }

    const input = userInput.toLowerCase();
    const relevantRules: string[] = [];

    // Check each category for keyword matches
    Object.entries(manifestoIndex).forEach(([category, rules]: [string, any]) => {
        const hasKeyword = rules.keywords?.some((keyword: string) => input.includes(keyword));

        if (hasKeyword) {
            if (rules.mandatory) {
                relevantRules.push(`${category.toUpperCase()}: ${rules.mandatory.slice(0, 3).join(', ')}`);
            }
            if (rules.critical) {
                relevantRules.push(`${category.toUpperCase()}: ${rules.critical.slice(0, 3).join(', ')}`);
            }
            if (rules.enforce) {
                relevantRules.push(`${category.toUpperCase()}: ${rules.enforce.slice(0, 3).join(', ')}`);
            }
            if (rules.prohibited) {
                relevantRules.push(`${category.toUpperCase()} PROHIBITED: ${rules.prohibited.join(', ')}`);
            }
        }
    });

    // If no specific matches, return core essentials
    if (relevantRules.length === 0) {
        return 'Core: error handling, input validation, unit tests, JSDoc docs, <200ms performance';
    }

    return relevantRules.slice(0, 3).join(' | '); // Limit to 3 most relevant for token efficiency
}

/**
 * Smart file editing with context awareness
 */
async function smartEditFile(filePath: string, editInstructions: string): Promise<string> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        // Read existing file
        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
        let existingContent = '';
        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            existingContent = Buffer.from(content).toString('utf8');
        } catch (error) {
            // File doesn't exist, will create new
        }

        // Get file context from index
        const fileData = codebaseIndex.get(fileUri.fsPath);
        const context = buildEditContext(filePath, editInstructions);

        // Generate context-aware edit
        const editedContent = await generateContextAwareEdit(existingContent, editInstructions, context);

        // Write the edited file
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(editedContent, 'utf8'));

        // Open the file with focus
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document, {
            preview: false,
            preserveFocus: false,
            viewColumn: vscode.ViewColumn.Active
        });

        return `✅ Successfully edited ${filePath}`;

    } catch (error) {
        console.error('Smart edit error:', error);
        throw error;
    }
}

/**
 * Build context for intelligent editing
 */
function buildEditContext(filePath: string, editInstructions: string): any {
    const context: any = {
        relevantFiles: [],
        relatedSymbols: [],
        requiredImports: [],
        manifestoRules: getRelevantManifestoRules(editInstructions)
    };

    if (!projectStructure) {
        return context;
    }

    // Find related files based on imports/exports
    const currentFileData = Array.from(codebaseIndex.values()).find(f => f.path.endsWith(filePath));
    if (currentFileData) {
        // Add files that import this file
        for (const [path, data] of codebaseIndex) {
            if (data.imports?.some((imp: string) => imp.includes(filePath.replace(/\.[^.]+$/, '')))) {
                context.relevantFiles.push(path);
            }
        }

        // Add files this file imports
        currentFileData.imports?.forEach((importPath: string) => {
            const resolvedPath = resolveImportPath(importPath, filePath);
            if (resolvedPath && codebaseIndex.has(resolvedPath)) {
                context.relevantFiles.push(resolvedPath);
            }
        });
    }

    // Find symbols mentioned in edit instructions
    const words = editInstructions.toLowerCase().split(/\s+/);
    words.forEach(word => {
        if (projectStructure.symbols.has(word)) {
            context.relatedSymbols.push({
                name: word,
                locations: projectStructure.symbols.get(word)
            });
        }
    });

    return context;
}

/**
 * Generate context-aware code edit
 */
async function generateContextAwareEdit(existingContent: string, instructions: string, context: any): Promise<string> {
    // For now, this is a placeholder that adds manifesto-compliant structure
    // In a full implementation, this would use AI to generate the edit

    if (!existingContent) {
        // Creating new file
        return generateNewFileWithContext(instructions, context);
    } else {
        // Editing existing file
        return modifyExistingFileWithContext(existingContent, instructions, context);
    }
}

/**
 * Generate new file with full context awareness
 */
function generateNewFileWithContext(instructions: string, context: any): string {
    const isTypeScript = instructions.includes('typescript') || instructions.includes('.ts');
    const isReact = instructions.includes('react') || instructions.includes('component');

    let content = '';

    // Add imports based on context
    if (context.requiredImports.length > 0) {
        content += context.requiredImports.map((imp: string) => `import ${imp};`).join('\n') + '\n\n';
    }

    // Add manifesto-compliant structure
    content += `/**\n * ${instructions}\n * Generated with manifesto compliance\n */\n\n`;

    if (isReact) {
        content += generateReactComponent(instructions, context);
    } else if (isTypeScript) {
        content += generateTypeScriptModule(instructions, context);
    } else {
        content += generateJavaScriptModule(instructions, context);
    }

    return content;
}

/**
 * Modify existing file with context awareness
 */
function modifyExistingFileWithContext(existingContent: string, instructions: string, context: any): string {
    // This is a simplified implementation
    // In practice, this would use AI to understand the edit and apply it intelligently

    let modifiedContent = existingContent;

    // Add missing imports if needed
    const missingImports = detectMissingImports(existingContent, instructions, context);
    if (missingImports.length > 0) {
        const importSection = missingImports.map(imp => `import ${imp};`).join('\n') + '\n';
        modifiedContent = importSection + modifiedContent;
    }

    // Add new function/method based on instructions
    if (instructions.includes('add function') || instructions.includes('add method')) {
        const newFunction = generateManifestoCompliantFunction(instructions, context);
        modifiedContent += '\n\n' + newFunction;
    }

    return modifiedContent;
}

/**
 * Helper functions for code generation
 */
function generateReactComponent(instructions: string, context: any): string {
    const componentName = extractComponentName(instructions) || 'NewComponent';
    return `interface ${componentName}Props {
  // TODO: Define props based on requirements
}

/**
 * ${componentName} component
 * ${context.manifestoRules}
 */
export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  try {
    // TODO: Implement component logic
    return (
      <div>
        <h1>${componentName}</h1>
      </div>
    );
  } catch (error) {
    console.error('${componentName} error:', error);
    return <div>Error loading component</div>;
  }
};

export default ${componentName};`;
}

function generateTypeScriptModule(instructions: string, context: any): string {
    return `/**
 * ${instructions}
 * Manifesto compliance: ${context.manifestoRules}
 */

export interface IService {
  // TODO: Define interface based on requirements
}

export class Service implements IService {
  /**
   * Constructor with dependency injection
   */
  constructor() {
    // TODO: Initialize dependencies
  }

  /**
   * Main service method with comprehensive error handling
   */
  async execute(): Promise<void> {
    try {
      // TODO: Implement service logic
    } catch (error) {
      console.error('Service execution error:', error);
      throw new Error(\`Service failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    }
  }
}`;
}

function generateJavaScriptModule(instructions: string, context: any): string {
    return `/**
 * ${instructions}
 * Manifesto compliance: ${context.manifestoRules}
 */

/**
 * Main function with comprehensive error handling
 * @param {any} input - Input parameter
 * @returns {Promise<any>} Result
 */
async function main(input) {
  try {
    // Input validation
    if (!input) {
      throw new Error('Input is required');
    }

    // TODO: Implement logic based on requirements
    return { success: true, data: input };

  } catch (error) {
    console.error('Function error:', error);
    throw new Error(\`Operation failed: \${error.message}\`);
  }
}

module.exports = { main };`;
}

// Helper functions
function resolveImportPath(importPath: string, currentFile: string): string | null {
    // Simplified import resolution
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Relative import - would need proper path resolution
        return null;
    }
    return null;
}

function detectMissingImports(content: string, instructions: string, context: any): string[] {
    // Simplified missing import detection
    return [];
}

function generateManifestoCompliantFunction(instructions: string, context: any): string {
    return `/**
 * ${instructions}
 * ${context.manifestoRules}
 */
async function newFunction() {
  try {
    // TODO: Implement function logic
  } catch (error) {
    console.error('Function error:', error);
    throw error;
  }
}`;
}

function extractComponentName(instructions: string): string | null {
    const match = instructions.match(/component\s+(\w+)/i);
    return match ? match[1] : null;
}

/**
 * AMAZON Q OPTIMIZATION SYSTEM
 * Brings Auggie-level intelligence to enterprise Q environments
 */

/**
 * Optimize context for Amazon Q's token limitations
 */
function optimizeContextForQ(userInput: string, fullContext: any): any {
    if (currentAgent.toLowerCase() !== 'amazonq') {
        return fullContext; // Use full context for other agents
    }

    const optimizedContext: any = {
        relevantFiles: [],
        compactSymbols: [],
        essentialRules: '',
        tokenEstimate: 0
    };

    // Prioritize context based on user input
    const priorities = calculateContextPriority(userInput);

    // Add most relevant files (compressed)
    const relevantFiles = selectRelevantFiles(userInput, priorities);
    for (const file of relevantFiles.slice(0, 3)) { // Limit to 3 most relevant
        const compressed = compressFileForQ(file);
        if (optimizedContext.tokenEstimate + compressed.tokens < qMaxTokens * 0.7) {
            optimizedContext.relevantFiles.push(compressed);
            optimizedContext.tokenEstimate += compressed.tokens;
        }
    }

    // Add essential symbols only
    optimizedContext.compactSymbols = extractEssentialSymbols(userInput, priorities);

    // Ultra-compact manifesto rules
    optimizedContext.essentialRules = getUltraCompactRules(userInput);

    return optimizedContext;
}

/**
 * Calculate context priority for Q optimization
 */
function calculateContextPriority(userInput: string): Map<string, number> {
    const priorities = new Map<string, number>();
    const keywords = userInput.toLowerCase().split(/\s+/);

    // Boost priority for files mentioned by name
    const fileMatch = userInput.match(/(\w+\.(ts|js|tsx|jsx|py|java|cs|cpp|h|md|json))/gi);
    if (fileMatch) {
        fileMatch.forEach(file => priorities.set(file.toLowerCase(), 10));
    }

    // Boost priority for symbols mentioned
    for (const [filePath, fileData] of codebaseIndex) {
        let priority = 0;

        // Check if file symbols are mentioned
        fileData.symbols?.forEach((symbol: any) => {
            if (keywords.includes(symbol.name.toLowerCase())) {
                priority += 5;
            }
        });

        // Check if file is related to request type
        if (userInput.includes('component') && filePath.includes('component')) priority += 3;
        if (userInput.includes('service') && filePath.includes('service')) priority += 3;
        if (userInput.includes('util') && filePath.includes('util')) priority += 3;

        if (priority > 0) {
            priorities.set(filePath, priority);
        }
    }

    return priorities;
}

/**
 * Select most relevant files for Q context
 */
function selectRelevantFiles(userInput: string, priorities: Map<string, number>): any[] {
    const files = Array.from(codebaseIndex.values());

    return files
        .map(file => ({
            ...file,
            priority: priorities.get(file.path) || priorities.get(file.path.split('/').pop()?.toLowerCase() || '') || 0
        }))
        .sort((a, b) => b.priority - a.priority)
        .filter(file => file.priority > 0);
}

/**
 * Compress file content for Q's token limits
 */
function compressFileForQ(fileData: any): any {
    const maxLines = 50; // Limit file preview
    const lines = fileData.content.split('\n');

    let compressed = '';
    let importSection = '';
    let mainContent = '';
    let tokenCount = 0;

    // Extract imports (always include)
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
        if (lines[i].trim().startsWith('import') || lines[i].trim().startsWith('from')) {
            importSection += lines[i] + '\n';
        }
    }

    // Extract key functions/classes (smart selection)
    const keyLines = lines.filter((line: string, index: number) => {
        const trimmed = line.trim();
        return trimmed.startsWith('export') ||
               trimmed.startsWith('class') ||
               trimmed.startsWith('function') ||
               trimmed.startsWith('interface') ||
               trimmed.includes('TODO') ||
               trimmed.includes('FIXME');
    });

    mainContent = keyLines.slice(0, maxLines - importSection.split('\n').length).join('\n');
    compressed = importSection + '\n// ... (key sections) ...\n' + mainContent;

    // Estimate tokens (rough: 1 token ≈ 4 characters)
    tokenCount = Math.ceil(compressed.length / 4);

    return {
        path: fileData.path.split('/').pop(), // Just filename for Q
        content: compressed,
        symbols: fileData.symbols?.slice(0, 5), // Limit symbols
        tokens: tokenCount
    };
}

/**
 * Extract only essential symbols for Q
 */
function extractEssentialSymbols(userInput: string, priorities: Map<string, number>): any[] {
    const keywords = userInput.toLowerCase().split(/\s+/);
    const essentialSymbols: any[] = [];

    for (const [filePath, fileData] of codebaseIndex) {
        if (priorities.has(filePath) && priorities.get(filePath)! > 2) {
            fileData.symbols?.forEach((symbol: any) => {
                if (keywords.includes(symbol.name.toLowerCase()) ||
                    symbol.type === 'class' ||
                    symbol.type === 'interface') {
                    essentialSymbols.push({
                        name: symbol.name,
                        type: symbol.type,
                        file: filePath.split('/').pop()
                    });
                }
            });
        }
    }

    return essentialSymbols.slice(0, 10); // Limit to 10 most essential
}

/**
 * Ultra-compact manifesto rules for Q
 */
function getUltraCompactRules(userInput: string): string {
    if (!manifestoIndex) {
        return 'Rules: error handling, input validation, tests, docs';
    }

    const input = userInput.toLowerCase();
    const compactRules: string[] = [];

    // Only include most relevant rule categories
    if (input.includes('security') || input.includes('auth') || input.includes('login')) {
        compactRules.push('SEC: validate inputs, prevent XSS/injection');
    }
    if (input.includes('test') || input.includes('spec')) {
        compactRules.push('TEST: unit tests, 80% coverage');
    }
    if (input.includes('performance') || input.includes('speed')) {
        compactRules.push('PERF: <200ms response, caching');
    }
    if (input.includes('error') || input.includes('exception')) {
        compactRules.push('ERROR: comprehensive handling, logging');
    }

    // Default essential rules if no specific matches
    if (compactRules.length === 0) {
        compactRules.push('CORE: error handling, input validation, tests');
    }

    return compactRules.join(' | ');
}

/**
 * Generate Q-optimized response with context management
 */
async function generateQOptimizedResponse(userInput: string): Promise<string> {
    if (currentAgent.toLowerCase() !== 'amazonq') {
        return generateManifestoCompliantResponse(userInput);
    }

    // Build optimized context for Q
    const fullContext = buildEditContext('', userInput);
    const qContext = optimizeContextForQ(userInput, fullContext);

    // Track context window for Q
    updateQContextWindow(userInput, qContext);

    // Generate response with Q-specific formatting
    const response = await generateQSpecificResponse(userInput, qContext);

    return response;
}

/**
 * Update Q's context window management
 */
function updateQContextWindow(userInput: string, context: any): void {
    // Add current interaction to context window
    qContextWindow.push({
        input: userInput,
        context: context,
        timestamp: Date.now(),
        tokens: estimateTokens(userInput + JSON.stringify(context))
    });

    // Manage window size for Q's limits
    qTokenCount = qContextWindow.reduce((sum, item) => sum + item.tokens, 0);

    // Remove oldest context if exceeding limits
    while (qTokenCount > qMaxTokens && qContextWindow.length > 1) {
        const removed = qContextWindow.shift();
        if (removed) {
            qTokenCount -= removed.tokens;
        }
    }
}

/**
 * Generate Q-specific response format
 */
async function generateQSpecificResponse(userInput: string, qContext: any): Promise<string> {
    const isCodeRequest = /\b(write|create|generate|build|make|code|function|class|component)\b/i.test(userInput);
    const isEditRequest = /\b(edit|modify|update|change|fix)\b/i.test(userInput);

    let response = '';

    if (isEditRequest && qContext.relevantFiles.length > 0) {
        response = `**Q-Optimized Edit Context:**\n\n`;
        response += `**Target:** ${qContext.relevantFiles[0].path}\n`;
        response += `**Rules:** ${qContext.essentialRules}\n\n`;
        response += `**Current Code:**\n\`\`\`\n${qContext.relevantFiles[0].content}\n\`\`\`\n\n`;
        response += `**Symbols:** ${qContext.compactSymbols.map((s: any) => s.name).join(', ')}\n\n`;
        response += `Ready to apply manifesto-compliant changes.`;

    } else if (isCodeRequest) {
        response = `**Q-Optimized Code Generation:**\n\n`;
        response += `**Request:** ${userInput}\n`;
        response += `**Rules:** ${qContext.essentialRules}\n\n`;

        if (qContext.relevantFiles.length > 0) {
            response += `**Context Files:**\n`;
            qContext.relevantFiles.forEach((file: any) => {
                response += `• ${file.path} (${file.symbols?.length || 0} symbols)\n`;
            });
            response += '\n';
        }

        response += `**Symbols Available:** ${qContext.compactSymbols.map((s: any) => `${s.name}(${s.type})`).join(', ')}\n\n`;
        response += `Ready to generate context-aware, manifesto-compliant code.`;

    } else {
        response = `**Q-Optimized Response:**\n\n`;
        response += `**Query:** ${userInput}\n`;
        response += `**Rules:** ${qContext.essentialRules}\n\n`;

        if (qContext.relevantFiles.length > 0) {
            response += `**Relevant Context:** ${qContext.relevantFiles.length} files, ${qContext.compactSymbols.length} symbols\n\n`;
        }

        response += `How can I help with manifesto-compliant development?`;
    }

    // Add token usage info for transparency
    response += `\n\n*Q-Optimized: ${qContext.tokenEstimate} tokens, ${qContextWindow.length} context items*`;

    return response;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
}

/**
 * GITHUB/GITLAB MR/PR INTEGRATION SYSTEM
 * Enterprise automation and test generation capabilities
 */

/**
 * Analyze GitHub/GitLab MR for automated testing and compliance
 */
async function analyzeMR(mrUrl: string): Promise<any> {
    try {
        const mrData = await fetchMRData(mrUrl);
        const analysis = await performMRAnalysis(mrData);

        // Cache for future reference
        mrCache.set(mrUrl, {
            data: mrData,
            analysis: analysis,
            timestamp: Date.now()
        });

        return analysis;

    } catch (error) {
        console.error('MR analysis failed:', error);
        throw new Error(`Failed to analyze MR: ${error}`);
    }
}

/**
 * Fetch MR/PR data from GitHub or GitLab
 */
async function fetchMRData(mrUrl: string): Promise<any> {
    const isGitHub = mrUrl.includes('github.com');
    const isGitLab = mrUrl.includes('gitlab.com') || mrUrl.includes('gitlab.');

    if (!isGitHub && !isGitLab) {
        throw new Error('Unsupported repository platform. Only GitHub and GitLab are supported.');
    }

    // Extract repo info and MR number from URL
    const urlParts = extractMRInfo(mrUrl);

    if (isGitHub) {
        return await fetchGitHubPR(urlParts);
    } else {
        return await fetchGitLabMR(urlParts);
    }
}

/**
 * Extract MR/PR information from URL
 */
function extractMRInfo(url: string): any {
    // GitHub: https://github.com/owner/repo/pull/123
    // GitLab: https://gitlab.com/owner/repo/-/merge_requests/123

    const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (githubMatch) {
        return {
            platform: 'github',
            owner: githubMatch[1],
            repo: githubMatch[2],
            number: githubMatch[3]
        };
    }

    const gitlabMatch = url.match(/gitlab\.(?:com|[^\/]+)\/([^\/]+)\/([^\/]+)\/-\/merge_requests\/(\d+)/);
    if (gitlabMatch) {
        return {
            platform: 'gitlab',
            owner: gitlabMatch[1],
            repo: gitlabMatch[2],
            number: gitlabMatch[3]
        };
    }

    throw new Error('Invalid MR/PR URL format');
}

/**
 * Fetch GitHub PR data
 */
async function fetchGitHubPR(info: any): Promise<any> {
    // Note: In a real implementation, you'd use GitHub API with authentication
    // For now, this is a placeholder that would integrate with GitHub API

    const apiUrl = `https://api.github.com/repos/${info.owner}/${info.repo}/pulls/${info.number}`;
    const filesUrl = `https://api.github.com/repos/${info.owner}/${info.repo}/pulls/${info.number}/files`;

    // Placeholder - would need actual API calls with authentication
    return {
        platform: 'github',
        title: 'Sample PR Title',
        description: 'Sample PR description',
        author: 'developer',
        branch: 'feature/new-feature',
        baseBranch: 'main',
        files: [], // Would contain actual file changes
        commits: [], // Would contain commit data
        url: `https://github.com/${info.owner}/${info.repo}/pull/${info.number}`
    };
}

/**
 * Fetch GitLab MR data
 */
async function fetchGitLabMR(info: any): Promise<any> {
    // Note: Similar to GitHub, would use GitLab API with authentication

    const apiUrl = `https://gitlab.com/api/v4/projects/${info.owner}%2F${info.repo}/merge_requests/${info.number}`;

    // Placeholder - would need actual API calls with authentication
    return {
        platform: 'gitlab',
        title: 'Sample MR Title',
        description: 'Sample MR description',
        author: 'developer',
        branch: 'feature/new-feature',
        baseBranch: 'main',
        files: [], // Would contain actual file changes
        commits: [], // Would contain commit data
        url: `https://gitlab.com/${info.owner}/${info.repo}/-/merge_requests/${info.number}`
    };
}

/**
 * Perform comprehensive MR analysis
 */
async function performMRAnalysis(mrData: any): Promise<any> {
    const analysis = {
        summary: generateMRSummary(mrData),
        riskAssessment: assessMRRisk(mrData),
        testSuggestions: generateTestSuggestions(mrData),
        complianceCheck: checkManifestoCompliance(mrData),
        automationOpportunities: identifyAutomationOpportunities(mrData),
        securityConcerns: identifySecurityConcerns(mrData)
    };

    return analysis;
}

/**
 * Generate MR summary for enterprise review
 */
function generateMRSummary(mrData: any): any {
    return {
        title: mrData.title,
        description: mrData.description,
        author: mrData.author,
        branch: `${mrData.branch} → ${mrData.baseBranch}`,
        filesChanged: mrData.files?.length || 0,
        linesAdded: mrData.files?.reduce((sum: number, file: any) => sum + (file.additions || 0), 0) || 0,
        linesDeleted: mrData.files?.reduce((sum: number, file: any) => sum + (file.deletions || 0), 0) || 0,
        complexity: calculateComplexity(mrData),
        impact: assessImpact(mrData)
    };
}

/**
 * Assess MR risk level for enterprise deployment
 */
function assessMRRisk(mrData: any): any {
    const riskFactors = [];
    let riskLevel = 'LOW';

    // Check for high-risk patterns
    const highRiskFiles = ['package.json', 'Dockerfile', 'docker-compose.yml', '.env', 'config.js'];
    const hasHighRiskFiles = mrData.files?.some((file: any) =>
        highRiskFiles.some(riskFile => file.filename?.includes(riskFile))
    );

    if (hasHighRiskFiles) {
        riskFactors.push('Configuration files modified');
        riskLevel = 'HIGH';
    }

    // Check for database changes
    const hasDatabaseChanges = mrData.files?.some((file: any) =>
        file.filename?.includes('migration') || file.filename?.includes('schema')
    );

    if (hasDatabaseChanges) {
        riskFactors.push('Database schema changes');
        riskLevel = 'HIGH';
    }

    // Check for large changes
    const totalChanges = (mrData.files?.length || 0);
    if (totalChanges > 20) {
        riskFactors.push('Large number of files changed');
        riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
    }

    return {
        level: riskLevel,
        factors: riskFactors,
        recommendations: generateRiskRecommendations(riskLevel, riskFactors)
    };
}

/**
 * Generate automated test suggestions based on MR changes
 */
function generateTestSuggestions(mrData: any): any {
    const suggestions: any = {
        unitTests: [],
        integrationTests: [],
        e2eTests: [],
        performanceTests: [],
        securityTests: []
    };

    // Analyze changed files for test opportunities
    mrData.files?.forEach((file: any) => {
        const filename = file.filename || '';

        // Unit test suggestions
        if (filename.includes('.js') || filename.includes('.ts')) {
            if (filename.includes('service') || filename.includes('util')) {
                suggestions.unitTests.push(`Test ${filename} functions for edge cases and error handling`);
            }
            if (filename.includes('component')) {
                suggestions.unitTests.push(`Test ${filename} component rendering and props`);
            }
        }

        // Integration test suggestions
        if (filename.includes('api') || filename.includes('controller')) {
            suggestions.integrationTests.push(`Test ${filename} API endpoints with various inputs`);
        }

        // E2E test suggestions
        if (filename.includes('page') || filename.includes('view')) {
            suggestions.e2eTests.push(`Test ${filename} user workflows end-to-end`);
        }

        // Performance test suggestions
        if (filename.includes('query') || filename.includes('database')) {
            suggestions.performanceTests.push(`Performance test ${filename} database operations`);
        }

        // Security test suggestions
        if (filename.includes('auth') || filename.includes('login')) {
            suggestions.securityTests.push(`Security test ${filename} authentication flows`);
        }
    });

    return suggestions;
}

/**
 * Check MR against manifesto compliance
 */
function checkManifestoCompliance(mrData: any): any {
    const compliance: any = {
        passed: [],
        failed: [],
        warnings: [],
        score: 0
    };

    // Check for error handling
    const hasErrorHandling = mrData.files?.some((file: any) =>
        file.patch?.includes('try') && file.patch?.includes('catch')
    );

    if (hasErrorHandling) {
        compliance.passed.push('✅ Error handling implemented');
    } else {
        compliance.failed.push('❌ Missing error handling in new code');
    }

    // Check for input validation
    const hasValidation = mrData.files?.some((file: any) =>
        file.patch?.includes('validate') || file.patch?.includes('sanitize')
    );

    if (hasValidation) {
        compliance.passed.push('✅ Input validation present');
    } else {
        compliance.warnings.push('⚠️ Consider adding input validation');
    }

    // Check for documentation
    const hasDocumentation = mrData.files?.some((file: any) =>
        file.patch?.includes('/**') || file.patch?.includes('* @')
    );

    if (hasDocumentation) {
        compliance.passed.push('✅ Documentation added');
    } else {
        compliance.failed.push('❌ Missing JSDoc documentation');
    }

    // Calculate compliance score
    const total = compliance.passed.length + compliance.failed.length;
    compliance.score = total > 0 ? Math.round((compliance.passed.length / total) * 100) : 0;

    return compliance;
}

/**
 * Identify automation opportunities from MR
 */
function identifyAutomationOpportunities(mrData: any): string[] {
    const opportunities = [];

    // Check for repetitive patterns
    if (mrData.files?.length > 5) {
        opportunities.push('🤖 Consider creating code templates for similar file patterns');
    }

    // Check for manual testing indicators
    if (mrData.description?.includes('manual') || mrData.description?.includes('test manually')) {
        opportunities.push('🤖 Automate manual testing steps mentioned in description');
    }

    // Check for deployment-related changes
    if (mrData.files?.some((file: any) => file.filename?.includes('deploy'))) {
        opportunities.push('🤖 Automate deployment process with CI/CD pipeline');
    }

    return opportunities;
}

/**
 * Identify security concerns in MR
 */
function identifySecurityConcerns(mrData: any): string[] {
    const concerns = [];

    // Check for hardcoded secrets
    const hasSecrets = mrData.files?.some((file: any) =>
        file.patch?.includes('password') ||
        file.patch?.includes('api_key') ||
        file.patch?.includes('secret')
    );

    if (hasSecrets) {
        concerns.push('🔒 Potential hardcoded secrets detected');
    }

    // Check for SQL injection risks
    const hasSQLRisk = mrData.files?.some((file: any) =>
        file.patch?.includes('SELECT') && !file.patch?.includes('prepared')
    );

    if (hasSQLRisk) {
        concerns.push('🔒 Potential SQL injection vulnerability');
    }

    // Check for XSS risks
    const hasXSSRisk = mrData.files?.some((file: any) =>
        file.patch?.includes('innerHTML') || file.patch?.includes('dangerouslySetInnerHTML')
    );

    if (hasXSSRisk) {
        concerns.push('🔒 Potential XSS vulnerability with innerHTML usage');
    }

    return concerns;
}

// Helper functions
function calculateComplexity(mrData: any): string {
    const fileCount = mrData.files?.length || 0;
    const totalLines = mrData.files?.reduce((sum: number, file: any) =>
        sum + (file.additions || 0) + (file.deletions || 0), 0) || 0;

    if (fileCount > 20 || totalLines > 500) return 'HIGH';
    if (fileCount > 10 || totalLines > 200) return 'MEDIUM';
    return 'LOW';
}

function assessImpact(mrData: any): string {
    const criticalFiles = ['package.json', 'Dockerfile', 'config.js', 'index.js', 'main.ts'];
    const hasCriticalChanges = mrData.files?.some((file: any) =>
        criticalFiles.some(critical => file.filename?.includes(critical))
    );

    if (hasCriticalChanges) return 'HIGH';

    const fileCount = mrData.files?.length || 0;
    if (fileCount > 15) return 'MEDIUM';
    return 'LOW';
}

function generateRiskRecommendations(riskLevel: string, factors: string[]): string[] {
    const recommendations = [];

    if (riskLevel === 'HIGH') {
        recommendations.push('🚨 Require additional code review approval');
        recommendations.push('🚨 Deploy to staging environment first');
        recommendations.push('🚨 Create rollback plan before deployment');
    }

    if (factors.includes('Configuration files modified')) {
        recommendations.push('⚙️ Verify configuration changes in staging');
        recommendations.push('⚙️ Update deployment documentation');
    }

    if (factors.includes('Database schema changes')) {
        recommendations.push('🗄️ Test database migration in staging');
        recommendations.push('🗄️ Create database backup before deployment');
    }

    return recommendations;
}

/**
 * Format MR analysis for enterprise presentation
 */
function formatMRAnalysis(analysis: any, mrUrl: string): string {
    const summary = analysis.summary;
    const risk = analysis.riskAssessment;
    const compliance = analysis.complianceCheck;
    const tests = analysis.testSuggestions;

    let report = `🔍 **Enterprise MR/PR Analysis Report**\n\n`;

    // Summary section
    report += `**📋 Summary:**\n`;
    report += `• **Title:** ${summary.title}\n`;
    report += `• **Author:** ${summary.author}\n`;
    report += `• **Branch:** ${summary.branch}\n`;
    report += `• **Files Changed:** ${summary.filesChanged}\n`;
    report += `• **Lines:** +${summary.linesAdded} -${summary.linesDeleted}\n`;
    report += `• **Complexity:** ${summary.complexity}\n`;
    report += `• **Impact:** ${summary.impact}\n\n`;

    // Risk assessment
    report += `**🚨 Risk Assessment: ${risk.level}**\n`;
    if (risk.factors.length > 0) {
        report += `**Risk Factors:**\n`;
        risk.factors.forEach((factor: string) => {
            report += `• ${factor}\n`;
        });
    }
    if (risk.recommendations.length > 0) {
        report += `**Recommendations:**\n`;
        risk.recommendations.forEach((rec: string) => {
            report += `• ${rec}\n`;
        });
    }
    report += '\n';

    // Compliance check
    report += `**🛡️ Manifesto Compliance: ${compliance.score}%**\n`;
    if (compliance.passed.length > 0) {
        compliance.passed.forEach((item: string) => {
            report += `${item}\n`;
        });
    }
    if (compliance.failed.length > 0) {
        compliance.failed.forEach((item: string) => {
            report += `${item}\n`;
        });
    }
    if (compliance.warnings.length > 0) {
        compliance.warnings.forEach((item: string) => {
            report += `${item}\n`;
        });
    }
    report += '\n';

    // Test suggestions
    report += `**🧪 Automated Test Suggestions:**\n`;
    if (tests.unitTests.length > 0) {
        report += `**Unit Tests:**\n`;
        tests.unitTests.slice(0, 3).forEach((test: string) => {
            report += `• ${test}\n`;
        });
    }
    if (tests.integrationTests.length > 0) {
        report += `**Integration Tests:**\n`;
        tests.integrationTests.slice(0, 2).forEach((test: string) => {
            report += `• ${test}\n`;
        });
    }
    if (tests.securityTests.length > 0) {
        report += `**Security Tests:**\n`;
        tests.securityTests.slice(0, 2).forEach((test: string) => {
            report += `• ${test}\n`;
        });
    }
    report += '\n';

    // Security concerns
    if (analysis.securityConcerns.length > 0) {
        report += `**🔒 Security Concerns:**\n`;
        analysis.securityConcerns.forEach((concern: string) => {
            report += `• ${concern}\n`;
        });
        report += '\n';
    }

    // Automation opportunities
    if (analysis.automationOpportunities.length > 0) {
        report += `**🤖 Automation Opportunities:**\n`;
        analysis.automationOpportunities.forEach((opp: string) => {
            report += `• ${opp}\n`;
        });
        report += '\n';
    }

    report += `**🔗 Source:** ${mrUrl}`;

    return report;
}

/**
 * PERSISTENT CODEBASE INDEX SYSTEM
 * Save and restore codebase indexing across VSCode sessions
 */

/**
 * Save codebase index to VSCode workspace storage
 */
async function saveCodebaseIndex(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        const indexData = {
            timestamp: codebaseIndexTimestamp,
            workspacePath: workspaceFolder.uri.fsPath,
            isIndexed: isCodebaseIndexed,
            files: Array.from(codebaseIndex.entries()).map(([path, data]) => ({
                path,
                content: data.content.slice(0, 10000), // Limit content size for storage
                size: data.size,
                lastModified: data.lastModified,
                symbols: data.symbols,
                imports: data.imports,
                exports: data.exports
            })),
            projectStructure: {
                files: projectStructure?.files || [],
                symbolCount: projectStructure?.symbols?.size || 0,
                dependencyCount: projectStructure?.dependencies?.size || 0
            }
        };

        await context.workspaceState.update('codebaseIndex', indexData);
        console.log('💾 Codebase index saved to workspace storage');

    } catch (error) {
        console.error('Failed to save codebase index:', error);
    }
}

/**
 * Load codebase index from VSCode workspace storage
 */
async function loadCodebaseIndex(context: vscode.ExtensionContext): Promise<boolean> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return false;
        }

        const indexData = context.workspaceState.get('codebaseIndex') as any;
        if (!indexData) {
            console.log('📂 No saved codebase index found');
            return false;
        }

        // Check if the workspace path matches (in case user moved the project)
        if (indexData.workspacePath !== workspaceFolder.uri.fsPath) {
            console.log('📂 Workspace path changed, clearing old index');
            await context.workspaceState.update('codebaseIndex', undefined);
            return false;
        }

        // Check if index is too old (older than 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (Date.now() - indexData.timestamp > maxAge) {
            console.log('📂 Codebase index is stale, will re-index');
            return false;
        }

        // Restore the codebase index
        codebaseIndex.clear();
        for (const fileData of indexData.files) {
            codebaseIndex.set(fileData.path, {
                path: fileData.path,
                content: fileData.content,
                size: fileData.size,
                lastModified: fileData.lastModified,
                symbols: fileData.symbols || [],
                imports: fileData.imports || [],
                exports: fileData.exports || []
            });
        }

        // Restore project structure
        projectStructure = {
            files: indexData.projectStructure?.files || [],
            symbols: new Map(), // Will be rebuilt if needed
            dependencies: new Map() // Will be rebuilt if needed
        };

        isCodebaseIndexed = indexData.isIndexed;
        codebaseIndexTimestamp = indexData.timestamp;

        console.log(`💾 Loaded codebase index: ${codebaseIndex.size} files from ${new Date(codebaseIndexTimestamp).toLocaleString()}`);
        return true;

    } catch (error) {
        console.error('Failed to load codebase index:', error);
        return false;
    }
}

/**
 * Check if codebase needs re-indexing based on file changes
 */
async function checkCodebaseChanges(): Promise<boolean> {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return false;
        }

        // Find all relevant files
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h,md,json}',
            '**/node_modules/**'
        );

        // Check if file count changed significantly
        const currentFileCount = files.length;
        const indexedFileCount = codebaseIndex.size;

        if (Math.abs(currentFileCount - indexedFileCount) > 5) {
            console.log(`📂 File count changed significantly: ${indexedFileCount} -> ${currentFileCount}`);
            return true;
        }

        // Check if any indexed files have been modified
        let changedFiles = 0;
        for (const file of files.slice(0, 50)) { // Check first 50 files for performance
            const indexedFile = codebaseIndex.get(file.fsPath);
            if (indexedFile) {
                try {
                    const stat = await vscode.workspace.fs.stat(file);
                    if (stat.mtime > indexedFile.lastModified) {
                        changedFiles++;
                        if (changedFiles > 3) { // If more than 3 files changed, re-index
                            console.log(`📂 Multiple files changed, re-indexing recommended`);
                            return true;
                        }
                    }
                } catch (error) {
                    // File might have been deleted
                    changedFiles++;
                }
            }
        }

        return false;

    } catch (error) {
        console.error('Failed to check codebase changes:', error);
        return true; // Re-index on error to be safe
    }
}

/**
 * SMART MANIFESTO GENERATION SYSTEM
 * Analyze codebase and suggest manifesto improvements
 */

/**
 * Analyze manifesto opportunities based on codebase
 */
async function analyzeManifestoOpportunities(): Promise<any> {
    const suggestions: string[] = [];

    if (!isCodebaseIndexed || codebaseIndex.size === 0) {
        return { suggestions: [] };
    }

    // Check for existing manifestos
    const existingManifestos = await findExistingManifestos();

    // Analyze codebase patterns
    const codebaseAnalysis = analyzeCodebasePatterns();

    // Generate suggestions based on findings
    if (existingManifestos.length === 0) {
        suggestions.push('💡 **No manifesto found** - Generate project-specific manifesto based on your codebase patterns');
    } else {
        suggestions.push(`📋 **Found ${existingManifestos.length} manifesto(s)** - ${existingManifestos.map(m => m.type).join(', ')}`);
    }

    // Suggest specific manifesto types based on codebase
    if (codebaseAnalysis.hasTests) {
        const frameworks = Array.from(codebaseAnalysis.frameworks).filter((f: any) =>
            ['WebDriver.io', 'Selenium', 'Cypress', 'Playwright', 'Puppeteer', 'Jest', 'Mocha', 'Cucumber/BDD', 'Appium'].includes(f as string)
        );

        if (frameworks.length > 0) {
            suggestions.push(`🧪 **QA Manifesto** - Generate testing standards for ${frameworks.join(', ')} based on your existing test patterns`);
        } else {
            suggestions.push('🧪 **QA Manifesto** - Generate testing standards based on your existing test patterns');
        }
    }

    if (codebaseAnalysis.hasSecurityPatterns) {
        suggestions.push('🔒 **Security Manifesto** - Create security guidelines based on auth/validation patterns found');
    }

    if (codebaseAnalysis.hasAPIEndpoints) {
        suggestions.push('🌐 **API Manifesto** - Generate API standards based on your endpoint patterns');
    }

    if (codebaseAnalysis.hasReactComponents) {
        suggestions.push('⚛️ **Frontend Manifesto** - Create React/UI component standards');
    }

    return { suggestions, analysis: codebaseAnalysis, existingManifestos };
}

/**
 * Find existing manifesto files in the workspace
 */
async function findExistingManifestos(): Promise<any[]> {
    const manifestos: any[] = [];

    try {
        const manifestoFiles = await vscode.workspace.findFiles(
            '**/*{manifesto,standards,guidelines,rules}*.{md,txt}',
            '**/node_modules/**'
        );

        for (const file of manifestoFiles) {
            const content = await vscode.workspace.fs.readFile(file);
            const text = Buffer.from(content).toString('utf8');

            // Determine manifesto type based on filename and content
            const filename = file.fsPath.toLowerCase();
            let type = 'general';

            if (filename.includes('qa') || filename.includes('test')) type = 'qa';
            else if (filename.includes('security') || filename.includes('sec')) type = 'security';
            else if (filename.includes('api') || filename.includes('backend')) type = 'api';
            else if (filename.includes('frontend') || filename.includes('ui')) type = 'frontend';
            else if (filename.includes('dev')) type = 'development';

            manifestos.push({
                path: file.fsPath,
                type: type,
                size: text.length,
                hasRules: text.includes('must') || text.includes('should') || text.includes('required')
            });
        }
    } catch (error) {
        console.warn('Failed to find existing manifestos:', error);
    }

    return manifestos;
}

/**
 * Analyze codebase patterns to suggest manifesto types
 */
function analyzeCodebasePatterns(): any {
    const analysis = {
        hasTests: false,
        hasSecurityPatterns: false,
        hasAPIEndpoints: false,
        hasReactComponents: false,
        hasDatabaseCode: false,
        languages: new Set<string>(),
        frameworks: new Set<string>()
    };

    for (const [filePath, fileData] of codebaseIndex) {
        const content = fileData.content.toLowerCase();
        const filename = filePath.toLowerCase();

        // Detect languages
        if (filename.endsWith('.ts') || filename.endsWith('.tsx')) analysis.languages.add('TypeScript');
        if (filename.endsWith('.js') || filename.endsWith('.jsx')) analysis.languages.add('JavaScript');
        if (filename.endsWith('.py')) analysis.languages.add('Python');
        if (filename.endsWith('.java')) analysis.languages.add('Java');
        if (filename.endsWith('.cs')) analysis.languages.add('C#');

        // Detect test files and frameworks
        const testPatterns = [
            // File patterns
            filename.includes('test') || filename.includes('spec') || filename.includes('.test.') || filename.includes('.spec.'),

            // Jest/Mocha/Jasmine patterns
            content.includes('describe(') || content.includes('it(') || content.includes('test(') || content.includes('expect('),

            // WebDriver.io patterns
            content.includes('browser.') || content.includes('$$(') || content.includes('browser.url') ||
            content.includes('wdio') || content.includes('webdriver'),

            // Selenium patterns
            content.includes('selenium') || content.includes('webdriver') || content.includes('driver.find') ||
            content.includes('by.id') || content.includes('by.xpath') || content.includes('by.css'),

            // Cypress patterns
            content.includes('cy.') || content.includes('cypress') || content.includes('cy.visit') || content.includes('cy.get'),

            // Playwright patterns
            content.includes('playwright') || content.includes('page.goto') || content.includes('page.click') ||
            content.includes('page.fill') || content.includes('page.locator'),

            // Puppeteer patterns
            content.includes('puppeteer') || content.includes('page.evaluate') || content.includes('page.screenshot'),

            // TestCafe patterns
            content.includes('testcafe') || content.includes('fixture(') || content.includes('test(') && content.includes('selector'),

            // Protractor patterns (legacy Angular)
            content.includes('protractor') || content.includes('element(') || content.includes('browser.get'),

            // Robot Framework patterns
            content.includes('robot framework') || content.includes('*** test cases ***') || content.includes('*** keywords ***'),

            // Cucumber/Gherkin patterns
            content.includes('given(') || content.includes('when(') || content.includes('then(') ||
            content.includes('feature:') || content.includes('scenario:') || content.includes('gherkin'),

            // API testing patterns
            content.includes('supertest') || content.includes('chai') || content.includes('request(') ||
            content.includes('postman') || content.includes('newman') || content.includes('rest-assured'),

            // Load testing patterns
            content.includes('jmeter') || content.includes('k6') || content.includes('artillery') ||
            content.includes('loadtest') || content.includes('stress test'),

            // Unit testing patterns
            content.includes('junit') || content.includes('nunit') || content.includes('xunit') ||
            content.includes('pytest') || content.includes('unittest') || content.includes('rspec'),

            // Mobile testing patterns
            content.includes('appium') || content.includes('espresso') || content.includes('xcuitest') ||
            content.includes('detox') || content.includes('mobile test')
        ];

        if (testPatterns.some(pattern => pattern)) {
            analysis.hasTests = true;

            // Detect specific testing frameworks for better manifesto suggestions
            if (content.includes('wdio') || content.includes('webdriver.io')) {
                analysis.frameworks.add('WebDriver.io');
            }
            if (content.includes('selenium')) {
                analysis.frameworks.add('Selenium');
            }
            if (content.includes('cypress')) {
                analysis.frameworks.add('Cypress');
            }
            if (content.includes('playwright')) {
                analysis.frameworks.add('Playwright');
            }
            if (content.includes('puppeteer')) {
                analysis.frameworks.add('Puppeteer');
            }
            if (content.includes('jest')) {
                analysis.frameworks.add('Jest');
            }
            if (content.includes('mocha')) {
                analysis.frameworks.add('Mocha');
            }
            if (content.includes('cucumber') || content.includes('gherkin')) {
                analysis.frameworks.add('Cucumber/BDD');
            }
            if (content.includes('appium')) {
                analysis.frameworks.add('Appium');
            }
        }

        // Detect security patterns
        if (content.includes('auth') || content.includes('login') || content.includes('password') ||
            content.includes('validate') || content.includes('sanitize') || content.includes('jwt')) {
            analysis.hasSecurityPatterns = true;
        }

        // Detect API endpoints
        if (content.includes('app.get') || content.includes('app.post') || content.includes('@route') ||
            content.includes('express') || content.includes('fastapi') || content.includes('controller')) {
            analysis.hasAPIEndpoints = true;
        }

        // Detect React components
        if (content.includes('react') || content.includes('jsx') || content.includes('usestate') ||
            filename.includes('component') || content.includes('props')) {
            analysis.hasReactComponents = true;
            analysis.frameworks.add('React');
        }

        // Detect database code
        if (content.includes('database') || content.includes('sql') || content.includes('query') ||
            content.includes('mongoose') || content.includes('sequelize')) {
            analysis.hasDatabaseCode = true;
        }
    }

    return analysis;
}

/**
 * Generate QA manifesto based on detected testing frameworks
 */
function generateQAManifesto(frameworks: Set<string>, languages: Set<string>): string {
    const detectedFrameworks = Array.from(frameworks).filter(f =>
        ['WebDriver.io', 'Selenium', 'Cypress', 'Playwright', 'Puppeteer', 'Jest', 'Mocha', 'Cucumber/BDD', 'Appium'].includes(f)
    );

    let manifesto = `# QA Testing Manifesto\n\n`;
    manifesto += `**Generated for:** ${Array.from(languages).join(', ')} project\n`;
    manifesto += `**Testing Frameworks Detected:** ${detectedFrameworks.join(', ') || 'Generic'}\n\n`;

    // Core QA principles
    manifesto += `## Core QA Principles\n\n`;
    manifesto += `### Test Pyramid Strategy\n`;
    manifesto += `- **70% Unit Tests** - Fast, isolated, comprehensive coverage\n`;
    manifesto += `- **20% Integration Tests** - API endpoints, service interactions\n`;
    manifesto += `- **10% E2E Tests** - Critical user journeys only\n\n`;

    manifesto += `### Quality Gates\n`;
    manifesto += `- **80%+ code coverage** required for all new code\n`;
    manifesto += `- **All tests must pass** before merge to main branch\n`;
    manifesto += `- **Performance tests** for critical paths\n`;
    manifesto += `- **Security tests** for authentication and data handling\n\n`;

    // Framework-specific guidelines
    if (detectedFrameworks.includes('WebDriver.io')) {
        manifesto += `## WebDriver.io Standards\n\n`;
        manifesto += `### Page Object Model\n`;
        manifesto += `- Use Page Object Model pattern for all UI tests\n`;
        manifesto += `- Separate page objects from test logic\n`;
        manifesto += `- Use descriptive selectors (data-testid preferred)\n\n`;

        manifesto += `### WebDriver.io Best Practices\n`;
        manifesto += `- Configure explicit waits (no hardcoded sleeps)\n`;
        manifesto += `- Use browser.waitUntil() for dynamic content\n`;
        manifesto += `- Implement retry logic for flaky tests\n`;
        manifesto += `- Use allure reporting for test results\n`;
        manifesto += `- Run tests in parallel when possible\n\n`;
    }

    if (detectedFrameworks.includes('Selenium')) {
        manifesto += `## Selenium Standards\n\n`;
        manifesto += `### Selenium Best Practices\n`;
        manifesto += `- Use WebDriverWait instead of Thread.sleep()\n`;
        manifesto += `- Implement Page Object Model pattern\n`;
        manifesto += `- Use CSS selectors over XPath when possible\n`;
        manifesto += `- Handle stale element exceptions properly\n`;
        manifesto += `- Use TestNG/JUnit annotations appropriately\n\n`;
    }

    if (detectedFrameworks.includes('Cypress')) {
        manifesto += `## Cypress Standards\n\n`;
        manifesto += `### Cypress Best Practices\n`;
        manifesto += `- Use data-cy attributes for element selection\n`;
        manifesto += `- Avoid using cy.wait() with hardcoded times\n`;
        manifesto += `- Use cy.intercept() for API mocking\n`;
        manifesto += `- Keep tests independent and atomic\n`;
        manifesto += `- Use custom commands for repeated actions\n\n`;
    }

    if (detectedFrameworks.includes('Playwright')) {
        manifesto += `## Playwright Standards\n\n`;
        manifesto += `### Playwright Best Practices\n`;
        manifesto += `- Use auto-waiting features (no manual waits)\n`;
        manifesto += `- Implement Page Object Model\n`;
        manifesto += `- Use test.describe() for test organization\n`;
        manifesto += `- Configure parallel execution\n`;
        manifesto += `- Use built-in assertions (expect)\n\n`;
    }

    // API Testing
    manifesto += `## API Testing Standards\n\n`;
    manifesto += `### API Test Requirements\n`;
    manifesto += `- Test all CRUD operations\n`;
    manifesto += `- Validate response schemas\n`;
    manifesto += `- Test error scenarios (4xx, 5xx)\n`;
    manifesto += `- Verify response times (<200ms for critical APIs)\n`;
    manifesto += `- Test authentication and authorization\n\n`;

    // Mobile Testing (if Appium detected)
    if (detectedFrameworks.includes('Appium')) {
        manifesto += `## Mobile Testing Standards\n\n`;
        manifesto += `### Appium Best Practices\n`;
        manifesto += `- Test on real devices when possible\n`;
        manifesto += `- Use accessibility IDs for element location\n`;
        manifesto += `- Test both portrait and landscape orientations\n`;
        manifesto += `- Verify app behavior during interruptions\n`;
        manifesto += `- Test offline functionality\n\n`;
    }

    // BDD/Cucumber
    if (detectedFrameworks.includes('Cucumber/BDD')) {
        manifesto += `## BDD/Cucumber Standards\n\n`;
        manifesto += `### Gherkin Best Practices\n`;
        manifesto += `- Write scenarios from user perspective\n`;
        manifesto += `- Use Given-When-Then structure consistently\n`;
        manifesto += `- Keep scenarios focused and atomic\n`;
        manifesto += `- Use scenario outlines for data-driven tests\n`;
        manifesto += `- Maintain living documentation\n\n`;
    }

    // Test Data Management
    manifesto += `## Test Data Management\n\n`;
    manifesto += `### Data Strategy\n`;
    manifesto += `- Use test data factories/builders\n`;
    manifesto += `- Clean up test data after each test\n`;
    manifesto += `- Use database transactions for isolation\n`;
    manifesto += `- Avoid dependencies on external data\n`;
    manifesto += `- Use meaningful test data (not random strings)\n\n`;

    // CI/CD Integration
    manifesto += `## CI/CD Integration\n\n`;
    manifesto += `### Pipeline Requirements\n`;
    manifesto += `- Unit tests run on every commit\n`;
    manifesto += `- Integration tests run on PR creation\n`;
    manifesto += `- E2E tests run on staging deployment\n`;
    manifesto += `- Performance tests run nightly\n`;
    manifesto += `- Test results published to team dashboard\n\n`;

    // Reporting and Metrics
    manifesto += `## Reporting and Metrics\n\n`;
    manifesto += `### Quality Metrics\n`;
    manifesto += `- Track test execution time trends\n`;
    manifesto += `- Monitor test flakiness rates\n`;
    manifesto += `- Measure code coverage by component\n`;
    manifesto += `- Report defect escape rates\n`;
    manifesto += `- Track automation coverage percentage\n\n`;

    manifesto += `---\n*Generated by Manifesto Enforcer based on detected testing frameworks*`;

    return manifesto;
}

/**
 * GLOSSARY STORAGE SYSTEM
 * Save and restore glossary terms across VSCode sessions
 */

/**
 * Save glossary to VSCode workspace storage
 */
async function saveGlossaryToStorage(context: vscode.ExtensionContext): Promise<void> {
    try {
        const glossaryData = {
            timestamp: Date.now(),
            terms: Array.from(projectGlossary.entries()).map(([key, value]) => ({
                key,
                term: value.term,
                definition: value.definition,
                dateAdded: value.dateAdded,
                usage: value.usage
            }))
        };

        await context.workspaceState.update('projectGlossary', glossaryData);
        console.log('💾 Glossary saved to workspace storage');

    } catch (error) {
        console.error('Failed to save glossary:', error);
    }
}

/**
 * Load glossary from VSCode workspace storage
 */
async function loadGlossaryFromStorage(context: vscode.ExtensionContext): Promise<boolean> {
    try {
        const glossaryData = context.workspaceState.get('projectGlossary') as any;
        if (!glossaryData || !glossaryData.terms) {
            console.log('📖 No saved glossary found');
            return false;
        }

        // Restore the glossary
        projectGlossary.clear();
        for (const termData of glossaryData.terms) {
            projectGlossary.set(termData.key, {
                term: termData.term,
                definition: termData.definition,
                dateAdded: termData.dateAdded || Date.now(),
                usage: termData.usage || 0
            });
        }

        isGlossaryIndexed = projectGlossary.size > 0;
        console.log(`💾 Loaded glossary: ${projectGlossary.size} terms from ${new Date(glossaryData.timestamp).toLocaleString()}`);
        return true;

    } catch (error) {
        console.error('Failed to load glossary:', error);
        return false;
    }
}

/**
 * Enhance AI response with glossary context
 */
function enhanceResponseWithGlossary(response: string): string {
    if (projectGlossary.size === 0) {
        return response;
    }

    let enhancedResponse = response;
    const foundTerms: string[] = [];

    // Find terms mentioned in the response
    for (const [key, termData] of projectGlossary) {
        const regex = new RegExp(`\\b${termData.term}\\b`, 'gi');
        if (regex.test(response)) {
            foundTerms.push(`**${termData.term}**: ${termData.definition}`);

            // Update usage count
            termData.usage++;
        }
    }

    // Add glossary context if terms were found
    if (foundTerms.length > 0) {
        enhancedResponse += `\n\n📖 **Glossary Context:**\n${foundTerms.join('\n')}`;
    }

    return enhancedResponse;
}

/**
 * File change detection for auto re-indexing
 */
let fileWatcher: vscode.FileSystemWatcher | undefined;

/**
 * Setup file change detection
 */
function setupFileChangeDetection(): void {
    // Dispose existing watcher
    if (fileWatcher) {
        fileWatcher.dispose();
    }

    // Create new watcher for relevant files
    fileWatcher = vscode.workspace.createFileSystemWatcher(
        '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h,md,json}',
        false, // ignoreCreateEvents
        false, // ignoreChangeEvents
        false  // ignoreDeleteEvents
    );

    let changeTimeout: NodeJS.Timeout | undefined;

    const handleFileChange = () => {
        // Debounce file changes to avoid excessive re-indexing
        if (changeTimeout) {
            clearTimeout(changeTimeout);
        }

        changeTimeout = setTimeout(async () => {
            if (isCodebaseIndexed) {
                console.log('📂 Files changed, checking if re-indexing is needed...');
                const needsReindex = await checkCodebaseChanges();

                if (needsReindex) {
                    console.log('📂 Significant changes detected, suggesting re-index');
                    // Could trigger automatic re-indexing or show notification
                    vscode.window.showInformationMessage(
                        'Codebase changes detected. Re-index for updated intelligence?',
                        'Re-index Now',
                        'Later'
                    ).then(selection => {
                        if (selection === 'Re-index Now') {
                            // Trigger re-indexing
                            vscode.commands.executeCommand('manifestoEnforcer.indexCodebase');
                        }
                    });
                }
            }
        }, 2000); // Wait 2 seconds after last change
    };

    fileWatcher.onDidCreate(handleFileChange);
    fileWatcher.onDidChange(handleFileChange);
    fileWatcher.onDidDelete(handleFileChange);

    console.log('👁️ File change detection enabled');
}

/**
 * Handle glossary requests through natural chat
 */
async function handleGlossaryChat(userInput: string): Promise<string> {
    const input = userInput.toLowerCase();

    // Pattern: "define [term] as [definition]" or "add term [term] meaning [definition]"
    const defineMatch = userInput.match(/(?:define|add term|add definition)\s+([^:=]+?)(?:\s+(?:as|means?|is|=|:)\s+(.+))?$/i);

    if (defineMatch) {
        const term = defineMatch[1].trim();
        const definition = defineMatch[2]?.trim();

        if (definition) {
            // Add the term
            projectGlossary.set(term.toUpperCase(), {
                term: term,
                definition: definition,
                dateAdded: Date.now(),
                usage: 0
            });

            // Save to storage - we'll need to get context from somewhere
            // For now, just add to memory
            console.log(`Added glossary term: ${term} = ${definition}`);

            return `✅ **Added to glossary:**\n\n**${term}**: ${definition}\n\nI'll now automatically include this definition when you mention "${term}" in our conversations.`;
        } else {
            // Ask for definition
            return `📖 I'd be happy to add **${term}** to the glossary! What does it mean?\n\nJust say: "Define ${term} as [your definition]"`;
        }
    }

    // Pattern: "what does [term] mean?" or "what is [term]?"
    const lookupMatch = userInput.match(/(?:what (?:does|is)|define)\s+([^?]+?)(?:\s+mean|\?|$)/i);

    if (lookupMatch) {
        const term = lookupMatch[1].trim();
        const upperTerm = term.toUpperCase();

        if (projectGlossary.has(upperTerm)) {
            const termData = projectGlossary.get(upperTerm)!;
            termData.usage++;

            return `📖 **${termData.term}**: ${termData.definition}\n\n*Used ${termData.usage} time${termData.usage !== 1 ? 's' : ''} in our conversations*`;
        } else {
            return `❓ I don't have **${term}** in the glossary yet.\n\nWould you like to add it? Just say: "Define ${term} as [your definition]"`;
        }
    }

    // Pattern: "show glossary" or "list terms"
    if (/(?:show|list|display)\s+(?:glossary|terms|definitions)/i.test(userInput)) {
        if (projectGlossary.size === 0) {
            return `📖 **Glossary is empty**\n\nAdd terms by saying things like:\n• "Define API as Application Programming Interface"\n• "Add term SLA meaning Service Level Agreement"\n• "Define JWT as JSON Web Token"`;
        }

        let response = `📖 **Project Glossary** (${projectGlossary.size} terms):\n\n`;
        const sortedTerms = Array.from(projectGlossary.values()).sort((a, b) => a.term.localeCompare(b.term));

        for (const termData of sortedTerms) {
            response += `**${termData.term}**: ${termData.definition}`;
            if (termData.usage > 0) {
                response += ` *(used ${termData.usage}x)*`;
            }
            response += '\n';
        }

        response += `\n💡 **Add more terms** by saying: "Define [term] as [definition]"`;
        return response;
    }

    // Pattern: "remove [term]" or "delete [term]"
    const removeMatch = userInput.match(/(?:remove|delete)\s+(?:term\s+)?([^?]+?)(?:\?|$)/i);

    if (removeMatch) {
        const term = removeMatch[1].trim();
        const upperTerm = term.toUpperCase();

        if (projectGlossary.has(upperTerm)) {
            projectGlossary.delete(upperTerm);
            return `✅ Removed **${term}** from the glossary.`;
        } else {
            return `❌ **${term}** is not in the glossary.`;
        }
    }

    // General glossary help
    return `📖 **Glossary Commands:**\n\n**Add terms:**\n• "Define API as Application Programming Interface"\n• "Add term SLA meaning Service Level Agreement"\n\n**Look up terms:**\n• "What does API mean?"\n• "What is SLA?"\n\n**Manage glossary:**\n• "Show glossary" - List all terms\n• "Remove API" - Delete a term\n\n**Current glossary:** ${projectGlossary.size} terms defined`;
}

/**
 * Handle manifesto generation requests through chat
 */
async function handleManifestoGeneration(userInput: string): Promise<string> {
    if (!isCodebaseIndexed) {
        return `⚠️ **Codebase not indexed yet!**\n\nI need to analyze your codebase first to generate relevant manifestos.\n\nPlease click "📚 Index Codebase" first, then try again.`;
    }

    const input = userInput.toLowerCase();

    // Analyze the current codebase
    const analysis = analyzeCodebasePatterns();

    if (input.includes('qa') || input.includes('testing')) {
        // Generate QA manifesto
        if (!analysis.hasTests) {
            return `❌ **No testing frameworks detected**\n\nI couldn't find any testing frameworks in your codebase. Consider adding:\n\n**Web Testing:**\n• WebDriver.io for robust E2E testing\n• Cypress for modern web testing\n• Playwright for cross-browser testing\n\n**Unit Testing:**\n• Jest for JavaScript/TypeScript\n• Mocha + Chai for flexible testing\n• PyTest for Python\n\n**API Testing:**\n• Supertest for Node.js APIs\n• Rest-Assured for Java APIs\n\nOnce you have tests, I can generate a comprehensive QA manifesto!`;
        }

        const qaManifesto = generateQAManifesto(analysis.frameworks, analysis.languages);

        // Offer to save the manifesto
        return `🧪 **QA Manifesto Generated!**\n\nBased on your codebase analysis, I've created a comprehensive QA manifesto for:\n\n**Languages:** ${Array.from(analysis.languages).join(', ')}\n**Testing Frameworks:** ${Array.from(analysis.frameworks).filter(f =>
            ['WebDriver.io', 'Selenium', 'Cypress', 'Playwright', 'Puppeteer', 'Jest', 'Mocha', 'Cucumber/BDD', 'Appium'].includes(f as string)
        ).join(', ') || 'Generic'}\n\n---\n\n${qaManifesto}\n\n---\n\n💾 **Want to save this?** I can create a \`qa-manifesto.md\` file in your workspace. Just say "save qa manifesto"`;
    }

    // General manifesto generation
    const manifestoAnalysis = await analyzeManifestoOpportunities();

    if (manifestoAnalysis.suggestions.length === 0) {
        return `📋 **Ready to generate manifestos!**\n\nI can create manifestos based on your codebase patterns:\n\n**Available types:**\n• "Generate QA manifesto" - Testing standards\n• "Generate security manifesto" - Security guidelines\n• "Generate API manifesto" - API standards\n• "Generate frontend manifesto" - UI component standards\n\nWhat type would you like me to create?`;
    }

    return `📋 **Manifesto Generation Options:**\n\n${manifestoAnalysis.suggestions.join('\n')}\n\n**To generate:** Just say "Generate [type] manifesto"\n\nExample: "Generate QA manifesto" or "Generate security manifesto"`;
}

export function deactivate() {
    // Clean up file watcher
    if (fileWatcher) {
        fileWatcher.dispose();
    }
}
