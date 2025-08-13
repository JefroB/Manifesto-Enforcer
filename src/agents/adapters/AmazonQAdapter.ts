import * as vscode from 'vscode';
import { IAgentAdapter } from '../interfaces/IAgentAdapter';
import { AgentConfig, AgentProvider, ChatMessage } from '../../core/types';

/**
 * Amazon Q Agent Adapter - AWS AI Assistant integration
 * Provides AI assistance through Amazon Q extension
 */
export class AmazonQAdapter implements IAgentAdapter {
    private config: AgentConfig;
    private amazonQExtension: vscode.Extension<any> | undefined;

    constructor(config: AgentConfig) {
        try {
            if (!config || !config.id || !config.name) {
                throw new Error('Invalid AmazonQAdapter configuration: missing required fields');
            }

            this.config = {
                ...config,
                provider: AgentProvider.AMAZON_Q,
                isEnabled: true
            };

            this.initializeAmazonQExtension();
            console.log('🐷 AmazonQAdapter: Initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
            throw new Error(`AmazonQAdapter initialization failed: ${errorMessage}`);
        }
    }

    /**
     * Initialize Amazon Q extension connection
     */
    private initializeAmazonQExtension(): void {
        try {
            console.log('🐷 AmazonQAdapter: Searching for Amazon Q extension...');
            
            // Try different possible Amazon Q extension IDs
            const possibleIds = [
                'amazonwebservices.aws-toolkit-vscode',
                'amazonwebservices.amazon-q-vscode',
                'amazon.aws-toolkit-vscode',
                'aws.amazon-q',
                'amazon.amazon-q'
            ];

            for (const id of possibleIds) {
                this.amazonQExtension = vscode.extensions.getExtension(id);
                if (this.amazonQExtension) {
                    console.log('🐷 AmazonQAdapter: Found Amazon Q extension with ID:', id);
                    break;
                }
            }

            if (!this.amazonQExtension) {
                console.warn('🐷 AmazonQAdapter: Amazon Q extension not found with any known ID');
            }
        } catch (error) {
            console.error('🐷 AmazonQAdapter: Error initializing extension:', error);
        }
    }

    /**
     * Get agent configuration
     */
    getConfig(): AgentConfig {
        return { ...this.config };
    }

    /**
     * Validate connection to Amazon Q
     */
    async validateConnection(): Promise<boolean> {
        try {
            console.log('🐷 AmazonQAdapter: Validating Amazon Q connection...');

            if (!this.amazonQExtension) {
                console.warn('🐷 AmazonQAdapter: Amazon Q extension not found');
                return false;
            }

            // Activate extension if not already active
            if (!this.amazonQExtension.isActive) {
                console.log('🐷 AmazonQAdapter: Activating Amazon Q extension...');
                await this.amazonQExtension.activate();
            }

            console.log('🐷 AmazonQAdapter: Amazon Q extension is active');
            return true;

        } catch (error) {
            console.warn('🐷 AmazonQAdapter: Connection validation failed:', error);
            return false;
        }
    }

    /**
     * Send message to Amazon Q
     */
    async sendMessage(message: string): Promise<ChatMessage> {
        try {
            if (!message || typeof message !== 'string') {
                throw new Error('Invalid message: must be a non-empty string');
            }

            if (!this.amazonQExtension || !this.amazonQExtension.isActive) {
                return this.getUnavailableResponse();
            }

            // Try to use Amazon Q's chat functionality
            try {
                // Amazon Q typically uses commands for interaction
                const manifestoMessage = this.buildManifestoMessage(message);
                
                // Try to execute Amazon Q chat command
                await vscode.commands.executeCommand('aws.amazonq.openChat');
                
                // Note: Amazon Q doesn't have a direct API for sending messages programmatically
                // This is a limitation of the Amazon Q extension architecture
                return {
                    id: `amazonq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: `🤖 **Amazon Q Integration**

Your message has been prepared for Amazon Q: "${message}"

**Manifesto-Enhanced Prompt:**
${manifestoMessage}

**Next Steps:**
1. Amazon Q chat window should be open
2. Copy and paste the manifesto-enhanced prompt above
3. Amazon Q will provide AI assistance following manifesto principles

*Note: Amazon Q doesn't support direct API integration, so manual interaction is required.*`,
                    timestamp: new Date(),
                    agentId: this.config.id,
                    manifestoApplied: true,
                    metadata: {
                        provider: 'amazon-q',
                        responseType: 'integration',
                        originalMessage: message,
                        enhancedPrompt: manifestoMessage
                    }
                };

            } catch (commandError) {
                console.warn('🐷 AmazonQAdapter: Command execution failed:', commandError);
                return this.getFallbackResponse(message);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown Amazon Q error';
            return {
                id: `amazonq-error-${Date.now()}`,
                role: 'assistant',
                content: `❌ **Amazon Q Error**: ${errorMessage}`,
                timestamp: new Date(),
                agentId: this.config.id,
                manifestoApplied: false,
                metadata: {
                    provider: 'amazon-q',
                    responseType: 'error'
                }
            };
        }
    }

    /**
     * Check if agent is connected
     */
    isConnected(): boolean {
        return this.amazonQExtension?.isActive || false;
    }

    /**
     * Dispose resources
     */
    async dispose(): Promise<void> {
        try {
            this.amazonQExtension = undefined;
            console.log('🐷 AmazonQAdapter: Disposed successfully');
        } catch (error) {
            console.error('🐷 AmazonQAdapter: Error during disposal:', error);
        }
    }

    /**
     * Build manifesto-aware message for Amazon Q
     */
    private buildManifestoMessage(userMessage: string): string {
        return `Following strict development manifesto principles:

CORE REQUIREMENTS:
- Include comprehensive error handling (try-catch blocks)
- Validate all inputs before processing  
- Add JSDoc documentation for functions
- Never use 'any' type in TypeScript
- Prioritize security and input validation

USER REQUEST: ${userMessage}

Please provide a response that follows these manifesto principles. If generating code, ensure it includes proper error handling and validation.`;
    }

    /**
     * Get response when Amazon Q is unavailable
     */
    private getUnavailableResponse(): ChatMessage {
        return {
            id: `amazonq-unavailable-${Date.now()}`,
            role: 'assistant',
            content: `🤖 **Amazon Q Not Available**

Amazon Q extension is not installed or not active. To use Amazon Q:

1. **Install**: Search for "AWS Toolkit" in VSCode extensions
2. **Activate**: Sign in to your AWS account
3. **Configure**: Set up Amazon Q access

**Alternative**: Use the Local Agent for basic manifesto guidance, or connect to Auggie for advanced AI assistance.

*Amazon Q provides powerful AI capabilities integrated with AWS services.*`,
            timestamp: new Date(),
            agentId: this.config.id,
            manifestoApplied: false,
            metadata: {
                provider: 'amazon-q',
                responseType: 'unavailable'
            }
        };
    }

    /**
     * Get fallback response when direct integration fails
     */
    private getFallbackResponse(message: string): ChatMessage {
        const manifestoPrompt = this.buildManifestoMessage(message);
        
        return {
            id: `amazonq-fallback-${Date.now()}`,
            role: 'assistant',
            content: `🤖 **Amazon Q - Manual Integration Required**

Amazon Q is available but requires manual interaction. Here's your manifesto-enhanced prompt:

\`\`\`
${manifestoPrompt}
\`\`\`

**Instructions:**
1. Open Amazon Q chat (Ctrl+Shift+P → "Amazon Q: Open Chat")
2. Copy and paste the prompt above
3. Amazon Q will provide AI assistance following manifesto principles

*This ensures your requests follow development best practices.*`,
            timestamp: new Date(),
            agentId: this.config.id,
            manifestoApplied: true,
            metadata: {
                provider: 'amazon-q',
                responseType: 'manual',
                enhancedPrompt: manifestoPrompt
            }
        };
    }
}
