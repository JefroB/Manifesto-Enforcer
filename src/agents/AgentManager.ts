/**
 * Agent Manager - Central hub for managing AI agents
 * Following manifesto: SOLID principles, dependency injection, comprehensive error handling
 */

import { IAgentAdapter, AgentCapabilities } from './interfaces/IAgentAdapter';
import { AgentConfig, ChatMessage, PerformanceMetrics } from '../core/types';

/**
 * Manages multiple AI agents with manifesto compliance
 * Implements dependency injection and interface-based programming
 */
export class AgentManager {
  private agents: Map<string, IAgentAdapter> = new Map();
  private activeAgentId: string | null = null;
  private performanceMetrics: PerformanceMetrics[] = [];

  /**
   * Register a new AI agent adapter
   * MANDATORY: Validate agent before registration
   * CRITICAL: Handle sensitive configuration securely
   */
  async registerAgent(adapter: IAgentAdapter): Promise<void> {
    try {
      // MANDATORY: Input validation (manifesto requirement)
      if (!adapter) {
        throw new Error('Invalid agent adapter: adapter cannot be null or undefined');
      }

      const config = adapter.getConfig();
      if (!config || !config.id || !config.name) {
        throw new Error('Invalid agent configuration: missing required fields');
      }

      // REQUIRED: Validate agent connection
      const isValid = await adapter.validateConnection();
      if (!isValid) {
        throw new Error('Agent validation failed: unable to establish connection');
      }

      // Register the agent
      this.agents.set(config.id, adapter);

      // Set as active if it's the first agent
      if (this.agents.size === 1) {
        this.activeAgentId = config.id;
      }

      console.log(`Agent registered successfully: ${config.name} (${config.id})`);

    } catch (error) {
      // MANDATORY: Comprehensive error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';
      throw new Error(`Failed to register agent: ${errorMessage}`);
    }
  }

  /**
   * Send message to active agent with manifesto compliance
   * OPTIMIZE: Monitor performance and ensure sub-200ms when possible
   */
  async sendMessage(message: string, manifestoApplied: boolean = false): Promise<ChatMessage> {
    const startTime = Date.now();

    try {
      // MANDATORY: Input validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Invalid message content: message must be a non-empty string');
      }

      // Check for active agent
      if (!this.activeAgentId || !this.agents.has(this.activeAgentId)) {
        throw new Error('No active agent available: please select an agent first');
      }

      const activeAgent = this.agents.get(this.activeAgentId)!;
      
      // Send message to agent
      const response = await activeAgent.sendMessage(message);

      // Add metadata
      response.manifestoApplied = manifestoApplied;
      response.agentId = this.activeAgentId;

      // OPTIMIZE: Record performance metrics (manifesto requirement)
      const duration = Date.now() - startTime;
      this.recordPerformanceMetric('sendMessage', duration);

      if (duration > 200) {
        console.warn(`Message processing took ${duration}ms - exceeds 200ms performance target`);
      }

      return response;

    } catch (error) {
      // MANDATORY: Comprehensive error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown messaging error';
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
  }

  /**
   * Switch active agent
   * REQUIRED: Validate agent exists before switching
   */
  setActiveAgent(agentId: string): void {
    try {
      if (!agentId || typeof agentId !== 'string') {
        throw new Error('Invalid agent ID: must be a non-empty string');
      }

      if (!this.agents.has(agentId)) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      this.activeAgentId = agentId;
      console.log(`Switched to agent: ${agentId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown switching error';
      throw new Error(`Failed to switch agent: ${errorMessage}`);
    }
  }

  /**
   * Get currently active agent
   */
  getActiveAgent(): AgentConfig | null {
    if (!this.activeAgentId || !this.agents.has(this.activeAgentId)) {
      return null;
    }

    return this.agents.get(this.activeAgentId)!.getConfig();
  }

  /**
   * Get all available agents
   */
  getAvailableAgents(): AgentConfig[] {
    return Array.from(this.agents.values()).map(adapter => adapter.getConfig());
  }

  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentId: string): AgentCapabilities | null {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.getCapabilities) {
      return null;
    }

    return agent.getCapabilities();
  }

  /**
   * Remove agent
   * MANDATORY: Proper cleanup and resource disposal
   */
  async removeAgent(agentId: string): Promise<void> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Clean up agent resources
      await agent.dispose();

      // Remove from registry
      this.agents.delete(agentId);

      // Update active agent if necessary
      if (this.activeAgentId === agentId) {
        const remainingAgents = Array.from(this.agents.keys());
        this.activeAgentId = remainingAgents.length > 0 ? remainingAgents[0] : null;
      }

      console.log(`Agent removed: ${agentId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown removal error';
      throw new Error(`Failed to remove agent: ${errorMessage}`);
    }
  }

  /**
   * Get performance metrics
   * OPTIMIZE: Monitor system performance as per manifesto
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Dispose all agents and clean up resources
   * MANDATORY: Comprehensive cleanup
   */
  async dispose(): Promise<void> {
    try {
      const disposePromises = Array.from(this.agents.values()).map(agent => agent.dispose());
      await Promise.all(disposePromises);

      this.agents.clear();
      this.activeAgentId = null;
      this.performanceMetrics = [];

      console.log('AgentManager disposed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown disposal error';
      throw new Error(`Failed to dispose AgentManager: ${errorMessage}`);
    }
  }

  // Private helper methods

  private recordPerformanceMetric(operation: string, duration: number): void {
    this.performanceMetrics.push({
      responseTime: duration,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date()
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }
}
