/**
 * Centralized State Manager for Manifesto Enforcer Extension
 * Following manifesto: SOLID principles, dependency injection, comprehensive error handling
 */

import * as vscode from 'vscode';
import { CodeGraph } from '../indexing/CodeGraph';
import { ChatMessage } from './types';
import { PiggieDirectoryManager } from './PiggieDirectoryManager';
import { GitignoreParser } from './GitignoreParser';
import { FileLifecycleManager, FileLifecycleOptions, FileLifecycleResult } from './FileLifecycleManager';

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

    // CRITICAL: Race condition protection
    private _isIndexingInProgress: boolean = false;
    private _indexingPromise: Promise<any> | null = null;

    // MANDATORY: Reference file counting for validation
    private _expectedFileCount: number = 0;
    private _lastIndexingResults: { discovered: number; processed: number; skipped: number; errors: number } | null = null;

    // Provider instances removed - StateManager should only manage data, not service instances

    // Amazon Q Optimization State
    private _qContextWindow: any[] = [];
    private _qTokenCount: number = 0;
    private _qMaxTokens: number = 4000; // Conservative limit for Q
    private _qContextPriority: Map<string, number> = new Map();

    // MR/PR Integration State
    private _mrCache: Map<string, any> = new Map();
    private _gitConfig: any = null;

    // Conversation Context State
    private _conversationHistory: ChatMessage[] = [];
    private _maxConversationHistory: number = 20; // Keep last 20 messages

    // File Management
    private piggieDirectoryManager?: PiggieDirectoryManager;
    private gitignoreParser?: GitignoreParser;
    private fileLifecycleManager?: FileLifecycleManager;

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

            // Initialize file management utilities
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                this.piggieDirectoryManager = new PiggieDirectoryManager(workspaceFolder.uri.fsPath);
                this.gitignoreParser = new GitignoreParser(workspaceFolder.uri.fsPath);
                this.fileLifecycleManager = new FileLifecycleManager(workspaceFolder.uri.fsPath);

                // Initialize Piggie directory and load gitignore asynchronously
                // Don't await here to avoid blocking constructor
                this.initializeFileManagement().catch(error => {
                    console.warn('File management initialization failed:', error);
                });
            }

            console.log('🏗️ StateManager initialized successfully');
        } catch (error) {
            console.error('StateManager constructor failed:', error);
            throw error;
        }
    }

    /**
     * Initialize file management utilities
     * MANDATORY: Comprehensive error handling and validation
     */
    private async initializeFileManagement(): Promise<void> {
        try {
            console.log('🔧 MANIFESTO: Initializing file management utilities...');

            // MANDATORY: Initialize Piggie directory manager
            if (this.piggieDirectoryManager) {
                await this.piggieDirectoryManager.initialize();
                console.log('✅ MANIFESTO: PiggieDirectoryManager initialized');
            } else {
                console.error('❌ CRITICAL: PiggieDirectoryManager is null');
            }

            // MANDATORY: Initialize gitignore parser
            if (this.gitignoreParser) {
                await this.gitignoreParser.loadGitignore();
                console.log('✅ MANIFESTO: GitignoreParser initialized');
            } else {
                console.error('❌ CRITICAL: GitignoreParser is null');
            }

            console.log('✅ MANIFESTO: File management initialization complete');

        } catch (error) {
            console.error('❌ CRITICAL: File management initialization failed:', error);
            // MANDATORY: Don't throw - but log the critical error
            throw new Error(`File management initialization failed: ${error instanceof Error ? error.message : String(error)}`);
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
    public async resetState(): Promise<void> {
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

            // CRITICAL: Reset indexing state to prevent race conditions
            this._isIndexingInProgress = false;
            this._indexingPromise = null;

            this._qContextWindow = [];
            this._qTokenCount = 0;
            this._qMaxTokens = 4000;
            this._qContextPriority.clear();

            this._mrCache.clear();
            this._gitConfig = null;

            this._projectGlossary.clear();
            this._isGlossaryIndexed = false;

            // Reset conversation history
            this._conversationHistory = [];

            // Strategic cleanup when resetting state
            await this.performStrategicCleanup();

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
        // CRITICAL: Prevent race conditions from button spam
        if (this._isIndexingInProgress) {
            console.log('⚠️ MANIFESTO: Indexing already in progress, returning existing promise...');
            if (this._indexingPromise) {
                return await this._indexingPromise;
            } else {
                return {
                    success: false,
                    message: '⚠️ Indexing already in progress - please wait for completion.'
                };
            }
        }

        // CRITICAL: Set indexing flag and create promise
        this._isIndexingInProgress = true;
        this._indexingPromise = this.performIndexing();

        try {
            const result = await this._indexingPromise;
            return result;
        } finally {
            // MANDATORY: Always clear the indexing state
            this._isIndexingInProgress = false;
            this._indexingPromise = null;
        }
    }

    /**
     * Perform the actual indexing work
     * MANDATORY: Comprehensive error handling and validation
     */
    private async performIndexing(): Promise<{ success: boolean; message: string; processedFiles?: number }> {
        const startTime = Date.now();

        try {
            console.log('📚 MANIFESTO: Starting codebase indexing with comprehensive diagnostics...');

            // MANDATORY: Input validation
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('CRITICAL: No workspace folder open - cannot proceed with indexing');
            }

            // MANDATORY: Ensure file management is properly initialized BEFORE indexing
            console.log('🔍 DIAGNOSTIC: Initializing file management for consistent indexing...');

            // CRITICAL: Initialize file management if not already done
            if (!this.piggieDirectoryManager || !this.gitignoreParser) {
                console.log('⚠️ DIAGNOSTIC: File management not initialized, initializing now...');
                this.piggieDirectoryManager = new PiggieDirectoryManager(workspaceFolder.uri.fsPath);
                this.gitignoreParser = new GitignoreParser(workspaceFolder.uri.fsPath);

                // MANDATORY: Wait for initialization to complete
                await this.initializeFileManagement();
                console.log('✅ DIAGNOSTIC: File management initialized successfully');
            } else {
                // MANDATORY: Force reload gitignore to ensure consistency
                await this.gitignoreParser.loadGitignore();
                console.log('✅ DIAGNOSTIC: Gitignore patterns reloaded for consistency');
            }

            // EMERGENCY FIX: Force strict exclusions - gitignore patterns are broken
            const emergencyExclusions = '{**/node_modules/**,**/out/**,**/dist/**,**/build/**,**/.git/**,**/.piggie/**,**/*.js.map,**/*.vsix,**/*.log}';

            console.log(`🚨 EMERGENCY: Using emergency exclusion pattern: ${emergencyExclusions}`);

            // CRITICAL: Don't use gitignore parser until it's fixed
            const exclusionPattern = emergencyExclusions;

            console.log(`🔍 DIAGNOSTIC: Final exclusion pattern: ${exclusionPattern}`);

            // MANDATORY: Comprehensive file discovery with error handling
            let files: vscode.Uri[] = [];
            try {
                files = await vscode.workspace.findFiles(
                    '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,h,md,json}',
                    exclusionPattern
                );
                console.log(`🔍 DIAGNOSTIC: VSCode findFiles returned ${files.length} files`);
            } catch (error) {
                console.error('❌ CRITICAL: File discovery failed:', error);
                throw new Error(`File discovery failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            // MANDATORY: Clear previous index state
            this._codebaseIndex.clear();
            let processedFiles = 0;
            let skippedFiles = 0;
            let errorFiles = 0;

            // MANDATORY: Process ALL discovered files (no artificial limits)
            const totalFilesToProcess = files.length;

            console.log(`📊 DIAGNOSTIC: Processing ALL ${totalFilesToProcess} discovered files (no limits applied)`);

            // MANDATORY: Process files with comprehensive error handling
            for (let i = 0; i < totalFilesToProcess; i++) {
                const file = files[i];
                try {
                    // REMOVED: Double-check gitignore (this was causing inconsistency)
                    // The VSCode exclusion pattern should be sufficient

                    console.log(`[${i + 1}/${totalFilesToProcess}] Processing: ${file.fsPath}`);

                    // MANDATORY: Comprehensive file reading with error handling
                    let content: Uint8Array;
                    try {
                        content = await vscode.workspace.fs.readFile(file);
                    } catch (readError) {
                        console.error(`❌ DIAGNOSTIC: Failed to read file ${file.fsPath}:`, readError);
                        errorFiles++;
                        continue;
                    }

                    // MANDATORY: Safe content conversion with validation
                    let text: string;
                    try {
                        text = Buffer.from(content).toString('utf8');
                        if (text.length === 0) {
                            console.warn(`⚠️ DIAGNOSTIC: Empty file skipped: ${file.fsPath}`);
                            skippedFiles++;
                            continue;
                        }
                    } catch (conversionError) {
                        console.error(`❌ DIAGNOSTIC: Content conversion failed for ${file.fsPath}:`, conversionError);
                        errorFiles++;
                        continue;
                    }

                    // MANDATORY: Store with comprehensive metadata
                    this._codebaseIndex.set(file.fsPath, {
                        path: file.fsPath,
                        content: text,
                        size: text.length,
                        lastModified: Date.now(),
                        indexed: true
                    });

                    processedFiles++;

                } catch (error) {
                    console.error(`❌ DIAGNOSTIC: Unexpected error processing ${file.fsPath}:`, error);
                    errorFiles++;
                }
            }

            // MANDATORY: Validate indexing results
            if (processedFiles === 0) {
                throw new Error('CRITICAL: No files were successfully indexed - this indicates a systematic issue');
            }

            this._isCodebaseIndexed = true;
            this._codebaseIndexTimestamp = Date.now();

            // MANDATORY: Persist index with error handling
            try {
                await this.saveCodebaseIndex();
                console.log('✅ DIAGNOSTIC: Index saved successfully');
            } catch (saveError) {
                console.error('❌ DIAGNOSTIC: Index save failed:', saveError);
                // Don't fail the entire operation for save errors
            }

            // Strategic cleanup after successful indexing
            try {
                await this.performStrategicCleanup();
                console.log('✅ DIAGNOSTIC: Cleanup completed');
            } catch (cleanupError) {
                console.error('❌ DIAGNOSTIC: Cleanup failed:', cleanupError);
                // Don't fail the entire operation for cleanup errors
            }

            const duration = Date.now() - startTime;

            // MANDATORY: Store results for consistency validation
            this._lastIndexingResults = {
                discovered: files.length,
                processed: processedFiles,
                skipped: skippedFiles,
                errors: errorFiles
            };

            // CRITICAL: Validate against expected file count
            if (this._expectedFileCount > 0 && Math.abs(processedFiles - this._expectedFileCount) > 5) {
                console.warn(`⚠️ DIAGNOSTIC: File count deviation! Expected: ${this._expectedFileCount}, Got: ${processedFiles}`);
            } else if (this._expectedFileCount === 0) {
                // First run - set expected count
                this._expectedFileCount = processedFiles;
                console.log(`📊 REFERENCE: Set expected file count to ${this._expectedFileCount}`);
            } else {
                console.log(`✅ VALIDATION: File count matches expected (${this._expectedFileCount})`);
            }

            const summary = `✅ INDEXING COMPLETE: ${processedFiles} processed, ${skippedFiles} skipped, ${errorFiles} errors in ${duration}ms`;
            console.log(summary);

            return {
                success: true,
                message: `✅ Codebase indexed successfully! Processed ${processedFiles} files (${skippedFiles} skipped, ${errorFiles} errors). Expected: ${this._expectedFileCount}`,
                processedFiles
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ CRITICAL: Indexing failed completely:', error);
            this._isCodebaseIndexed = false;

            return {
                success: false,
                message: `❌ Failed to index codebase: ${errorMessage}`
            };
        }
    }

    /**
     * Add message to conversation history
     * MANDATORY: Input validation and error handling
     */
    public addToConversationHistory(message: ChatMessage): void {
        try {
            if (!message || !message.content) {
                throw new Error('Invalid message: content is required');
            }

            this._conversationHistory.push(message);

            // Keep only the last N messages to prevent memory issues
            if (this._conversationHistory.length > this._maxConversationHistory) {
                this._conversationHistory = this._conversationHistory.slice(-this._maxConversationHistory);
            }

        } catch (error) {
            console.error('Failed to add message to conversation history:', error);
        }
    }

    /**
     * Get conversation history for context
     */
    public getConversationHistory(): ChatMessage[] {
        return [...this._conversationHistory]; // Return copy to prevent external modification
    }

    /**
     * Get recent conversation context as string
     */
    public getConversationContext(maxMessages: number = 5): string {
        const recentMessages = this._conversationHistory.slice(-maxMessages);
        return recentMessages.map(msg =>
            `${msg.role === 'user' ? '👤 User' : '🐷 Piggie'}: ${msg.content}`
        ).join('\n\n');
    }

    /**
     * Clear conversation history
     */
    public clearConversationHistory(): void {
        this._conversationHistory = [];
        console.log('🗑️ Conversation history cleared');
    }



    /**
     * Create backup file in Piggie directory
     * MANDATORY: Input validation and error handling
     */
    public async createBackup(filePath: string, content: string): Promise<string | null> {
        try {
            if (!this.piggieDirectoryManager) {
                console.warn('Piggie directory manager not initialized - backup skipped');
                return null;
            }

            return await this.piggieDirectoryManager.createBackup(filePath, content);

        } catch (error) {
            console.error('Failed to create backup:', error);
            return null; // Don't throw - backup failure shouldn't break main functionality
        }
    }

    /**
     * Get Piggie directory path
     */
    public getPiggieDirectory(): string | null {
        return this.piggieDirectoryManager?.getPiggieDirectory() || null;
    }

    /**
     * Get indexing statistics for validation
     * CRITICAL INFRASTRUCTURE: Provide comprehensive indexing metrics with validation
     */
    public getIndexingStats(): {
        expectedCount: number;
        lastResults: { discovered: number; processed: number; skipped: number; errors: number } | null;
        isIndexed: boolean;
        timestamp: number;
        currentCount: number;
        healthStatus: 'healthy' | 'warning' | 'error';
        healthMessage?: string;
    } {
        const currentCount = this._codebaseIndex.size;
        let healthStatus: 'healthy' | 'warning' | 'error' = 'healthy';
        let healthMessage: string | undefined;

        // CRITICAL: Infrastructure health checks
        if (currentCount > 1000) {
            healthStatus = 'error';
            healthMessage = `CRITICAL: ${currentCount} files indexed - likely including node_modules or build artifacts`;
        } else if (currentCount > 200) {
            healthStatus = 'warning';
            healthMessage = `WARNING: ${currentCount} files indexed - higher than expected (~50)`;
        } else if (this._isCodebaseIndexed && currentCount === 0) {
            healthStatus = 'error';
            healthMessage = 'CRITICAL: Marked as indexed but no files in index';
        }

        return {
            expectedCount: this._expectedFileCount,
            lastResults: this._lastIndexingResults,
            isIndexed: this._isCodebaseIndexed,
            timestamp: this._codebaseIndexTimestamp,
            currentCount: currentCount,
            healthStatus: healthStatus,
            healthMessage: healthMessage
        };
    }

    /**
     * Handle AI-generated file lifecycle with smart cleanup and user consent
     * MANDATORY: Comprehensive error handling and validation
     */
    public async handleFileLifecycle(
        fileName: string,
        content: string,
        options: FileLifecycleOptions
    ): Promise<FileLifecycleResult> {
        try {
            if (!this.fileLifecycleManager) {
                throw new Error('CRITICAL: FileLifecycleManager not initialized');
            }

            return await this.fileLifecycleManager.handleFileLifecycle(fileName, content, options);

        } catch (error) {
            console.error('File lifecycle handling failed:', error);
            return {
                success: false,
                action: 'error',
                message: `❌ File lifecycle failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Strategic cleanup of Piggie files
     * MANDATORY: Comprehensive error handling
     */
    public async performStrategicCleanup(): Promise<void> {
        try {
            if (!this.piggieDirectoryManager) {
                return;
            }

            // Clean up old backups (keep last 5 per file)
            await this.piggieDirectoryManager.cleanupOldBackups(5);

            // Clean up any legacy backup files in the main directory
            await this.cleanupLegacyBackups();

            console.log('🧹 Strategic cleanup completed');

        } catch (error) {
            console.error('Strategic cleanup failed:', error);
            // Don't throw - cleanup failure shouldn't break functionality
        }
    }

    /**
     * Clean up legacy backup files that might exist in the main directory
     */
    private async cleanupLegacyBackups(): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }

            // Find legacy backup files (*.backup.* pattern in main directories)
            const legacyBackups = await vscode.workspace.findFiles(
                '**/*.backup.*',
                '**/node_modules/**,**/.piggie/**'
            );

            for (const backupFile of legacyBackups) {
                try {
                    await vscode.workspace.fs.delete(backupFile);
                    console.log(`🗑️ Cleaned up legacy backup: ${backupFile.fsPath}`);
                } catch (error) {
                    console.warn(`Failed to clean up legacy backup ${backupFile.fsPath}:`, error);
                }
            }

        } catch (error) {
            console.warn('Failed to clean up legacy backups:', error);
        }
    }

    /**
     * Dispose resources and clear sensitive data
     * MANDATORY: Proper resource disposal (manifesto requirement)
     */
    public async dispose(): Promise<void> {
        try {
            // Strategic cleanup before disposal
            await this.performStrategicCleanup();

            // Clear all maps and arrays
            this._codebaseIndex.clear();
            this._qContextPriority.clear();
            this._mrCache.clear();
            this._projectGlossary.clear();
            this._qContextWindow = [];
            this._conversationHistory = [];

            // Provider disposal is now handled by the extension.ts activate function

            console.log('🗑️ StateManager disposed successfully');
        } catch (error) {
            console.error('Error disposing StateManager:', error);
        }
    }
}
