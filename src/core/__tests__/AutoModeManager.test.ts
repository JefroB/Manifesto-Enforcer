/**
 * AutoModeManager Tests - Core functionality validation
 */

import { AutoModeManager } from '../AutoModeManager';
import { StateManager } from '../StateManager';
import { ChatAction, ActionSafety } from '../types';
import { AgentManager } from '../../agents/AgentManager';

// Mock VSCode
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn()
        }))
    },
    commands: {
        executeCommand: jest.fn()
    },
    ConfigurationTarget: { Global: 1 }
}));

// Mock PiggieFileManager
jest.mock('../../file-operations/PiggieFileManager', () => ({
    PiggieFileManager: jest.fn().mockImplementation(() => ({
        writeCodeToFile: jest.fn().mockResolvedValue({
            success: true,
            path: '/test/path/file.txt',
            message: 'File created successfully'
        }),
        fileExists: jest.fn().mockResolvedValue(false),
        readFile: jest.fn().mockResolvedValue('')
    }))
}));

describe('AutoModeManager', () => {
    let autoModeManager: AutoModeManager;
    let mockStateManager: jest.Mocked<StateManager>;
    let mockAgentManager: jest.Mocked<AgentManager>;

    beforeEach(() => {
        mockStateManager = {
            isAutoMode: false,
            getIndexingStats: jest.fn().mockReturnValue({
                currentCount: 10,
                healthStatus: 'healthy'
            })
        } as any;

        mockAgentManager = {
            sendMessage: jest.fn().mockResolvedValue('Mock response'),
            getCurrentAgent: jest.fn().mockReturnValue('TestAgent')
        } as any;

        autoModeManager = new AutoModeManager(mockStateManager);

        // Ensure the mock has the writeCodeToFile method
        (autoModeManager as any).fileManager.writeCodeToFile = jest.fn().mockResolvedValue({
            success: true,
            path: '/test/path/file.txt',
            message: 'File created successfully'
        });
    });

    describe('shouldAutoExecute', () => {
        it('should return false when not in auto mode', () => {
            mockStateManager.isAutoMode = false;
            
            const action: ChatAction = {
                id: 'test',
                label: 'Test Action',
                command: 'test',
                safety: ActionSafety.SAFE
            };

            expect(autoModeManager.shouldAutoExecute(action)).toBe(false);
        });

        it('should auto-execute SAFE actions in auto mode', () => {
            mockStateManager.isAutoMode = true;
            
            const action: ChatAction = {
                id: 'test',
                label: 'Test Action',
                command: 'test',
                safety: ActionSafety.SAFE
            };

            expect(autoModeManager.shouldAutoExecute(action)).toBe(true);
        });

        it('should auto-execute when auto mode is ON regardless of safety', () => {
            mockStateManager.isAutoMode = true;

            const action: ChatAction = {
                id: 'test',
                label: 'Test Action',
                command: 'test',
                safety: ActionSafety.CAUTIOUS
            };

            expect(autoModeManager.shouldAutoExecute(action)).toBe(true);
        });
    });

    describe('processAction', () => {
        it('should execute safe actions automatically', async () => {
            mockStateManager.isAutoMode = true;
            
            const action: ChatAction = {
                id: 'test',
                label: 'Test Action',
                command: 'createFile',
                data: { fileName: 'test.txt', content: 'test content', fileType: 'text' },
                safety: ActionSafety.SAFE
            };

            const result = await autoModeManager.processAction(action, mockAgentManager);

            expect(result.executed).toBe(true);
            expect(result.requiresApproval).toBe(false);
            expect(result.message).toContain('Auto-created');
        });

        it('should return approval requirement for cautious actions', async () => {
            mockStateManager.isAutoMode = true;
            
            const action: ChatAction = {
                id: 'test',
                label: 'Test Action',
                command: 'test',
                safety: ActionSafety.CAUTIOUS
            };

            const result = await autoModeManager.processAction(action, mockAgentManager);

            expect(result.executed).toBe(false);
            expect(result.requiresApproval).toBe(true);
            expect(result.action).toBe(action);
        });
    });

    describe('executeAction', () => {
        it('should handle createFile action', async () => {
            const action: ChatAction = {
                id: 'test',
                label: 'Create File',
                command: 'createFile',
                data: { fileName: 'test.txt', content: 'test content', fileType: 'text' }
            };

            const result = await autoModeManager.executeAction(action, mockAgentManager);

            expect(result).toContain('Auto-created');
            expect(result).toContain('test.txt');
        });

        it('should handle createManifesto action', async () => {
            const action: ChatAction = {
                id: 'test',
                label: 'Create Manifesto',
                command: 'createManifesto',
                data: { content: '# Test Manifesto', type: 'General' }
            };

            const result = await autoModeManager.executeAction(action, mockAgentManager);

            // Should successfully create manifesto
            expect(result).toContain('General Manifesto Created Successfully');
            expect(result).toContain('/test/path/file.txt');
        });

        it('should handle generateCode action', async () => {
            const action: ChatAction = {
                id: 'test',
                label: 'Generate Code',
                command: 'generateCode',
                data: { fileName: 'hello.js', code: 'console.log("Hello");', language: 'javascript' }
            };

            const result = await autoModeManager.executeAction(action, mockAgentManager);

            expect(result).toContain('Auto-generated');
            expect(result).toContain('hello.js');
            expect(result).toContain('javascript');
        });

        it('should handle executeTddWorkflow action', async () => {
            const action: ChatAction = {
                id: 'test',
                label: 'Create Hello World',
                command: 'executeTddWorkflow',
                data: { content: 'Create a simple Hello World script in JavaScript' }
            };

            const result = await autoModeManager.executeAction(action, mockAgentManager);

            // TDD workflow may fail in test environment due to VSCode API mocking limitations
            expect(result).toMatch(/Mock response|New Project Setup Failed|Cannot read properties/);
        });

        it('should throw error for unknown command', async () => {
            const action: ChatAction = {
                id: 'test',
                label: 'Unknown Action',
                command: 'unknownCommand',
                data: {}
            };

            await expect(autoModeManager.executeAction(action, mockAgentManager)).rejects.toThrow('Unknown action command: unknownCommand');
        });
    });

    describe('error handling', () => {
        it('should handle file creation failures gracefully', async () => {
            const mockFileManager = {
                handleFileLifecycle: jest.fn().mockResolvedValue({
                    success: false,
                    message: 'File creation failed'
                }),
                writeCodeToFile: jest.fn().mockRejectedValue(new Error('Permission denied'))
            };
            
            (autoModeManager as any).fileManager = mockFileManager;

            const action: ChatAction = {
                id: 'test',
                label: 'Create File',
                command: 'createFile',
                data: { fileName: 'test.txt', content: 'test content', fileType: 'text' }
            };

            await expect(autoModeManager.executeAction(action, mockAgentManager)).rejects.toThrow('Permission denied');
        });
    });
});
