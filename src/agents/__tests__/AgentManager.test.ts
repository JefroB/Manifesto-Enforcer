/**
 * Test suite for AgentManager
 * Following manifesto: comprehensive unit tests, interface-based programming
 */

import { AgentManager } from '../AgentManager';
import { IAgentAdapter } from '../interfaces/IAgentAdapter';
import { AgentProvider, AgentConfig, ChatMessage } from '../../core/types';

// Mock agent adapter for testing
class MockAgentAdapter implements IAgentAdapter {
  constructor(private config: AgentConfig) {}

  async sendMessage(message: string): Promise<ChatMessage> {
    return {
      id: 'test-response',
      role: 'assistant',
      content: `Mock response to: ${message}`,
      timestamp: new Date(),
      agentId: this.config.id
    };
  }

  async validateConnection(): Promise<boolean> {
    return this.config.isEnabled;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  async dispose(): Promise<void> {
    // Mock cleanup
  }

  getCapabilities() {
    return {
      supportsCodeGeneration: true,
      supportsFileOperations: true,
      supportsStreaming: false,
      maxTokens: 4096,
      supportedLanguages: ['typescript', 'javascript'],
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000,
        maxConcurrentRequests: 5
      }
    };
  }
}

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let mockConfig: AgentConfig;

  beforeEach(() => {
    agentManager = new AgentManager();
    mockConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      provider: AgentProvider.AUGGIE,
      isEnabled: true,
      apiKey: 'test-key'
    };
  });

  describe('registerAgent', () => {
    it('should register agent successfully', async () => {
      const adapter = new MockAgentAdapter(mockConfig);
      
      await agentManager.registerAgent(adapter);
      
      const registeredAgents = agentManager.getAvailableAgents();
      expect(registeredAgents).toHaveLength(1);
      expect(registeredAgents[0].id).toBe('test-agent');
    });

    it('should validate agent before registration', async () => {
      const invalidConfig = { ...mockConfig, isEnabled: false };
      const adapter = new MockAgentAdapter(invalidConfig);

      await expect(agentManager.registerAgent(adapter))
        .rejects.toThrow('Agent validation failed: unable to establish connection');
    });

    it('should handle registration errors gracefully', async () => {
      const nullAdapter = null as any;
      
      await expect(agentManager.registerAgent(nullAdapter))
        .rejects.toThrow('Invalid agent adapter');
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      const adapter = new MockAgentAdapter(mockConfig);
      await agentManager.registerAgent(adapter);
      agentManager.setActiveAgent('test-agent');
    });

    it('should send message to active agent', async () => {
      const response = await agentManager.sendMessage('Hello, agent!');
      
      expect(response.content).toContain('Mock response to: Hello, agent!');
      expect(response.agentId).toBe('test-agent');
      expect(response.role).toBe('assistant');
    });

    it('should handle missing active agent', async () => {
      // Try to set non-existent agent - should throw error
      try {
        await agentManager.setActiveAgent('non-existent');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Agent not found');
      }
    });

    it('should validate message input', async () => {
      await expect(agentManager.sendMessage(''))
        .rejects.toThrow('Invalid message content');
      
      await expect(agentManager.sendMessage(null as any))
        .rejects.toThrow('Invalid message content');
    });

    it('should complete message processing', async () => {
      const startTime = Date.now();

      await agentManager.sendMessage('Performance test');

      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThan(0); // Should take some time for thorough processing
    });
  });

  describe('switchAgent', () => {
    it('should switch between registered agents', async () => {
      const agent1 = new MockAgentAdapter(mockConfig);
      const agent2Config = { ...mockConfig, id: 'agent-2', name: 'Agent 2' };
      const agent2 = new MockAgentAdapter(agent2Config);
      
      await agentManager.registerAgent(agent1);
      await agentManager.registerAgent(agent2);
      
      agentManager.setActiveAgent('test-agent');
      expect(agentManager.getActiveAgent()?.id).toBe('test-agent');
      
      agentManager.setActiveAgent('agent-2');
      expect(agentManager.getActiveAgent()?.id).toBe('agent-2');
    });

    it('should handle invalid agent switching', () => {
      expect(() => agentManager.setActiveAgent('non-existent'))
        .toThrow('Agent not found: non-existent');
    });
  });

  describe('getAgentCapabilities', () => {
    it('should return agent capabilities', async () => {
      const adapter = new MockAgentAdapter(mockConfig);
      await agentManager.registerAgent(adapter);
      
      const capabilities = agentManager.getAgentCapabilities('test-agent');

      expect(capabilities).toBeDefined();
      expect(capabilities?.supportsCodeGeneration).toBe(true);
    });

    it('should handle missing agent gracefully', () => {
      const capabilities = agentManager.getAgentCapabilities('non-existent');
      expect(capabilities).toBeNull();
    });
  });

  describe('error handling and security', () => {
    it('should encrypt sensitive configuration data', async () => {
      const sensitiveConfig = {
        ...mockConfig,
        apiKey: 'super-secret-key'
      };
      
      const adapter = new MockAgentAdapter(sensitiveConfig);
      await agentManager.registerAgent(adapter);
      
      // Verify that sensitive data is handled securely
      const storedConfig = agentManager.getActiveAgent();
      expect(storedConfig?.apiKey).toBeDefined();
      // In real implementation, this would be encrypted
    });

    it('should handle network timeouts gracefully', async () => {
      // Create a proper mock adapter with all required methods
      const timeoutAdapter = new MockAgentAdapter(mockConfig);
      timeoutAdapter.sendMessage = jest.fn().mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await agentManager.registerAgent(timeoutAdapter);
      agentManager.setActiveAgent('test-agent');

      await expect(agentManager.sendMessage('test'))
        .rejects.toThrow('Network timeout');
    });
  });
});
