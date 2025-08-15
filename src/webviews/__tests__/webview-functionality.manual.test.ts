/**
 * Manual Test for Webview Functionality
 * This test creates actual webviews to verify button and tab functionality works
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { ManifestoWebview } from '../ManifestoWebview';
import { CodeActionsWebview } from '../CodeActionsWebview';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

describe('Manual Webview Functionality Tests', () => {
    let context: vscode.ExtensionContext;
    let stateManager: StateManager;
    let agentManager: AgentManager;

    beforeAll(async () => {
        // Get real extension context if available
        const extension = vscode.extensions.getExtension('manifesto-enforcer.manifesto-enforcer');
        if (extension && extension.isActive) {
            context = extension.exports?.context;
        }

        if (!context) {
            // Skip manual tests if no real context available
            console.log('⚠️ Skipping manual webview tests - no extension context available');
            return;
        }

        // Initialize real managers
        stateManager = StateManager.getInstance();
        agentManager = new AgentManager(context);
    });

    describe('🎯 ManifestoWebview Manual Tests', () => {
        test('should create webview with working tabs and buttons', async () => {
            if (!context) {
                console.log('⚠️ Skipping - no extension context');
                return;
            }

            try {
                const webview = new ManifestoWebview(context, stateManager);
                
                // Verify webview was created
                expect(webview.panel).toBeDefined();
                expect(webview.panel?.webview.html).toContain('Manifesto Management');
                
                // Test tab switching
                webview.handleMessage({ command: 'switchTab', tab: 'glossary' });
                expect(webview.panel?.webview.html).toContain('glossary');
                
                // Test mode switching
                webview.handleMessage({ command: 'switchMode', mode: 'qa' });
                
                // Clean up
                webview.dispose();
                
                console.log('✅ ManifestoWebview manual test passed');
            } catch (error) {
                console.error('❌ ManifestoWebview manual test failed:', error);
                throw error;
            }
        }, 10000);
    });

    describe('🎯 CodeActionsWebview Manual Tests', () => {
        test('should create webview with working buttons and filters', async () => {
            if (!context) {
                console.log('⚠️ Skipping - no extension context');
                return;
            }

            try {
                const webview = new CodeActionsWebview(context, stateManager, agentManager);
                
                // Verify webview was created
                expect(webview.panel).toBeDefined();
                expect(webview.panel?.webview.html).toContain('Code Actions');
                
                // Test filtering
                webview.handleMessage({ command: 'filterBySeverity', severity: 'error' });
                
                // Test sorting
                webview.handleMessage({ 
                    command: 'sortActions', 
                    sortBy: 'severity', 
                    direction: 'desc' 
                });
                
                // Verify sort properties were set
                expect((webview as any).sortColumn).toBe('severity');
                expect((webview as any).sortDirection).toBe('desc');
                
                // Clean up
                webview.dispose();
                
                console.log('✅ CodeActionsWebview manual test passed');
            } catch (error) {
                console.error('❌ CodeActionsWebview manual test failed:', error);
                throw error;
            }
        }, 10000);
    });

    describe('🎯 Message Handling Tests', () => {
        test('should handle invalid messages gracefully', async () => {
            if (!context) {
                console.log('⚠️ Skipping - no extension context');
                return;
            }

            try {
                const webview = new ManifestoWebview(context, stateManager);
                
                // Test null message
                expect(() => webview.handleMessage(null)).not.toThrow();
                
                // Test invalid command
                expect(() => webview.handleMessage({ command: 'invalidCommand' })).not.toThrow();
                
                // Clean up
                webview.dispose();
                
                console.log('✅ Message handling test passed');
            } catch (error) {
                console.error('❌ Message handling test failed:', error);
                throw error;
            }
        });
    });

    describe('🎯 UI Refresh Tests', () => {
        test('should refresh UI without errors', async () => {
            if (!context) {
                console.log('⚠️ Skipping - no extension context');
                return;
            }

            try {
                const webview = new CodeActionsWebview(context, stateManager, agentManager);
                
                // Test UI refresh
                (webview as any).refreshUI();
                
                // Verify HTML is still valid
                expect(webview.panel?.webview.html).toContain('Code Actions');
                
                // Clean up
                webview.dispose();
                
                console.log('✅ UI refresh test passed');
            } catch (error) {
                console.error('❌ UI refresh test failed:', error);
                throw error;
            }
        });
    });
});
