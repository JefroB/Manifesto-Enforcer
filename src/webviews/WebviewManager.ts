/**
 * Webview Manager for centralized webview lifecycle management
 * Phase 5: Integration and Cleanup - TDD Implementation
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';
import { CodeActionsWebview } from './CodeActionsWebview';
import { ManifestoWebview } from './ManifestoWebview';
import { GlossaryWebview } from './GlossaryWebview';

/**
 * Centralized manager for all webview instances
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 */
export class WebviewManager {
    private context: vscode.ExtensionContext;
    private stateManager: StateManager;
    private agentManager: AgentManager;
    
    // Webview instances - only one of each type allowed
    private codeActionsWebview: CodeActionsWebview | undefined;
    private manifestoWebview: ManifestoWebview | undefined;
    private glossaryWebview: GlossaryWebview | undefined;

    /**
     * Constructor
     * MANDATORY: Input validation (manifesto requirement)
     */
    constructor(context: vscode.ExtensionContext, stateManager: StateManager, agentManager: AgentManager) {
        try {
            if (!context) {
                throw new Error('Invalid extension context provided');
            }
            if (!stateManager) {
                throw new Error('Invalid StateManager provided');
            }
            if (!agentManager) {
                throw new Error('Invalid AgentManager provided');
            }

            this.context = context;
            this.stateManager = stateManager;
            this.agentManager = agentManager;
        } catch (error) {
            console.error('WebviewManager initialization failed:', error);
            throw new Error(`WebviewManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Open or focus Code Actions webview
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async openCodeActions(): Promise<void> {
        try {
            if (this.codeActionsWebview && this.codeActionsWebview.panel) {
                // Focus existing webview
                this.codeActionsWebview.panel.reveal();
                return;
            }

            // Create new webview
            this.codeActionsWebview = new CodeActionsWebview(this.context, this.stateManager, this.agentManager);
            
            // Handle disposal
            if (this.codeActionsWebview.panel) {
                this.codeActionsWebview.panel.onDidDispose(() => {
                    this.codeActionsWebview = undefined;
                }, null, this.context.subscriptions);
            }

            vscode.window.showInformationMessage('📋 Code Actions panel opened');
        } catch (error) {
            console.error('Failed to open Code Actions webview:', error);
            vscode.window.showErrorMessage(`Failed to open Code Actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Open or focus Manifesto Management webview
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async openManifestoManagement(): Promise<void> {
        try {
            if (this.manifestoWebview && this.manifestoWebview.panel) {
                // Focus existing webview
                this.manifestoWebview.panel.reveal();
                return;
            }

            // Create new webview
            this.manifestoWebview = new ManifestoWebview(this.context, this.stateManager);
            
            // Handle disposal
            if (this.manifestoWebview.panel) {
                this.manifestoWebview.panel.onDidDispose(() => {
                    this.manifestoWebview = undefined;
                }, null, this.context.subscriptions);
            }

            vscode.window.showInformationMessage('📋 Manifesto Management panel opened');
        } catch (error) {
            console.error('Failed to open Manifesto Management webview:', error);
            vscode.window.showErrorMessage(`Failed to open Manifesto Management: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Open or focus Glossary Management webview
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async openGlossaryManagement(): Promise<void> {
        try {
            if (this.glossaryWebview && this.glossaryWebview.panel) {
                // Focus existing webview
                this.glossaryWebview.panel.reveal();
                return;
            }

            // Create new webview
            this.glossaryWebview = new GlossaryWebview(this.context, this.stateManager);
            
            // Handle disposal
            if (this.glossaryWebview.panel) {
                this.glossaryWebview.panel.onDidDispose(() => {
                    this.glossaryWebview = undefined;
                }, null, this.context.subscriptions);
            }

            vscode.window.showInformationMessage('📖 Glossary Management panel opened');
        } catch (error) {
            console.error('Failed to open Glossary Management webview:', error);
            vscode.window.showErrorMessage(`Failed to open Glossary Management: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get active webview instances count
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public getActiveWebviewCount(): number {
        try {
            let count = 0;
            if (this.codeActionsWebview && this.codeActionsWebview.panel) count++;
            if (this.manifestoWebview && this.manifestoWebview.panel) count++;
            if (this.glossaryWebview && this.glossaryWebview.panel) count++;
            return count;
        } catch (error) {
            console.error('Failed to get active webview count:', error);
            return 0;
        }
    }

    /**
     * Refresh all active webviews
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public refreshAllWebviews(): void {
        try {
            if (this.codeActionsWebview && this.codeActionsWebview.panel) {
                this.codeActionsWebview.refreshContent();
            }
            if (this.manifestoWebview && this.manifestoWebview.panel) {
                this.manifestoWebview.refreshContent();
            }
            if (this.glossaryWebview && this.glossaryWebview.panel) {
                this.glossaryWebview.refreshTable();
            }
        } catch (error) {
            console.error('Failed to refresh webviews:', error);
        }
    }

    /**
     * Handle manifesto mode change
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public onManifestoModeChanged(): void {
        try {
            // Refresh manifesto webview to reflect mode change
            if (this.manifestoWebview && this.manifestoWebview.panel) {
                this.manifestoWebview.refreshContent();
            }
            
            // Update code actions webview if needed
            if (this.codeActionsWebview && this.codeActionsWebview.panel) {
                this.codeActionsWebview.refreshContent();
            }
        } catch (error) {
            console.error('Failed to handle manifesto mode change:', error);
        }
    }

    /**
     * Handle agent switch
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public onAgentSwitched(agentName: string): void {
        try {
            if (!agentName || typeof agentName !== 'string') {
                throw new Error('Invalid agent name provided');
            }

            // Update code actions webview to reflect agent change
            if (this.codeActionsWebview && this.codeActionsWebview.panel) {
                this.codeActionsWebview.refreshContent();
            }
        } catch (error) {
            console.error('Failed to handle agent switch:', error);
        }
    }

    /**
     * Dispose all webviews
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public dispose(): void {
        try {
            if (this.codeActionsWebview) {
                this.codeActionsWebview.dispose();
                this.codeActionsWebview = undefined;
            }
            if (this.manifestoWebview) {
                this.manifestoWebview.dispose();
                this.manifestoWebview = undefined;
            }
            if (this.glossaryWebview) {
                this.glossaryWebview.dispose();
                this.glossaryWebview = undefined;
            }
        } catch (error) {
            console.error('Failed to dispose webviews:', error);
        }
    }

    /**
     * Setup Code Actions webview view (for sidebar panel)
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setupCodeActionsView(webviewView: vscode.WebviewView): void {
        try {
            if (!this.codeActionsWebview) {
                this.codeActionsWebview = new CodeActionsWebview(this.context, this.stateManager, this.agentManager);
            }
            this.codeActionsWebview.setupView(webviewView);
        } catch (error) {
            console.error('Failed to setup Code Actions view:', error);
            throw new Error(`Code Actions view setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Setup Manifesto Management webview view (for sidebar panel)
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setupManifestoManagementView(webviewView: vscode.WebviewView): void {
        try {
            if (!this.manifestoWebview) {
                this.manifestoWebview = new ManifestoWebview(this.context, this.stateManager);
            }
            this.manifestoWebview.setupView(webviewView);
        } catch (error) {
            console.error('Failed to setup Manifesto Management view:', error);
            throw new Error(`Manifesto Management view setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Setup Glossary Management webview view (for sidebar panel)
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setupGlossaryManagementView(webviewView: vscode.WebviewView): void {
        try {
            if (!this.glossaryWebview) {
                this.glossaryWebview = new GlossaryWebview(this.context, this.stateManager);
            }
            this.glossaryWebview.setupView(webviewView);
        } catch (error) {
            console.error('Failed to setup Glossary Management view:', error);
            throw new Error(`Glossary Management view setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get webview status for debugging
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public getStatus(): { [key: string]: boolean } {
        try {
            return {
                codeActions: !!(this.codeActionsWebview && this.codeActionsWebview.panel),
                manifestoManagement: !!(this.manifestoWebview && this.manifestoWebview.panel),
                glossaryManagement: !!(this.glossaryWebview && this.glossaryWebview.panel)
            };
        } catch (error) {
            console.error('Failed to get webview status:', error);
            return {
                codeActions: false,
                manifestoManagement: false,
                glossaryManagement: false
            };
        }
    }
}
