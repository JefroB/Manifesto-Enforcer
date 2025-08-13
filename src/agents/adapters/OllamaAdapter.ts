import * as vscode from 'vscode';
import { IAgentAdapter } from '../interfaces/IAgentAdapter';
import { AgentConfig, AgentProvider, ChatMessage } from '../../core/types';

/**
 * Ollama Agent Adapter - Local LLM integration
 * Provides AI assistance through local Ollama installation
 */
export class OllamaAdapter implements IAgentAdapter {
    private config: AgentConfig;
    private isOllamaAvailable: boolean = false;
    private defaultModel: string = 'llama2';

    constructor(config: AgentConfig) {
        try {
            if (!config || !config.id || !config.name) {
                throw new Error('Invalid OllamaAdapter configuration: missing required fields');
            }

            this.config = {
                ...config,
                provider: AgentProvider.OLLAMA,
                isEnabled: true
            };

            console.log('🐷 OllamaAdapter: Initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
            throw new Error(`OllamaAdapter initialization failed: ${errorMessage}`);
        }
    }

    /**
     * Get agent configuration
     */
    getConfig(): AgentConfig {
        return { ...this.config };
    }

    /**
     * Validate connection to Ollama service
     */
    async validateConnection(): Promise<boolean> {
        try {
            console.log('🐷 OllamaAdapter: Checking Ollama availability...');
            
            // Check if Ollama is running on default port
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json() as { models?: any[] };
                this.isOllamaAvailable = true;
                console.log('🐷 OllamaAdapter: Connected successfully, available models:', data.models?.length || 0);
                return true;
            } else {
                console.warn('🐷 OllamaAdapter: Ollama service not responding');
                return false;
            }
        } catch (error) {
            console.warn('🐷 OllamaAdapter: Connection failed - Ollama not available:', error);
            this.isOllamaAvailable = false;
            return false;
        }
    }

    /**
     * Send message to Ollama
     */
    async sendMessage(message: string): Promise<ChatMessage> {
        try {
            if (!message || typeof message !== 'string') {
                throw new Error('Invalid message: must be a non-empty string');
            }

            if (!this.isOllamaAvailable) {
                return this.getUnavailableResponse();
            }

            // Send request to Ollama
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.defaultModel,
                    prompt: this.buildManifestoPrompt(message),
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as { response?: string; eval_duration?: number };
            
            return {
                id: `ollama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: 'assistant',
                content: data.response || 'No response from Ollama',
                timestamp: new Date(),
                agentId: this.config.id,
                manifestoApplied: true,
                metadata: {
                    provider: 'ollama',
                    model: this.defaultModel,
                    responseTime: data.eval_duration || 0
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown Ollama error';
            return {
                id: `ollama-error-${Date.now()}`,
                role: 'assistant',
                content: `❌ **Ollama Error**: ${errorMessage}\n\n*Make sure Ollama is installed and running: \`ollama serve\`*`,
                timestamp: new Date(),
                agentId: this.config.id,
                manifestoApplied: false,
                metadata: {
                    provider: 'ollama',
                    responseType: 'error'
                }
            };
        }
    }

    /**
     * Check if agent is connected
     */
    isConnected(): boolean {
        return this.isOllamaAvailable;
    }

    /**
     * Dispose resources
     */
    async dispose(): Promise<void> {
        try {
            this.isOllamaAvailable = false;
            console.log('🐷 OllamaAdapter: Disposed successfully');
        } catch (error) {
            console.error('🐷 OllamaAdapter: Error during disposal:', error);
        }
    }

    /**
     * Build manifesto-aware prompt
     */
    private buildManifestoPrompt(userMessage: string): string {
        return `You are a development assistant following strict coding manifesto principles:

CORE RULES:
- Always include comprehensive error handling with try-catch blocks
- Validate all inputs before processing
- Add JSDoc documentation for all functions
- Never use 'any' type in TypeScript
- Prioritize security and input validation

USER REQUEST: ${userMessage}

Provide a helpful response following these manifesto principles. If generating code, ensure it includes proper error handling and validation.`;
    }

    /**
     * Get response when Ollama is unavailable
     */
    private getUnavailableResponse(): ChatMessage {
        return {
            id: `ollama-unavailable-${Date.now()}`,
            role: 'assistant',
            content: `🦙 **Ollama Not Available**

Ollama is not currently running or accessible. To use Ollama:

1. **Install Ollama**: Visit https://ollama.ai
2. **Start the service**: Run \`ollama serve\`
3. **Pull a model**: Run \`ollama pull llama2\`

**Alternative**: Use the Local Agent for basic manifesto guidance, or connect to other AI providers like Auggie or Amazon Q.

*Ollama provides powerful local LLM capabilities without sending data to external services.*`,
            timestamp: new Date(),
            agentId: this.config.id,
            manifestoApplied: false,
            metadata: {
                provider: 'ollama',
                responseType: 'unavailable'
            }
        };
    }
}
