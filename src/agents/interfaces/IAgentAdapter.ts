/**
 * Agent Adapter Interface
 * Following manifesto: interface-based programming, clear separation of concerns
 */

import { AgentConfig, ChatMessage } from '../../core/types';

/**
 * Interface for all AI agent adapters
 * Ensures consistent behavior across different AI providers
 */
export interface IAgentAdapter {
  /**
   * Send message to the AI agent
   * OPTIMIZE: Must complete under 200ms when possible
   * MANDATORY: Include comprehensive error handling
   */
  sendMessage(message: string, context?: any): Promise<ChatMessage>;

  /**
   * Validate connection to the AI service
   * REQUIRED: Check authentication and service availability
   */
  validateConnection(): Promise<boolean>;

  /**
   * Get agent configuration
   * CRITICAL: Ensure sensitive data is encrypted
   */
  getConfig(): AgentConfig;

  /**
   * Clean up resources
   * MANDATORY: Proper resource disposal
   */
  dispose(): Promise<void>;

  /**
   * Get agent capabilities and limitations
   */
  getCapabilities?(): AgentCapabilities;

  /**
   * Handle streaming responses (optional)
   */
  sendStreamingMessage?(message: string, onChunk: (chunk: string) => void): Promise<void>;
}

/**
 * Agent capabilities definition
 */
export interface AgentCapabilities {
  supportsCodeGeneration: boolean;
  supportsFileOperations: boolean;
  supportsStreaming: boolean;
  maxTokens: number;
  supportedLanguages: string[];
  rateLimits: RateLimits;
}

/**
 * Rate limiting configuration
 */
export interface RateLimits {
  requestsPerMinute: number;
  tokensPerMinute: number;
  maxConcurrentRequests: number;
}
