/**
 * Centralized State Manager for Manifesto Enforcer Extension
 * Following manifesto: SOLID principles, dependency injection, comprehensive error handling
 */

import * as vscode from 'vscode';
import { CodeGraph } from '../indexing/CodeGraph';

/**
 * Singleton StateManager class that centralizes all extension state
 * Implements dependency injection pattern for better testability and maintainability
 */
export class StateManager {
    private static instance: StateManager;
    private context: vscode.ExtensionContext;

    // Core State Variables
    private _manifestoRules: any[] = [];
    private _isManifestoMode: boolean = true;
    private _currentAgent: string = 'Auggie';
    private _currentModel: string = 'Claude Sonnet 4';
    private _isAgentMode: boolean = false; // false = chat only (safer default)
    private _isAutoMode: boolean = false; // false = requires confirmation (safer default)
    private _fontSize: string = 'medium'; // small, medium, large
    private _showEmojis: boolean = true;

    // Codebase Intelligence State
    private _codebaseIndex: Map<string, any> = new Map();
    private _isCodebaseIndexed: boolean = false;
    private _projectStructure: any = null;
    private _manifestoIndex: any = null;
    private _codebaseIndexTimestamp: number = 0;
    private _codeGraph: CodeGraph = new CodeGraph();

    // Provider instances removed - StateManager should only manage data, not service instances

    // Amazon Q Optimization State
    private _qContextWindow: any[] = [];
    private _qTokenCount: number = 0;
    private _qMaxTokens: number = 4000; // Conservative limit for Q
    private _qContextPriority: Map<string, number> = new Map();

    // MR/PR Integration State
    private _mrCache: Map<string, any> = new Map();
    private _gitConfig: any = null;

    // Glossary System State
    private _projectGlossary: Map<string, any> = new Map();
    private _isGlossaryIndexed: boolean = false;

    /**
     * Get singleton instance of StateManager
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public static getInstance(context?: vscode.ExtensionContext): StateManager {
        try {
            if (!StateManager.instance) {
                if (!context) {
                    throw new Error('ExtensionContext required for StateManager initialization');
                }
                StateManager.instance = new StateManager(context);
            }
            return StateManager.instance;
        } catch (error) {
            console.error('Failed to get StateManager instance:', error);
            throw new Error(`StateManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Private constructor implementing singleton pattern
     * MANDATORY: Input validation (manifesto requirement)
     */
    private constructor(context: vscode.ExtensionContext) {
        try {
            if (!context) {
                throw new Error('ExtensionContext is required');
            }
            
            this.context = context;
            this.initializeFromSettings();
            console.log('🏗️ StateManager initialized successfully');
        } catch (error) {
            console.error('StateManager constructor failed:', error);
            throw error;
        }
    }

