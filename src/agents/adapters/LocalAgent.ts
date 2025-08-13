import * as vscode from 'vscode';
import { IAgentAdapter } from '../interfaces/IAgentAdapter';
import { AgentConfig, AgentProvider, ChatMessage } from '../../core/types';

/**
 * Local Agent - Always available fallback agent
 * Provides basic functionality without external dependencies
 */
export class LocalAgent implements IAgentAdapter {
    private config: AgentConfig;

    constructor(config: AgentConfig) {
        try {
            if (!config || !config.id || !config.name) {
                throw new Error('Invalid LocalAgent configuration: missing required fields');
            }

            this.config = {
                ...config,
                provider: AgentProvider.LOCAL,
                isEnabled: true
            };

            console.log('🐷 LocalAgent: Initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
            throw new Error(`LocalAgent initialization failed: ${errorMessage}`);
        }
    }

    /**
     * Get agent configuration
     */
    getConfig(): AgentConfig {
        return { ...this.config };
    }

    /**
     * Validate connection - always returns true for local agent
     */
    async validateConnection(): Promise<boolean> {
        try {
            // Local agent is always available
            console.log('🐷 LocalAgent: Connection validation passed (always available)');
            return true;
        } catch (error) {
            console.error('🐷 LocalAgent: Unexpected validation error:', error);
            return false;
        }
    }

    /**
     * Send message to local agent
     * Provides basic responses and manifesto guidance
     */
    async sendMessage(message: string): Promise<ChatMessage> {
        try {
            if (!message || typeof message !== 'string') {
                throw new Error('Invalid message: must be a non-empty string');
            }

            const trimmedMessage = message.trim().toLowerCase();

            // Generate response content based on message
            let responseContent: string;

            if (trimmedMessage.includes('manifesto') || trimmedMessage.includes('rules')) {
                responseContent = this.getManifestoGuidance();
            } else if (trimmedMessage.includes('error') || trimmedMessage.includes('exception')) {
                responseContent = this.getErrorHandlingGuidance();
            } else if (trimmedMessage.includes('security') || trimmedMessage.includes('validation')) {
                responseContent = this.getSecurityGuidance();
            } else if (trimmedMessage.includes('test') || trimmedMessage.includes('testing')) {
                responseContent = this.getTestingGuidance();
            } else if (trimmedMessage.includes('help') || trimmedMessage.includes('what can you do')) {
                responseContent = this.getHelpMessage();
            } else {
                responseContent = this.getDefaultResponse(message);
            }

            // Return properly formatted ChatMessage
            return {
                id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
                agentId: this.config.id,
                manifestoApplied: true,
                metadata: {
                    provider: 'local',
                    responseType: 'guidance'
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown message processing error';
            return {
                id: `local-error-${Date.now()}`,
                role: 'assistant',
                content: `❌ **LocalAgent Error**: ${errorMessage}`,
                timestamp: new Date(),
                agentId: this.config.id,
                manifestoApplied: false,
                metadata: {
                    provider: 'local',
                    responseType: 'error'
                }
            };
        }
    }

    /**
     * Check if agent is connected - always true for local agent
     */
    isConnected(): boolean {
        return true;
    }

    /**
     * Dispose resources
     */
    async dispose(): Promise<void> {
        try {
            console.log('🐷 LocalAgent: Disposed successfully');
        } catch (error) {
            console.error('🐷 LocalAgent: Error during disposal:', error);
        }
    }

    /**
     * Get manifesto guidance
     */
    private getManifestoGuidance(): string {
        return `📋 **Development Manifesto Guidance**

**Core Principles:**
• **Comprehensive Error Handling**: All functions must include try-catch blocks
• **Input Validation**: Validate all inputs before processing
• **Documentation**: JSDoc comments for all public functions
• **Security First**: Never trust user input, sanitize everything
• **Testing**: Write tests for all critical functionality

**Quick Actions:**
• Use \`/manifesto create\` to generate project-specific rules
• Use \`/lint\` to check code compliance
• Use \`/fix\` to auto-fix common issues

*LocalAgent provides basic guidance. For advanced AI assistance, connect to Auggie or other AI agents.*`;
    }

    /**
     * Get error handling guidance
     */
    private getErrorHandlingGuidance(): string {
        return `🛡️ **Error Handling Best Practices**

**Required Pattern:**
\`\`\`typescript
try {
    // Your code here
    if (!input) {
        throw new Error('Invalid input');
    }
    // Process input
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Operation failed:', errorMessage);
    // Handle gracefully
}
\`\`\`

**Key Rules:**
• Always use try-catch for async operations
• Validate inputs before processing
• Provide meaningful error messages
• Log errors for debugging
• Never let errors crash the application`;
    }

    /**
     * Get security guidance
     */
    private getSecurityGuidance(): string {
        return `🔒 **Security Best Practices**

**Input Validation:**
• Check for null/undefined values
• Validate data types
• Sanitize user input
• Use allowlists, not blocklists

**Common Vulnerabilities:**
• Avoid \`innerHTML\` - use \`textContent\`
• Escape user data in HTML
• Validate file paths
• Use parameterized queries

**Example:**
\`\`\`typescript
if (!input || typeof input !== 'string' || input.length > 1000) {
    throw new Error('Invalid input');
}
\`\`\``;
    }

    /**
     * Get testing guidance
     */
    private getTestingGuidance(): string {
        return `🧪 **Testing Best Practices**

**Test Structure:**
• Unit tests for individual functions
• Integration tests for workflows
• Error case testing
• Edge case validation

**Required Coverage:**
• All public methods
• Error handling paths
• Input validation
• Critical business logic

**Example:**
\`\`\`typescript
it('should handle invalid input gracefully', () => {
    expect(() => myFunction(null)).toThrow('Invalid input');
});
\`\`\``;
    }

    /**
     * Get help message
     */
    private getHelpMessage(): string {
        return `🐷 **LocalAgent - Basic AI Assistant**

**Available Commands:**
• Ask about **manifesto** rules and guidance
• Get **error handling** best practices
• Learn **security** recommendations
• Understand **testing** requirements

**Limitations:**
• Provides basic guidance only
• No code generation capabilities
• No advanced analysis features

**For Advanced Features:**
Connect to Auggie or other AI agents for:
• Code generation and editing
• Complex analysis and refactoring
• Project-specific recommendations

*Type your question or use slash commands like /manifesto, /lint, /fix*`;
    }

    /**
     * Get default response
     */
    private getDefaultResponse(message: string): string {
        return `🐷 **LocalAgent Response**

I received your message: "${message}"

I'm a basic local agent that provides manifesto guidance and best practices. For more advanced assistance, try:

• **Manifesto guidance**: Ask about "manifesto rules"
• **Error handling**: Ask about "error handling"
• **Security**: Ask about "security best practices"
• **Testing**: Ask about "testing guidelines"
• **Help**: Type "help" for available commands

*For advanced AI capabilities, connect to Auggie or other AI agents.*`;
    }
}
