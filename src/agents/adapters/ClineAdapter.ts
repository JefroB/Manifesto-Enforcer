import * as vscode from 'vscode';
import { IAgentAdapter } from '../interfaces/IAgentAdapter';
import { AgentConfig, AgentProvider, ChatMessage } from '../../core/types';

/**
 * Cline Agent Adapter - Agentic coding assistant integration
 * Provides AI assistance through Cline extension
 */
export class ClineAdapter implements IAgentAdapter {
    private config: AgentConfig;
    private clineExtension: vscode.Extension<any> | undefined;

    constructor(config: AgentConfig) {
        try {
            if (!config || !config.id || !config.name) {
                throw new Error('Invalid ClineAdapter configuration: missing required fields');
            }

            this.config = {
                ...config,
                provider: AgentProvider.CLINE,
                isEnabled: true
            };

            this.initializeClineExtension();
            console.log('🐷 ClineAdapter: Initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
            throw new Error(`ClineAdapter initialization failed: ${errorMessage}`);
        }
    }

    /**
     * Initialize Cline extension connection
     */
    private initializeClineExtension(): void {
        try {
            console.log('🐷 ClineAdapter: Searching for Cline extension...');
            
            // Try different possible Cline extension IDs
            const possibleIds = [
                'saoudrizwan.claude-dev',
                'cline.cline',
                'claude-dev.claude-dev',
                'anthropic.claude-dev',
                'saoudrizwan.cline'
            ];

            for (const id of possibleIds) {
                this.clineExtension = vscode.extensions.getExtension(id);
                if (this.clineExtension) {
                    console.log('🐷 ClineAdapter: Found Cline extension with ID:', id);
                    break;
                }
            }

            if (!this.clineExtension) {
                console.warn('🐷 ClineAdapter: Cline extension not found with any known ID');
            }
        } catch (error) {
            console.error('🐷 ClineAdapter: Error initializing extension:', error);
        }
    }

    /**
     * Get agent configuration
     */
    getConfig(): AgentConfig {
        return { ...this.config };
    }

    /**
     * Validate connection to Cline
     */
    async validateConnection(): Promise<boolean> {
        try {
            console.log('🐷 ClineAdapter: Validating Cline connection...');

            if (!this.clineExtension) {
                console.warn('🐷 ClineAdapter: Cline extension not found');
                return false;
            }

            // Activate extension if not already active
            if (!this.clineExtension.isActive) {
                console.log('🐷 ClineAdapter: Activating Cline extension...');
                await this.clineExtension.activate();
            }

            console.log('🐷 ClineAdapter: Cline extension is active');
            return true;

        } catch (error) {
            console.warn('🐷 ClineAdapter: Connection validation failed:', error);
            return false;
        }
    }

    /**
     * Send message to Cline
     */
    async sendMessage(message: string): Promise<ChatMessage> {
        try {
            if (!message || typeof message !== 'string') {
                throw new Error('Invalid message: must be a non-empty string');
            }

            if (!this.clineExtension || !this.clineExtension.isActive) {
                return this.getUnavailableResponse();
            }

            // Try to use Cline's functionality
            try {
                const manifestoMessage = this.buildManifestoMessage(message);
                
                // Try to execute Cline commands
                await vscode.commands.executeCommand('cline.newTask');
                
                return {
                    id: `cline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: `🤖 **Cline Integration**

Your message has been prepared for Cline: "${message}"

**Manifesto-Enhanced Prompt:**
${manifestoMessage}

**Next Steps:**
1. Cline task window should be open
2. Copy and paste the manifesto-enhanced prompt above
3. Cline will provide agentic coding assistance following manifesto principles

*Cline excels at autonomous coding tasks and file operations.*`,
                    timestamp: new Date(),
                    agentId: this.config.id,
                    manifestoApplied: true,
                    metadata: {
                        provider: 'cline',
                        responseType: 'integration',
                        originalMessage: message,
                        enhancedPrompt: manifestoMessage
                    }
                };

            } catch (commandError) {
                console.warn('🐷 ClineAdapter: Command execution failed:', commandError);
                return this.getFallbackResponse(message);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown Cline error';
            return {
                id: `cline-error-${Date.now()}`,
                role: 'assistant',
                content: `❌ **Cline Error**: ${errorMessage}`,
                timestamp: new Date(),
                agentId: this.config.id,
                manifestoApplied: false,
                metadata: {
                    provider: 'cline',
                    responseType: 'error'
                }
            };
        }
    }

    /**
     * Check if agent is connected
     */
    isConnected(): boolean {
        return this.clineExtension?.isActive || false;
    }

    /**
     * Dispose resources
     */
    async dispose(): Promise<void> {
        try {
            this.clineExtension = undefined;
            console.log('🐷 ClineAdapter: Disposed successfully');
        } catch (error) {
            console.error('🐷 ClineAdapter: Error during disposal:', error);
        }
    }

    /**
     * Build manifesto-aware message for Cline
     */
    private buildManifestoMessage(userMessage: string): string {
        return `Following strict development manifesto principles for autonomous coding:

CORE REQUIREMENTS:
- Include comprehensive error handling (try-catch blocks)
- Validate all inputs before processing
- Add JSDoc documentation for all functions
- Never use 'any' type in TypeScript
- Prioritize security and input validation
- Test all generated code thoroughly

AUTONOMOUS CODING GUIDELINES:
- Create files with proper error handling from the start
- Include input validation in all functions
- Add comprehensive JSDoc comments
- Follow TypeScript best practices
- Implement proper testing patterns

USER REQUEST: ${userMessage}

Please provide autonomous coding assistance that follows these manifesto principles. Generate code that includes proper error handling, validation, and documentation.`;
    }

    /**
     * Get response when Cline is unavailable
     */
    private getUnavailableResponse(): ChatMessage {
        return {
            id: `cline-unavailable-${Date.now()}`,
            role: 'assistant',
            content: `🤖 **Cline Not Available**

Cline extension is not installed or not active. To use Cline:

1. **Install**: Search for "Cline" or "Claude Dev" in VSCode extensions
2. **Configure**: Set up your API keys (Claude, OpenAI, etc.)
3. **Activate**: Start a new Cline task

**Alternative**: Use Auggie for advanced AI assistance, or the Local Agent for basic manifesto guidance.

*Cline provides autonomous coding capabilities and can perform complex file operations.*`,
            timestamp: new Date(),
            agentId: this.config.id,
            manifestoApplied: false,
            metadata: {
                provider: 'cline',
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
            id: `cline-fallback-${Date.now()}`,
            role: 'assistant',
            content: `🤖 **Cline - Manual Integration Required**

Cline is available but requires manual interaction. Here's your manifesto-enhanced prompt:

\`\`\`
${manifestoPrompt}
\`\`\`

**Instructions:**
1. Open Cline (Ctrl+Shift+P → "Cline: New Task")
2. Copy and paste the prompt above
3. Cline will provide autonomous coding assistance following manifesto principles

*This ensures your coding tasks follow development best practices and include proper error handling.*`,
            timestamp: new Date(),
            agentId: this.config.id,
            manifestoApplied: true,
            metadata: {
                provider: 'cline',
                responseType: 'manual',
                enhancedPrompt: manifestoPrompt
            }
        };
    }
}