    /**
     * Initialize state from VSCode settings
     * OPTIMIZE: Must complete under 200ms (manifesto requirement)
     */
    private async initializeFromSettings(): Promise<void> {
        const startTime = Date.now();
        
        try {
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Load manifesto mode setting
            this._isManifestoMode = config.get<boolean>('manifestoMode', true);

            // Load default mode setting
            const defaultMode = config.get<string>('defaultMode', 'chat');
            this._isAgentMode = defaultMode === 'agent';

            // Load auto mode setting
            this._isAutoMode = config.get<boolean>('autoMode', false);

            // Load formatting settings
            this._fontSize = config.get<string>('fontSize', 'medium');
            this._showEmojis = config.get<boolean>('showEmojis', true);

            // Load current agent
            this._currentAgent = config.get<string>('currentAgent', 'Auggie');

            const duration = Date.now() - startTime;
            if (duration > 200) {
                console.warn(`Settings initialization took ${duration}ms - exceeds 200ms requirement`);
            }

            console.log('🐷 Settings loaded: ' + (this._isAgentMode ? 'Agent Mode' : 'Chat Mode') + ', Auto: ' + (this._isAutoMode ? 'ON' : 'OFF'));
            
        } catch (error) {
            console.error('🐷 Error loading settings:', error);
            throw new Error(`Settings initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Save current state to VSCode settings
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async saveSettings(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            await config.update('manifestoMode', this._isManifestoMode, vscode.ConfigurationTarget.Global);
            await config.update('defaultMode', this._isAgentMode ? 'agent' : 'chat', vscode.ConfigurationTarget.Global);
            await config.update('autoMode', this._isAutoMode, vscode.ConfigurationTarget.Global);
            await config.update('fontSize', this._fontSize, vscode.ConfigurationTarget.Global);
            await config.update('showEmojis', this._showEmojis, vscode.ConfigurationTarget.Global);
            await config.update('currentAgent', this._currentAgent, vscode.ConfigurationTarget.Global);
            
            console.log('🐷 Settings saved: ' + (this._isAgentMode ? 'Agent Mode' : 'Chat Mode') + ', Auto: ' + (this._isAutoMode ? 'ON' : 'OFF'));
            
        } catch (error) {
            console.error('🐷 Error saving settings:', error);
            throw new Error(`Settings save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Getter and Setter methods for all state properties

    // Core State Properties
    public get manifestoRules(): any[] { return this._manifestoRules; }
    public set manifestoRules(value: any[]) { this._manifestoRules = value; }

    public get isManifestoMode(): boolean { return this._isManifestoMode; }
    public set isManifestoMode(value: boolean) { 
        this._isManifestoMode = value;
        this.saveSettings().catch(console.error);
    }

    public get currentAgent(): string { return this._currentAgent; }
    public set currentAgent(value: string) { 
        this._currentAgent = value;
        this.saveSettings().catch(console.error);
    }

    public get currentModel(): string { return this._currentModel; }
    public set currentModel(value: string) { this._currentModel = value; }

    public get isAgentMode(): boolean { return this._isAgentMode; }
    public set isAgentMode(value: boolean) { 
        this._isAgentMode = value;
        this.saveSettings().catch(console.error);
    }

    public get isAutoMode(): boolean { return this._isAutoMode; }
    public set isAutoMode(value: boolean) { 
        this._isAutoMode = value;
        this.saveSettings().catch(console.error);
    }

    public get fontSize(): string { return this._fontSize; }
    public set fontSize(value: string) { 
        this._fontSize = value;
        this.saveSettings().catch(console.error);
    }

    public get showEmojis(): boolean { return this._showEmojis; }
    public set showEmojis(value: boolean) { 
        this._showEmojis = value;
        this.saveSettings().catch(console.error);
    }

    // Codebase Intelligence Properties
    public get codebaseIndex(): Map<string, any> { return this._codebaseIndex; }
    public set codebaseIndex(value: Map<string, any>) { this._codebaseIndex = value; }

    public get isCodebaseIndexed(): boolean { return this._isCodebaseIndexed; }
    public set isCodebaseIndexed(value: boolean) { this._isCodebaseIndexed = value; }

    public get projectStructure(): any { return this._projectStructure; }
    public set projectStructure(value: any) { this._projectStructure = value; }

    public get manifestoIndex(): any { return this._manifestoIndex; }
    public set manifestoIndex(value: any) { this._manifestoIndex = value; }

    public get codebaseIndexTimestamp(): number { return this._codebaseIndexTimestamp; }
    public set codebaseIndexTimestamp(value: number) { this._codebaseIndexTimestamp = value; }

    public get codeGraph(): CodeGraph { return this._codeGraph; }
    public set codeGraph(value: CodeGraph) { this._codeGraph = value; }

    // Provider Properties removed - StateManager should only manage data, not service instances

    // Amazon Q Optimization Properties
    public get qContextWindow(): any[] { return this._qContextWindow; }
    public set qContextWindow(value: any[]) { this._qContextWindow = value; }

    public get qTokenCount(): number { return this._qTokenCount; }
    public set qTokenCount(value: number) { this._qTokenCount = value; }

    public get qMaxTokens(): number { return this._qMaxTokens; }
    public set qMaxTokens(value: number) { this._qMaxTokens = value; }

    public get qContextPriority(): Map<string, number> { return this._qContextPriority; }
    public set qContextPriority(value: Map<string, number>) { this._qContextPriority = value; }

    // MR/PR Integration Properties
    public get mrCache(): Map<string, any> { return this._mrCache; }
    public set mrCache(value: Map<string, any>) { this._mrCache = value; }

    public get gitConfig(): any { return this._gitConfig; }
    public set gitConfig(value: any) { this._gitConfig = value; }

    // Glossary System Properties
    public get projectGlossary(): Map<string, any> { return this._projectGlossary; }
    public set projectGlossary(value: Map<string, any>) { this._projectGlossary = value; }

    public get isGlossaryIndexed(): boolean { return this._isGlossaryIndexed; }
    public set isGlossaryIndexed(value: boolean) { this._isGlossaryIndexed = value; }

    // Extension Context Access
    public get extensionContext(): vscode.ExtensionContext { return this.context; }

    /**
     * Reset all state to defaults (useful for testing)
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public resetState(): void {
        try {
            this._manifestoRules = [];
            this._isManifestoMode = true;
            this._currentAgent = 'Auggie';
            this._currentModel = 'Claude Sonnet 4';
            this._isAgentMode = false;
            this._isAutoMode = false;
            this._fontSize = 'medium';
            this._showEmojis = true;

            this._codebaseIndex.clear();
            this._isCodebaseIndexed = false;
            this._projectStructure = null;
            this._manifestoIndex = null;
            this._codebaseIndexTimestamp = 0;
            this._codeGraph = new CodeGraph();

            this._qContextWindow = [];
            this._qTokenCount = 0;
            this._qMaxTokens = 4000;
            this._qContextPriority.clear();

            this._mrCache.clear();
            this._gitConfig = null;

            this._projectGlossary.clear();
            this._isGlossaryIndexed = false;

            console.log('🔄 StateManager state reset to defaults');
        } catch (error) {
            console.error('Failed to reset state:', error);
            throw new Error(`State reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get state summary for debugging
     * DOCUMENT: All configuration options with examples (manifesto requirement)
     */
    public getStateSummary(): any {
        return {
            core: {
                isManifestoMode: this._isManifestoMode,
                currentAgent: this._currentAgent,
                isAgentMode: this._isAgentMode,
                isAutoMode: this._isAutoMode,
                fontSize: this._fontSize,
                showEmojis: this._showEmojis
            },
            codebase: {
                isIndexed: this._isCodebaseIndexed,
                fileCount: this._codebaseIndex.size,
                indexTimestamp: this._codebaseIndexTimestamp
            },
            glossary: {
                isIndexed: this._isGlossaryIndexed,
                termCount: this._projectGlossary.size
            },
            amazonQ: {
                tokenCount: this._qTokenCount,
                maxTokens: this._qMaxTokens,
                contextItems: this._qContextWindow.length
            },
            cache: {
                mrCacheSize: this._mrCache.size
            }
        };
    }

    /**
     * Load codebase index from storage
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async loadCodebaseIndex(): Promise<boolean> {
        try {
            const savedIndex = this.context.workspaceState.get('codebaseIndex');
            if (savedIndex) {
                this._codebaseIndex = new Map(Object.entries(savedIndex));
                console.log('💾 Restored codebase index from previous session');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load codebase index:', error);
            return false;
        }
    }

    /**
     * Save codebase index to storage
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async saveCodebaseIndex(): Promise<void> {
        try {
            const indexObj = Object.fromEntries(this._codebaseIndex);
            await this.context.workspaceState.update('codebaseIndex', indexObj);
            console.log('💾 Codebase index saved to storage');
        } catch (error) {
            console.error('Failed to save codebase index:', error);
            throw new Error(`Codebase index save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Load glossary from storage
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async loadGlossaryFromStorage(): Promise<boolean> {
        try {
            const savedGlossary = this.context.workspaceState.get('projectGlossary');
            if (savedGlossary) {
                this._projectGlossary = new Map(Object.entries(savedGlossary));
                console.log('📖 Restored glossary from previous session');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load glossary:', error);
            return false;
        }
    }

    /**
     * Save glossary to storage
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async saveGlossaryToStorage(): Promise<void> {
        try {
            const glossaryObj = Object.fromEntries(this._projectGlossary);
            await this.context.workspaceState.update('projectGlossary', glossaryObj);
            console.log('📖 Glossary saved to storage');
        } catch (error) {
            console.error('Failed to save glossary:', error);
            throw new Error(`Glossary save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Set agent mode state
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setAgentMode(isAgent: boolean): void {
        try {
            this._isAgentMode = isAgent;
            this.saveSettings().catch(console.error);
            console.log(`🐷 Agent mode ${isAgent ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Failed to set agent mode:', error);
            throw new Error(`Agent mode update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Set auto mode state
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setAutoMode(isAuto: boolean): void {
        try {
            this._isAutoMode = isAuto;
            this.saveSettings().catch(console.error);
            console.log(`🐷 Auto mode ${isAuto ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Failed to set auto mode:', error);
            throw new Error(`Auto mode update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Set font size
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setFontSize(size: string): void {
        try {
            if (!['small', 'medium', 'large'].includes(size)) {
                throw new Error('Invalid font size: must be small, medium, or large');
            }
            this._fontSize = size;
            this.saveSettings().catch(console.error);
            console.log(`🐷 Font size set to ${size}`);
        } catch (error) {
            console.error('Failed to set font size:', error);
            throw new Error(`Font size update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Start codebase indexing process
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     * OPTIMIZE: Must complete under reasonable time limits (manifesto requirement)
     */
    public async startIndexing(): Promise<{ success: boolean; message: string; processedFiles?: number }> {
        const startTime = Date.now();

        try {
            console.log('📚 Starting codebase indexing...');

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder open');
            }

            // Find all relevant files
            const files = await vscode.workspace.findFiles(
                '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h,md,json}',
                '**/node_modules/**'
            );

            this._codebaseIndex.clear();
            let processedFiles = 0;

            for (const file of files.slice(0, 100)) { // Limit for performance
                try {
                    const content = await vscode.workspace.fs.readFile(file);
                    const text = Buffer.from(content).toString('utf8');

                    this._codebaseIndex.set(file.fsPath, {
                        path: file.fsPath,
                        content: text,
                        size: text.length,
                        lastModified: Date.now()
                    });

                    processedFiles++;
                } catch (error) {
                    console.warn('Failed to read file:', file.fsPath, error);
                }
            }

            this._isCodebaseIndexed = true;
            this._codebaseIndexTimestamp = Date.now();

            // Save the index
            await this.saveCodebaseIndex();

            const duration = Date.now() - startTime;
            console.log(`✅ Codebase indexed successfully! Processed ${processedFiles} files in ${duration}ms`);

            return {
                success: true,
                message: `✅ Codebase indexed successfully! Processed ${processedFiles} files.`,
                processedFiles
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Indexing failed:', error);
            this._isCodebaseIndexed = false;

            return {
                success: false,
                message: `❌ Failed to index codebase: ${errorMessage}`
            };
        }
    }

    /**
     * Dispose resources and clear sensitive data
     * MANDATORY: Proper resource disposal (manifesto requirement)
     */
    public dispose(): void {
        try {
            // Clear all maps and arrays
            this._codebaseIndex.clear();
            this._qContextPriority.clear();
            this._mrCache.clear();
            this._projectGlossary.clear();
            this._qContextWindow = [];

            // Provider disposal is now handled by the extension.ts activate function

            console.log('🗑️ StateManager disposed successfully');
        } catch (error) {
            console.error('Error disposing StateManager:', error);
        }
    }
}
