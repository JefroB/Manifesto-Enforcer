import * as vscode from 'vscode';
import { LocalAgent } from '../LocalAgent';
import { AmazonQAdapter } from '../AmazonQAdapter';
import { ClineAdapter } from '../ClineAdapter';
import { AgentConfig, AgentProvider } from '../../../core/types';

// Mock vscode module
jest.mock('vscode', () => ({
    window: {
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showInformationMessage: jest.fn()
    },
    env: {
        clipboard: {
            writeText: jest.fn()
        }
    },
    extensions: {
        getExtension: jest.fn()
    },
    commands: {
        executeCommand: jest.fn()
    }
}));

describe('Agent Adapters Coverage Tests', () => {
    let mockConfig: AgentConfig;

    beforeEach(() => {
        jest.resetAllMocks();
        
        mockConfig = {
            id: 'test',
            name: 'Test Agent',
            provider: AgentProvider.LOCAL,
            isEnabled: true
        };

        // Setup default mocks
        (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
            id: 'test-extension',
            isActive: true,
            activate: jest.fn()
        });
        (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
        (vscode.env.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
    });

    describe('LocalAgent', () => {
        it('should create and initialize successfully', () => {
            try {
                const agent = new LocalAgent(mockConfig);
                expect(agent).toBeDefined();
                expect(agent.getConfig().id).toBe('test');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('LocalAgent creation failed:', error);
                throw error;
            }
        });

        it('should validate connection', async () => {
            try {
                const agent = new LocalAgent(mockConfig);
                const result = await agent.validateConnection();
                expect(result).toBe(true);
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('LocalAgent validation failed:', error);
                throw error;
            }
        });

        it('should send message successfully', async () => {
            try {
                const agent = new LocalAgent(mockConfig);
                const response = await agent.sendMessage('Hello');
                expect(response).toBeDefined();
                expect(response.content).toContain('LocalAgent Response');
                expect(response.id).toBeDefined();
                expect(response.timestamp).toBeDefined();
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('LocalAgent sendMessage failed:', error);
                throw error;
            }
        });

        it('should handle invalid message input', async () => {
            try {
                const agent = new LocalAgent(mockConfig);
                const response = await agent.sendMessage('');
                expect(response.content).toContain('LocalAgent Error');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('LocalAgent error handling failed:', error);
                throw error;
            }
        });

        it('should dispose successfully', async () => {
            try {
                const agent = new LocalAgent(mockConfig);
                await agent.dispose();
                // Should not throw
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('LocalAgent disposal failed:', error);
                throw error;
            }
        });

        it('should handle invalid config', () => {
            try {
                expect(() => new LocalAgent(null as any)).toThrow();
                expect(() => new LocalAgent({} as any)).toThrow();
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('LocalAgent config validation failed:', error);
                throw error;
            }
        });
    });

    describe('AmazonQAdapter', () => {
        beforeEach(() => {
            mockConfig.provider = AgentProvider.AMAZON_Q;
        });

        it('should create and initialize successfully', () => {
            try {
                const adapter = new AmazonQAdapter(mockConfig);
                expect(adapter).toBeDefined();
                expect(adapter.getConfig().id).toBe('test');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('AmazonQAdapter creation failed:', error);
                throw error;
            }
        });

        it('should validate connection', async () => {
            try {
                const adapter = new AmazonQAdapter(mockConfig);
                const result = await adapter.validateConnection();
                expect(typeof result).toBe('boolean');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('AmazonQAdapter validation failed:', error);
                throw error;
            }
        });

        it('should send message', async () => {
            try {
                const adapter = new AmazonQAdapter(mockConfig);
                const response = await adapter.sendMessage('Hello');
                expect(response).toBeDefined();
                expect(response.content).toBeDefined();
                expect(response.id).toBeDefined();
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('AmazonQAdapter sendMessage failed:', error);
                throw error;
            }
        });

        it('should handle invalid message', async () => {
            try {
                const adapter = new AmazonQAdapter(mockConfig);
                const response = await adapter.sendMessage('');
                expect(response.content).toContain('Error');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('AmazonQAdapter error handling failed:', error);
                throw error;
            }
        });

        it('should dispose successfully', async () => {
            try {
                const adapter = new AmazonQAdapter(mockConfig);
                await adapter.dispose();
                // Should not throw
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('AmazonQAdapter disposal failed:', error);
                throw error;
            }
        });
    });

    describe('ClineAdapter', () => {
        beforeEach(() => {
            mockConfig.provider = AgentProvider.CLINE;
        });

        it('should create and initialize successfully', () => {
            try {
                const adapter = new ClineAdapter(mockConfig);
                expect(adapter).toBeDefined();
                expect(adapter.getConfig().id).toBe('test');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('ClineAdapter creation failed:', error);
                throw error;
            }
        });

        it('should validate connection', async () => {
            try {
                const adapter = new ClineAdapter(mockConfig);
                const result = await adapter.validateConnection();
                expect(typeof result).toBe('boolean');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('ClineAdapter validation failed:', error);
                throw error;
            }
        });

        it('should send message', async () => {
            try {
                const adapter = new ClineAdapter(mockConfig);
                const response = await adapter.sendMessage('Hello');
                expect(response).toBeDefined();
                expect(response.content).toBeDefined();
                expect(response.id).toBeDefined();
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('ClineAdapter sendMessage failed:', error);
                throw error;
            }
        });

        it('should handle invalid message', async () => {
            try {
                const adapter = new ClineAdapter(mockConfig);
                const response = await adapter.sendMessage('');
                expect(response.content).toContain('Error');
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('ClineAdapter error handling failed:', error);
                throw error;
            }
        });

        it('should dispose successfully', async () => {
            try {
                const adapter = new ClineAdapter(mockConfig);
                await adapter.dispose();
                // Should not throw
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('ClineAdapter disposal failed:', error);
                throw error;
            }
        });
    });

    describe('Error Scenarios', () => {
        it('should handle extension not found', () => {
            try {
                (vscode.extensions.getExtension as jest.Mock).mockReturnValue(undefined);
                
                const amazonQ = new AmazonQAdapter({ ...mockConfig, provider: AgentProvider.AMAZON_Q });
                const cline = new ClineAdapter({ ...mockConfig, provider: AgentProvider.CLINE });
                
                expect(amazonQ).toBeDefined();
                expect(cline).toBeDefined();
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('Extension not found handling failed:', error);
                throw error;
            }
        });

        it('should handle command execution failures', async () => {
            try {
                (vscode.commands.executeCommand as jest.Mock).mockRejectedValue(new Error('Command failed'));
                
                const adapter = new AmazonQAdapter({ ...mockConfig, provider: AgentProvider.AMAZON_Q });
                const response = await adapter.sendMessage('Test');
                
                expect(response).toBeDefined();
                expect(response.content).toBeDefined();
            } catch (error) {
                // MANDATORY: Comprehensive error handling
                console.error('Command failure handling failed:', error);
                throw error;
            }
        });
    });
});
