/**
 * Piggie Status Bar Component
 * Following manifesto: MANDATORY error handling, CRITICAL input validation, OPTIMIZE performance
 */

import * as vscode from 'vscode';
import { AgentConfig } from '../core/types';

/**
 * Status bar component for Piggie the manifesto-enforcing chatbot
 * Implements all security and performance requirements from manifesto
 */
export class PiggieStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private progressTimeout: NodeJS.Timeout | null = null;
  private isDisposed = false;

  constructor() {
    try {
      // MANDATORY: Comprehensive error handling
      this.statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 
        100
      );

      // Initialize with default state
      this.initializeStatusBar();
      this.statusBarItem.show();

    } catch (error) {
      // MANDATORY: Error handling with helpful messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      throw new Error(`Failed to initialize Piggie status bar: ${errorMessage}`);
    }
  }

  /**
   * Update status bar for manifesto mode changes
   * CRITICAL: Input validation on all user-facing functions
   */
  updateManifestoMode(isManifestoMode: boolean): void {
    try {
      // CRITICAL: Input validation (manifesto requirement)
      if (typeof isManifestoMode !== 'boolean') {
        throw new Error('Invalid manifesto mode: must be boolean');
      }

      if (this.isDisposed) {
        console.warn('Attempted to update disposed status bar');
        return;
      }

      if (isManifestoMode) {
        this.statusBarItem.text = '🛡️ Piggie: Enforcement ENABLED';
        this.statusBarItem.tooltip = '🐷 Piggie is enforcing manifesto rules - Click to open chat';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.command = 'manifestoEnforcer.openSecureChat';
      } else {
        this.statusBarItem.text = '⚡ Piggie: Enforcement DISABLED';
        this.statusBarItem.tooltip = '🐷 Piggie enforcement is disabled - Click to open chat';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.command = 'manifestoEnforcer.openSecureChat';
      }

    } catch (error) {
      // MANDATORY: Comprehensive error handling
      console.error('Failed to update manifesto mode:', error);
      this.showError('Failed to update Piggie mode');
    }
  }

  /**
   * Update status bar with active agent information
   * CRITICAL: Input validation and XSS prevention
   */
  updateActiveAgent(agentConfig: AgentConfig | null): void {
    try {
      if (this.isDisposed) return;

      // CRITICAL: Input validation
      if (agentConfig && (!agentConfig.id || !agentConfig.name)) {
        throw new Error('Invalid agent configuration: missing required fields');
      }

      let agentText = '';
      let agentTooltip = '';

      if (agentConfig) {
        // CRITICAL: XSS prevention - sanitize input
        const safeName = this.sanitizeText(agentConfig.name);
        agentText = ` | 🧠 ${safeName}`;
        agentTooltip = `🐷 Piggie is using: ${safeName} (${agentConfig.provider})`;
      } else {
        agentText = ' | 🧠 No Agent';
        agentTooltip = '🐷 No AI agent selected - Click to choose Piggie\'s brain';
      }

      // Update existing text while preserving manifesto mode info
      const currentText = this.statusBarItem.text;
      const baseText = currentText.split(' | ')[0] || '🐷 Piggie';
      
      this.statusBarItem.text = baseText + agentText;
      
      // Combine tooltips - handle both string and MarkdownString types
      const currentTooltip = this.statusBarItem.tooltip || '';
      const currentTooltipText = typeof currentTooltip === 'string' ? currentTooltip : currentTooltip.toString();
      this.statusBarItem.tooltip = currentTooltipText.split('\n')[0] + '\n' + agentTooltip;

    } catch (error) {
      console.error('Failed to update active agent:', error);
      this.showError('Failed to update Piggie\'s brain');
    }
  }

  /**
   * Show progress indicator
   * OPTIMIZE: Efficient UI updates with timeout management
   */
  showProgress(message: string, timeoutMs: number = 30000): void {
    try {
      if (this.isDisposed) return;

      // CRITICAL: Input validation
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid progress message');
      }

      // Clear existing timeout
      if (this.progressTimeout) {
        clearTimeout(this.progressTimeout);
      }

      // Show progress with spinning icon
      const sanitizedMessage = this.sanitizeText(message);
      this.statusBarItem.text = `$(loading~spin) 🐷 ${sanitizedMessage}`;
      this.statusBarItem.tooltip = `🐷 Piggie is working: ${sanitizedMessage}`;

      // Auto-hide progress after timeout
      this.progressTimeout = setTimeout(() => {
        this.hideProgress();
      }, timeoutMs);

    } catch (error) {
      console.error('Failed to show progress:', error);
    }
  }

  /**
   * Hide progress indicator
   */
  hideProgress(): void {
    try {
      if (this.isDisposed) return;

      if (this.progressTimeout) {
        clearTimeout(this.progressTimeout);
        this.progressTimeout = null;
      }

      // Restore normal status
      this.initializeStatusBar();

    } catch (error) {
      console.error('Failed to hide progress:', error);
    }
  }

  /**
   * Show error state
   * HANDLE: All user-facing errors must have helpful messages
   */
  showError(message: string): void {
    try {
      if (this.isDisposed) return;

      const sanitizedMessage = this.sanitizeText(message);
      this.statusBarItem.text = `❌ 🐷 ${sanitizedMessage}`;
      this.statusBarItem.tooltip = `🐷 Piggie encountered an error: ${sanitizedMessage}`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');

      // Auto-restore after 5 seconds
      setTimeout(() => {
        if (!this.isDisposed) {
          this.initializeStatusBar();
        }
      }, 5000);

    } catch (error) {
      console.error('Failed to show error:', error);
    }
  }

  /**
   * Dispose resources
   * MANDATORY: Proper resource disposal
   */
  dispose(): void {
    try {
      this.isDisposed = true;

      if (this.progressTimeout) {
        clearTimeout(this.progressTimeout);
        this.progressTimeout = null;
      }

      if (this.statusBarItem) {
        this.statusBarItem.dispose();
      }

    } catch (error) {
      console.error('Error disposing status bar:', error);
    }
  }

  // Private helper methods

  private initializeStatusBar(): void {
    this.statusBarItem.text = '🐷 Piggie: Ready';
    this.statusBarItem.tooltip = '🐷 Piggie - Your manifesto-enforcing AI assistant\nClick to open chat';
    this.statusBarItem.command = 'manifestoEnforcer.openSecureChat';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Sanitize text to prevent XSS attacks
   * CRITICAL: XSS prevention in all output rendering
   */
  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove HTML tags and dangerous characters
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>&"']/g, '') // Remove dangerous characters
      .trim()
      .substring(0, 100); // Limit length to prevent UI overflow
  }
}
