/**
 * Auggie (Augment Code) Agent Adapter
 * Following manifesto: interface-based programming, comprehensive error handling
 */

import * as vscode from 'vscode';
import { IAgentAdapter, AgentCapabilities } from '../interfaces/IAgentAdapter';
import { AgentConfig, ChatMessage, AgentProvider } from '../../core/types';

/**
 * Adapter for Auggie (Augment Code) integration
 * Implements secure communication with Augment Code extension
 */
export class AuggieAdapter implements IAgentAdapter {
  private config: AgentConfig;
  private augmentExtension: vscode.Extension<any> | undefined;

  constructor(config: AgentConfig) {
    console.log('🐷 AuggieAdapter: Constructor called with config:', config);

    // MANDATORY: Input validation
    if (!config || config.provider !== AgentProvider.AUGGIE) {
      console.error('🐷 AuggieAdapter: Invalid configuration:', config);
      throw new Error('Invalid configuration for Auggie adapter');
    }

    console.log('🐷 AuggieAdapter: Config validation passed');
    this.config = { ...config };
    console.log('🐷 AuggieAdapter: Config stored, initializing Augment extension...');
    this.initializeAugmentExtension();
    console.log('🐷 AuggieAdapter: Constructor completed');
  }

  /**
   * Send message to Auggie
   * OPTIMIZE: Ensure sub-200ms response when possible
   */
  async sendMessage(message: string, context?: any): Promise<ChatMessage> {
    const startTime = Date.now();

    try {
      // MANDATORY: Input validation
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message: must be non-empty string');
      }

      // Check if Augment extension is available
      if (!this.augmentExtension || !this.augmentExtension.isActive) {
        throw new Error('Augment Code extension not available or not active');
      }

      // Try different methods to communicate with Augment
      const response = await this.sendToAugment(message, context);

      const duration = Date.now() - startTime;
      if (duration > 200) {
        console.warn(`Auggie response took ${duration}ms - exceeds performance target`);
      }

      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        agentId: this.config.id,
        metadata: {
          responseTime: duration,
          provider: 'auggie'
        }
      };

    } catch (error) {
      // MANDATORY: Comprehensive error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown Auggie error';
      throw new Error(`Auggie communication failed: ${errorMessage}`);
    }
  }

  /**
   * Validate connection to Augment Code
   * REQUIRED: Check if extension is available and active
   */
  async validateConnection(): Promise<boolean> {
    try {
      console.log('🐷 AuggieAdapter: Starting connection validation...');

      // Try different possible extension IDs for Augment Code
      const possibleIds = [
        'augment.vscode-augment',
        'augment.augment',
        'augmentcode.augment',
        'Augment.augment'
      ];

      console.log('🐷 AuggieAdapter: Checking for Augment extension with IDs:', possibleIds);

      for (const id of possibleIds) {
        this.augmentExtension = vscode.extensions.getExtension(id);
        if (this.augmentExtension) {
          console.log('🐷 AuggieAdapter: Found Augment extension with ID:', id);
          console.log('🐷 AuggieAdapter: Extension details:', {
            id: this.augmentExtension.id,
            isActive: this.augmentExtension.isActive,
            displayName: this.augmentExtension.packageJSON?.displayName,
            version: this.augmentExtension.packageJSON?.version
          });
          break;
        }
      }

      if (!this.augmentExtension) {
        console.warn('🐷 AuggieAdapter: Augment Code extension not found with any known ID');
        console.log('🐷 AuggieAdapter: Available extensions:', vscode.extensions.all.map(ext => ext.id).filter(id => id.toLowerCase().includes('augment')));
        return false;
      }

      // Activate if not already active (with timeout to prevent hanging)
      if (!this.augmentExtension.isActive) {
        console.log('🐷 Activating Augment extension...');
        const activationPromise = this.augmentExtension.activate();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Activation timeout - likely authentication needed')), 2000)
        );

        try {
          await Promise.race([activationPromise, timeoutPromise]);
          console.log('🐷 Augment extension activated successfully');
        } catch (error) {
          console.warn('🐷 Augment extension activation timed out - this usually means authentication is needed');

          // Show helpful message to user about authentication
          const authAction = await vscode.window.showInformationMessage(
            '🐷 Piggie needs you to sign in to Augment Code first!',
            'Open Augment Panel',
            'Learn More'
          );

          if (authAction === 'Open Augment Panel') {
            // Try to open Augment panel for authentication
            try {
              await vscode.commands.executeCommand('workbench.view.extension.augment');
            } catch {
              await vscode.commands.executeCommand('augment.openPanel');
            }
          } else if (authAction === 'Learn More') {
            vscode.env.openExternal(vscode.Uri.parse('https://docs.augmentcode.com/setup-augment/sign-in'));
          }

          return false;
        }
      }

      // Test basic functionality
      const commands = await vscode.commands.getCommands();
      const hasAugmentCommands = commands.some(cmd => cmd.startsWith('augment.') || cmd.includes('chat'));

      return hasAugmentCommands;

    } catch (error) {
      console.error('Auggie validation failed:', error);
      return false;
    }
  }

  /**
   * Get adapter configuration
   * CRITICAL: Ensure sensitive data is handled securely
   */
  getConfig(): AgentConfig {
    // Return a copy to prevent external modification
    return { ...this.config };
  }

  /**
   * Get Auggie capabilities
   */
  getCapabilities(): AgentCapabilities {
    return {
      supportsCodeGeneration: true,
      supportsFileOperations: true,
      supportsStreaming: false, // Auggie doesn't support streaming yet
      maxTokens: 8192, // Estimated based on Auggie's capabilities
      supportedLanguages: [
        'typescript', 'javascript', 'python', 'java', 'csharp', 
        'cpp', 'rust', 'go', 'php', 'ruby', 'swift', 'kotlin'
      ],
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000,
        maxConcurrentRequests: 5
      }
    };
  }

  /**
   * Clean up resources
   * MANDATORY: Proper resource disposal
   */
  async dispose(): Promise<void> {
    try {
      // Clear any cached data
      this.augmentExtension = undefined;
      
      // Clear sensitive configuration
      if (this.config.apiKey) {
        this.config.apiKey = '';
      }

      console.log('Auggie adapter disposed successfully');

    } catch (error) {
      console.error('Error disposing Auggie adapter:', error);
    }
  }

  // Private helper methods

  private initializeAugmentExtension(): void {
    try {
      console.log('🐷 AuggieAdapter: initializeAugmentExtension() called');
      console.log('🐷 AuggieAdapter: Checking vscode.extensions availability...');
      console.log('🐷 AuggieAdapter: vscode.extensions type:', typeof vscode.extensions);
      console.log('🐷 AuggieAdapter: vscode.extensions.getExtension type:', typeof vscode.extensions?.getExtension);

      if (!vscode.extensions || !vscode.extensions.getExtension) {
        throw new Error('vscode.extensions.getExtension not available');
      }

      console.log('🐷 AuggieAdapter: Attempting to get Augment extension...');
      this.augmentExtension = vscode.extensions.getExtension('augment.vscode-augment');

      if (this.augmentExtension) {
        console.log('🐷 AuggieAdapter: Augment extension found:', {
          id: this.augmentExtension.id,
          isActive: this.augmentExtension.isActive,
          displayName: this.augmentExtension.packageJSON?.displayName
        });
      } else {
        console.log('🐷 AuggieAdapter: Augment extension not found with ID "augment.vscode-augment"');
        console.log('🐷 AuggieAdapter: Trying alternative extension IDs...');

        const alternativeIds = [
          'Augment.vscode-augment',
          'augment.augment',
          'Augment.augment'
        ];

        for (const id of alternativeIds) {
          console.log('🐷 AuggieAdapter: Trying extension ID:', id);
          this.augmentExtension = vscode.extensions.getExtension(id);
          if (this.augmentExtension) {
            console.log('🐷 AuggieAdapter: Found Augment extension with ID:', id);
            break;
          }
        }

        if (!this.augmentExtension) {
          console.log('🐷 AuggieAdapter: No Augment extension found with any known ID');
        }
      }

    } catch (error) {
      console.warn('🐷 AuggieAdapter: Could not initialize Augment extension:', error);
      console.log('🐷 AuggieAdapter: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  }

  private async sendToAugment(message: string, context?: any): Promise<string> {
    try {
      // Method 1: Try direct API if available
      if (this.augmentExtension?.exports?.sendMessage) {
        return await this.augmentExtension.exports.sendMessage(message, context);
      }

      // Method 2: Try command execution with timeout
      const chatCommands = [
        'workbench.action.chat.open',
        'workbench.action.chat.toggle',
        'augment.openChat'
      ];

      for (const command of chatCommands) {
        try {
          // Add timeout to prevent hanging
          const commandPromise = vscode.commands.executeCommand(command);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Command timeout')), 1000)
          );

          await Promise.race([commandPromise, timeoutPromise]);
          break;
        } catch (error) {
          console.log(`Command ${command} failed, trying next...`);
        }
      }

      // Method 3: Fallback to clipboard integration
      await vscode.env.clipboard.writeText(message);
      
      vscode.window.showInformationMessage(
        '🤖 Message ready for Auggie - paste in Augment Code chat',
        'Open Augment'
      );

      // Return a placeholder response since we can't get actual response
      return `Message sent to Auggie via clipboard. Please check Augment Code for response.`;

    } catch (error) {
      throw new Error(`Failed to communicate with Augment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateMessageId(): string {
    return `auggie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
