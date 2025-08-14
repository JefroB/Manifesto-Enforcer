/**
 * Settings Commands for Admin Functions
 * Phase 1: TDD Implementation - Admin commands moved to settings
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../core/AgentManager';

/**
 * Settings-based admin commands
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 */
export class SettingsCommands {
    private stateManager: StateManager;
    private agentManager: AgentManager;

    /**
     * Constructor
     * MANDATORY: Input validation (manifesto requirement)
     */
    constructor(context: vscode.ExtensionContext) {
        try {
            if (!context) {
                throw new Error('ExtensionContext is required');
            }

            this.stateManager = StateManager.getInstance(context);
            this.agentManager = AgentManager.getInstance();
        } catch (error) {
            console.error('SettingsCommands initialization failed:', error);
            throw new Error(`SettingsCommands initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Register all settings commands
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public registerCommands(context: vscode.ExtensionContext): void {
        try {
            const commands = [
                vscode.commands.registerCommand('manifestoEnforcer.settings.testConnection', () => this.testConnection()),
                vscode.commands.registerCommand('manifestoEnforcer.settings.discoverAPIs', () => this.discoverAPIs())
            ];

            commands.forEach(command => context.subscriptions.push(command));
            console.log('✅ Settings commands registered successfully');
        } catch (error) {
            console.error('Failed to register settings commands:', error);
            throw new Error(`Settings commands registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Test connection to current AI agent (Settings UI)
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private async testConnection(): Promise<void> {
        try {
            const startTime = Date.now();

            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Testing Piggie Connection...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Initializing connection test..." });

                // Test current agent connection
                const currentAgent = this.stateManager.currentAgent;
                progress.report({ increment: 30, message: `Testing ${currentAgent} connection...` });

                const isConnected = await this.agentManager.testConnection(currentAgent);
                progress.report({ increment: 70, message: "Validating response..." });

                const duration = Date.now() - startTime;
                progress.report({ increment: 100, message: "Connection test complete" });

                // Show results
                if (isConnected) {
                    vscode.window.showInformationMessage(
                        `✅ Connection successful! ${currentAgent} is responding (${duration}ms)`
                    );
                } else {
                    vscode.window.showErrorMessage(
                        `❌ Connection failed! ${currentAgent} is not responding`
                    );
                }
            });

        } catch (error) {
            console.error('Connection test failed:', error);
            vscode.window.showErrorMessage(
                `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Discover available AI agent APIs (Settings UI)
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private async discoverAPIs(): Promise<void> {
        try {
            const startTime = Date.now();

            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Discovering AI Agent APIs...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Scanning for available agents..." });

                // Discover available agents
                const availableAgents = await this.agentManager.discoverAgents();
                progress.report({ increment: 50, message: "Testing agent connections..." });

                // Test each discovered agent
                const connectionResults = await Promise.allSettled(
                    availableAgents.map(agent => this.agentManager.testConnection(agent))
                );

                progress.report({ increment: 90, message: "Compiling results..." });

                const duration = Date.now() - startTime;
                progress.report({ increment: 100, message: "Discovery complete" });

                // Show results
                const connectedAgents = availableAgents.filter((_, index) => 
                    connectionResults[index].status === 'fulfilled' && 
                    (connectionResults[index] as PromiseFulfilledResult<boolean>).value
                );

                const message = connectedAgents.length > 0 
                    ? `✅ Found ${connectedAgents.length} available agents: ${connectedAgents.join(', ')} (${duration}ms)`
                    : `⚠️ No agents found or all connections failed (${duration}ms)`;

                if (connectedAgents.length > 0) {
                    vscode.window.showInformationMessage(message);
                } else {
                    vscode.window.showWarningMessage(message);
                }
            });

        } catch (error) {
            console.error('API discovery failed:', error);
            vscode.window.showErrorMessage(
                `API discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Validate settings configuration
     * MANDATORY: Input validation (manifesto requirement)
     */
    public async validateSettings(): Promise<boolean> {
        try {
            const config = vscode.workspace.getConfiguration('manifestoEnforcer');
            
            // Validate manifesto mode
            const manifestoMode = config.get<string>('manifestoMode', 'developer');
            const validModes = ['developer', 'qa', 'solo'];
            if (!validModes.includes(manifestoMode)) {
                throw new Error(`Invalid manifesto mode: ${manifestoMode}`);
            }

            // Validate manifesto file paths
            const devPath = config.get<string>('devManifestoPath', 'manifesto-dev.md');
            const qaPath = config.get<string>('qaManifestoPath', 'manifesto-qa.md');

            if (!devPath.endsWith('.md')) {
                throw new Error('Development manifesto file must have .md extension');
            }

            if (!qaPath.endsWith('.md')) {
                throw new Error('QA manifesto file must have .md extension');
            }

            return true;
        } catch (error) {
            console.error('Settings validation failed:', error);
            throw error;
        }
    }

    /**
     * Get settings validation status
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public async getValidationStatus(): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            await this.validateSettings();
            return { isValid: true, errors: [] };
        } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown validation error');
            return { isValid: false, errors };
        }
    }
}
