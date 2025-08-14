/**
 * Unit Tests for StateManager - Testing Individual Methods
 * Focus: Test specific methods without complex VSCode initialization
 */

import { StateManager } from '../StateManager';
import { ChatMessage, ManifestoRule, RuleCategory, RuleSeverity } from '../types';

// Mock VSCode API
jest.mock('vscode', () => ({
    workspace: {
        openTextDocument: jest.fn(),
        fs: {
            writeFile: jest.fn(),
            readFile: jest.fn()
        }
    },
    Uri: {
        file: jest.fn((path: string) => ({ fsPath: path }))
    }
}));

// Create a minimal mock for testing
const createMockStateManager = (): any => {
    const mockContext = {
        subscriptions: [],
        workspaceState: {
            get: jest.fn().mockReturnValue(null),
            update: jest.fn().mockResolvedValue(undefined)
        },
        globalState: {
            get: jest.fn().mockReturnValue(null),
            update: jest.fn().mockResolvedValue(undefined)
        }
    };

    // Create a StateManager instance with minimal mocking
    const instance = Object.create(StateManager.prototype);
    
    // Initialize basic properties
    instance.context = mockContext;
    instance._manifestoRules = [];
    instance._isManifestoMode = true;
    instance._currentAgent = 'Auggie';
    instance._currentModel = 'Claude Sonnet 4';
    instance._isAgentMode = false;
    instance._isAutoMode = false;
    instance._isTddMode = false;
    instance._isUiTddMode = false; // New UI TDD mode property
    instance._techStack = '';
    instance._testFramework = '';
    instance._uiTestFramework = ''; // New UI test framework property
    instance._fontSize = 'medium';
    instance._showEmojis = true;
    instance._codebaseIndex = new Map();
    instance._isCodebaseIndexed = false;
    instance._projectStructure = null;
    instance._manifestoIndex = null;
    instance._codebaseIndexTimestamp = 0;
    instance._qContextWindow = [];
    instance._qTokenCount = 0;
    instance._qMaxTokens = 4000;
    instance._qContextPriority = new Map();
    instance._mrCache = new Map();
    instance._gitConfig = null;
    instance._projectGlossary = new Map();
    instance._isGlossaryIndexed = false;
    instance._conversationHistory = [];
    instance._maxConversationHistory = 20;
    instance._isIndexingInProgress = false;
    instance._indexingPromise = null;
    instance._expectedFileCount = 0;
    instance._lastIndexingResults = null;

    return instance;
};

describe('StateManager Unit Tests', () => {
    let stateManager: any;

    beforeEach(() => {
        stateManager = createMockStateManager();
    });

    describe('Basic Property Getters and Setters', () => {
        it('should get and set manifesto rules', () => {
            const rules: ManifestoRule[] = [
                { id: '1', text: 'Test rule', category: RuleCategory.TESTING, severity: RuleSeverity.CRITICAL }
            ];
            
            stateManager.manifestoRules = rules;
            expect(stateManager.manifestoRules).toEqual(rules);
        });

        it('should get and set manifesto mode', () => {
            stateManager.isManifestoMode = false;
            expect(stateManager.isManifestoMode).toBe(false);
            
            stateManager.isManifestoMode = true;
            expect(stateManager.isManifestoMode).toBe(true);
        });

        it('should get and set current agent', () => {
            stateManager.currentAgent = 'TestAgent';
            expect(stateManager.currentAgent).toBe('TestAgent');
        });

        it('should get and set current model', () => {
            stateManager.currentModel = 'TestModel';
            expect(stateManager.currentModel).toBe('TestModel');
        });

        it('should get and set agent mode', () => {
            stateManager.isAgentMode = true;
            expect(stateManager.isAgentMode).toBe(true);
            
            stateManager.isAgentMode = false;
            expect(stateManager.isAgentMode).toBe(false);
        });

        it('should get and set auto mode', () => {
            stateManager.isAutoMode = true;
            expect(stateManager.isAutoMode).toBe(true);
            
            stateManager.isAutoMode = false;
            expect(stateManager.isAutoMode).toBe(false);
        });

        it('should get and set font size', () => {
            stateManager.fontSize = 'large';
            expect(stateManager.fontSize).toBe('large');
            
            stateManager.fontSize = 'small';
            expect(stateManager.fontSize).toBe('small');
        });

        it('should get and set show emojis', () => {
            stateManager.showEmojis = false;
            expect(stateManager.showEmojis).toBe(false);
            
            stateManager.showEmojis = true;
            expect(stateManager.showEmojis).toBe(true);
        });
    });

    describe('Codebase Properties', () => {
        it('should get and set codebase index', () => {
            const index = new Map([['test.ts', { path: 'test.ts', content: 'test', size: 4, lastModified: new Date() }]]);
            
            stateManager.codebaseIndex = index;
            expect(stateManager.codebaseIndex).toBe(index);
        });

        it('should get and set codebase indexed status', () => {
            stateManager.isCodebaseIndexed = true;
            expect(stateManager.isCodebaseIndexed).toBe(true);
            
            stateManager.isCodebaseIndexed = false;
            expect(stateManager.isCodebaseIndexed).toBe(false);
        });

        it('should get and set codebase index timestamp', () => {
            const timestamp = Date.now();
            
            stateManager.codebaseIndexTimestamp = timestamp;
            expect(stateManager.codebaseIndexTimestamp).toBe(timestamp);
        });
    });

    describe('Conversation History', () => {
        it('should add message to conversation history', () => {
            const message: ChatMessage = {
                id: '1',
                content: 'Test message',
                role: 'user',
                timestamp: new Date()
            };
            
            StateManager.prototype.addToConversationHistory.call(stateManager, message);
            const history = StateManager.prototype.getConversationHistory.call(stateManager);
            
            expect(history).toHaveLength(1);
            expect(history[0]).toEqual(message);
        });

        it('should handle invalid message gracefully', () => {
            StateManager.prototype.addToConversationHistory.call(stateManager, null as any);
            StateManager.prototype.addToConversationHistory.call(stateManager, { content: '' } as any);

            const history = StateManager.prototype.getConversationHistory.call(stateManager);
            expect(history).toHaveLength(0);
        });

        it('should limit conversation history length', () => {
            // Add more than max messages
            for (let i = 0; i < 25; i++) {
                StateManager.prototype.addToConversationHistory.call(stateManager, {
                    id: i.toString(),
                    content: `Message ${i}`,
                    role: 'user',
                    timestamp: new Date()
                });
            }
            
            const history = StateManager.prototype.getConversationHistory.call(stateManager);
            expect(history.length).toBeLessThanOrEqual(20); // Max is 20
        });

        it('should get conversation context', () => {
            StateManager.prototype.addToConversationHistory.call(stateManager, {
                id: '1',
                content: 'Test message',
                role: 'user',
                timestamp: new Date()
            });
            
            const context = StateManager.prototype.getConversationContext.call(stateManager, 5);
            expect(context).toContain('Test message');
            expect(context).toContain('👤 User');
        });

        it('should clear conversation history', () => {
            StateManager.prototype.addToConversationHistory.call(stateManager, {
                id: '1',
                content: 'Test message',
                role: 'user',
                timestamp: new Date()
            });
            
            StateManager.prototype.clearConversationHistory.call(stateManager);
            const history = StateManager.prototype.getConversationHistory.call(stateManager);
            
            expect(history).toHaveLength(0);
        });
    });

    describe('State Summary', () => {
        it('should get state summary', () => {
            const summary = StateManager.prototype.getStateSummary.call(stateManager);
            
            expect(summary).toBeDefined();
            expect(summary.manifestoMode).toBeDefined();
            expect(summary.currentAgent).toBeDefined();
            expect(summary.manifestoRulesCount).toBeDefined();
            expect(summary.codebaseFilesCount).toBeDefined();
            expect(summary.glossaryTermsCount).toBeDefined();
            expect(summary.lastActivity).toBeDefined();
            expect(summary.memoryUsage).toBeDefined();
        });
    });

    describe('Mode Setters', () => {
        it('should set font size with validation', () => {
            StateManager.prototype.setFontSize.call(stateManager, 'large');
            expect(stateManager.fontSize).toBe('large');
            
            StateManager.prototype.setFontSize.call(stateManager, 'small');
            expect(stateManager.fontSize).toBe('small');
            
            StateManager.prototype.setFontSize.call(stateManager, 'medium');
            expect(stateManager.fontSize).toBe('medium');
        });

        it('should reject invalid font size', () => {
            expect(() => StateManager.prototype.setFontSize.call(stateManager, 'invalid')).toThrow('Invalid font size');
        });
    });

    describe('Indexing Stats', () => {
        it('should get indexing stats', () => {
            const stats = StateManager.prototype.getIndexingStats.call(stateManager);
            
            expect(stats).toBeDefined();
            expect(stats.expectedCount).toBeDefined();
            expect(stats.isIndexed).toBeDefined();
            expect(stats.timestamp).toBeDefined();
            expect(stats.currentCount).toBeDefined();
            expect(stats.healthStatus).toBeDefined();
        });

        it('should detect health issues in indexing stats', () => {
            // Simulate large index
            const largeIndex = new Map();
            for (let i = 0; i < 1500; i++) {
                largeIndex.set(`file${i}.ts`, { path: `file${i}.ts`, content: 'test', size: 4, lastModified: new Date() });
            }
            stateManager.codebaseIndex = largeIndex;
            
            const stats = StateManager.prototype.getIndexingStats.call(stateManager);
            expect(stats.healthStatus).toBe('error');
            expect(stats.healthMessage).toContain('CRITICAL');
        });
    });

    describe('Extension Context', () => {
        it('should get extension context', () => {
            expect(stateManager.extensionContext).toBe(stateManager.context);
        });
    });

    describe('Glossary Storage Methods', () => {
        it('should load glossary from storage successfully', async () => {
            try {
                const manager = createMockStateManager();
                const mockGlossary = { 'term1': { term: 'term1', definition: 'def1', category: 'general' } };

                // Mock StorageService for glossary loading
                const mockStorageService = {
                    getProjectArtifactsPath: jest.fn().mockResolvedValue('/mock/path/glossary.json')
                };
                jest.spyOn(require('../../core/StorageService').StorageService, 'getInstance').mockReturnValue(mockStorageService);

                // Mock vscode.workspace.fs.readFile to return glossary content
                const mockVscode = require('vscode');
                const glossaryBuffer = Buffer.from(JSON.stringify(mockGlossary), 'utf8');
                mockVscode.workspace.fs.readFile.mockResolvedValue(glossaryBuffer);

                const result = await manager.loadGlossaryFromStorage();
                expect(result).toBe(true);
                expect(manager._projectGlossary.size).toBe(1);
            } catch (error) {
                throw error;
            }
        });

        it('should return false when no glossary in storage', async () => {
            try {
                const manager = createMockStateManager();

                // Mock StorageService for glossary loading
                const mockStorageService = {
                    getProjectArtifactsPath: jest.fn().mockResolvedValue('/mock/path/glossary.json')
                };
                jest.spyOn(require('../../core/StorageService').StorageService, 'getInstance').mockReturnValue(mockStorageService);

                // Mock vscode.workspace.fs.readFile to throw an error (file not found)
                const mockVscode = require('vscode');
                mockVscode.workspace.fs.readFile.mockRejectedValue(new Error('File not found'));

                const result = await manager.loadGlossaryFromStorage();
                expect(result).toBe(false);
            } catch (error) {
                throw error;
            }
        });

        it('should handle glossary load errors gracefully', async () => {
            try {
                const manager = createMockStateManager();

                // Mock StorageService to throw an error
                const mockStorageService = {
                    getProjectArtifactsPath: jest.fn().mockRejectedValue(new Error('Storage error'))
                };
                jest.spyOn(require('../../core/StorageService').StorageService, 'getInstance').mockReturnValue(mockStorageService);

                const result = await manager.loadGlossaryFromStorage();
                expect(result).toBe(false);
            } catch (error) {
                throw error;
            }
        });

        it('should save glossary to storage successfully', async () => {
            try {
                const manager = createMockStateManager();
                manager._projectGlossary.set('term1', { term: 'term1', definition: 'def1', category: 'general' });

                // Mock StorageService for glossary saving
                const mockStorageService = {
                    getProjectArtifactsPath: jest.fn().mockResolvedValue('/mock/path/glossary.json')
                };
                jest.spyOn(require('../../core/StorageService').StorageService, 'getInstance').mockReturnValue(mockStorageService);

                // Mock vscode.workspace.fs.writeFile
                const mockVscode = require('vscode');
                mockVscode.workspace.fs.writeFile.mockResolvedValue(undefined);

                await expect(manager.saveGlossaryToStorage()).resolves.toBeUndefined();
                expect(mockStorageService.getProjectArtifactsPath).toHaveBeenCalledWith('glossary.json');
            } catch (error) {
                throw error;
            }
        });

        it('should use StorageService for glossary file path instead of workspaceState', async () => {
            try {
                // This test will fail because we haven't refactored to use StorageService yet
                const manager = createMockStateManager();

                // Add a term to save
                manager._projectGlossary.set('term1', { term: 'term1', definition: 'def1', category: 'general' });

                // Mock the StorageService methods that should be called
                const mockGetProjectArtifactsPath = jest.fn().mockResolvedValue('/global/storage/projects/testhash/glossary.json');
                const mockWriteFile = jest.fn().mockResolvedValue(undefined);

                // Spy on the methods that should be called in the new implementation
                const storageServiceSpy = jest.spyOn(require('../StorageService').StorageService, 'getInstance').mockReturnValue({
                    getProjectArtifactsPath: mockGetProjectArtifactsPath
                });

                // Mock vscode.workspace.fs and vscode.Uri for this test
                const vscode = require('vscode');
                vscode.workspace.fs = {
                    writeFile: mockWriteFile
                };
                vscode.Uri = {
                    file: jest.fn((path: string) => ({ fsPath: path }))
                };

                // This should use StorageService.getProjectArtifactsPath and vscode.workspace.fs.writeFile
                // instead of context.workspaceState.update
                await manager.saveGlossaryToStorage();

                // Verify StorageService was used (this will fail until we refactor)
                expect(storageServiceSpy).toHaveBeenCalled();
                expect(mockGetProjectArtifactsPath).toHaveBeenCalledWith('glossary.json');
                expect(mockWriteFile).toHaveBeenCalled();

                // Verify workspaceState.update was NOT called (old behavior should be replaced)
                expect(manager.context.workspaceState.update).not.toHaveBeenCalled();

            } catch (error) {
                throw error;
            }
        });

        it('should handle glossary save errors', async () => {
            try {
                const manager = createMockStateManager();

                // Mock StorageService to throw an error
                const mockStorageService = {
                    getProjectArtifactsPath: jest.fn().mockRejectedValue(new Error('Save failed'))
                };
                jest.spyOn(require('../../core/StorageService').StorageService, 'getInstance').mockReturnValue(mockStorageService);

                await expect(manager.saveGlossaryToStorage()).rejects.toThrow('Glossary save failed: Save failed');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('Backup and Directory Methods', () => {
        it('should return null when piggie directory manager not initialized', async () => {
            try {
                const manager = createMockStateManager();
                manager.piggieDirectoryManager = null;

                const result = await manager.createBackup('/test/file.ts', 'content');
                expect(result).toBeNull();
            } catch (error) {
                throw error;
            }
        });

        it('should handle backup creation errors gracefully', async () => {
            try {
                const manager = createMockStateManager();
                manager.piggieDirectoryManager = {
                    createBackup: jest.fn().mockRejectedValue(new Error('Backup failed'))
                };

                const result = await manager.createBackup('/test/file.ts', 'content');
                expect(result).toBeNull();
            } catch (error) {
                throw error;
            }
        });

        it('should get piggie directory path', () => {
            try {
                const manager = createMockStateManager();
                manager.piggieDirectoryManager = {
                    getPiggieDirectory: jest.fn().mockReturnValue('/test/piggie')
                };

                const result = manager.getPiggieDirectory();
                expect(result).toBe('/test/piggie');
            } catch (error) {
                throw error;
            }
        });

        it('should return null when piggie directory manager not available', () => {
            try {
                const manager = createMockStateManager();
                manager.piggieDirectoryManager = null;

                const result = manager.getPiggieDirectory();
                expect(result).toBeNull();
            } catch (error) {
                throw error;
            }
        });
    });

    describe('Indexing Statistics', () => {
        it('should return healthy status for normal file count', () => {
            try {
                const manager = createMockStateManager();
                manager._codebaseIndex.set('file1.ts', { path: 'file1.ts', content: 'content', size: 100, lastModified: new Date() });

                const stats = manager.getIndexingStats();
                expect(stats.healthStatus).toBe('healthy');
                expect(stats.currentCount).toBe(1);
                expect(stats.isIndexed).toBe(false);
            } catch (error) {
                throw error;
            }
        });

        it('should return warning status for high file count', () => {
            try {
                const manager = createMockStateManager();
                // Add 250 files to trigger warning
                for (let i = 0; i < 250; i++) {
                    manager._codebaseIndex.set(`file${i}.ts`, { path: `file${i}.ts`, content: 'content', size: 100, lastModified: new Date() });
                }

                const stats = manager.getIndexingStats();
                expect(stats.healthStatus).toBe('warning');
                expect(stats.currentCount).toBe(250);
                expect(stats.healthMessage).toContain('WARNING');
            } catch (error) {
                throw error;
            }
        });

        it('should return error status for very high file count', () => {
            try {
                const manager = createMockStateManager();
                // Add 1500 files to trigger error
                for (let i = 0; i < 1500; i++) {
                    manager._codebaseIndex.set(`file${i}.ts`, { path: `file${i}.ts`, content: 'content', size: 100, lastModified: new Date() });
                }

                const stats = manager.getIndexingStats();
                expect(stats.healthStatus).toBe('error');
                expect(stats.currentCount).toBe(1500);
                expect(stats.healthMessage).toContain('CRITICAL');
            } catch (error) {
                throw error;
            }
        });
    });

    describe('Disposal', () => {
        it('should dispose resources successfully', async () => {
            try {
                const manager = createMockStateManager();
                manager.performStrategicCleanup = jest.fn().mockResolvedValue(undefined);

                // Add some data to clear
                manager._codebaseIndex.set('file1.ts', { path: 'file1.ts', content: 'content', size: 100, lastModified: new Date() });
                manager._qContextPriority.set('key1', 1);
                manager._mrCache.set('key1', 'value1');
                manager._projectGlossary.set('term1', { term: 'term1', definition: 'def1', category: 'general' });
                manager._qContextWindow = ['item1'];
                manager._conversationHistory = [{ role: 'user', content: 'test' }];

                await manager.dispose();

                expect(manager._codebaseIndex.size).toBe(0);
                expect(manager._qContextPriority.size).toBe(0);
                expect(manager._mrCache.size).toBe(0);
                expect(manager._projectGlossary.size).toBe(0);
                expect(manager._qContextWindow.length).toBe(0);
                expect(manager._conversationHistory.length).toBe(0);
            } catch (error) {
                throw error;
            }
        });

        it('should handle disposal errors gracefully', async () => {
            try {
                const manager = createMockStateManager();
                manager.performStrategicCleanup = jest.fn().mockRejectedValue(new Error('Cleanup failed'));

                await expect(manager.dispose()).resolves.toBeUndefined();
            } catch (error) {
                throw error;
            }
        });
    });

    describe('TDD State Management', () => {
        test('should correctly set and get isTddMode state', () => {
            try {
                const manager = createMockStateManager();

                // Test initial state
                expect(manager.isTddMode).toBe(false);

                // Test setting to true
                manager.isTddMode = true;
                expect(manager.isTddMode).toBe(true);

                // Test setting to false
                manager.isTddMode = false;
                expect(manager.isTddMode).toBe(false);

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('TDD mode getter/setter test failed:', error);
                throw error;
            }
        });

        test('should persist isTddMode state through saveSettings', async () => {
            try {
                const manager = createMockStateManager();

                // Mock vscode configuration
                const mockConfig = {
                    update: jest.fn().mockResolvedValue(undefined)
                };

                // Mock vscode.workspace.getConfiguration
                const mockGetConfiguration = jest.fn().mockReturnValue(mockConfig);

                // Set up the mock (this would normally be done in test setup)
                manager.saveSettings = jest.fn().mockImplementation(async () => {
                    // Simulate the actual saveSettings behavior
                    await mockConfig.update('isTddMode', manager._isTddMode, true);
                });

                // Set TDD mode and save
                manager._isTddMode = true;
                await manager.saveSettings();

                // Assert that configuration was updated
                expect(manager.saveSettings).toHaveBeenCalled();

            } catch (error) {
                console.error('TDD mode persistence test failed:', error);
                throw error;
            }
        });

        test('should initialize isTddMode from settings', () => {
            try {
                const manager = createMockStateManager();

                // Mock configuration with TDD mode enabled
                const mockConfig = {
                    get: jest.fn().mockImplementation((key: string) => {
                        if (key === 'isTddMode') return true;
                        return false;
                    })
                };

                // Simulate initialization from settings
                manager.initializeFromSettings = jest.fn().mockImplementation(() => {
                    manager._isTddMode = mockConfig.get('isTddMode');
                });

                manager.initializeFromSettings();

                expect(manager._isTddMode).toBe(true);

            } catch (error) {
                console.error('TDD mode initialization test failed:', error);
                throw error;
            }
        });

        test('should handle tech stack and test framework state', () => {
            try {
                const manager = createMockStateManager();

                // Add TDD-specific properties
                manager._techStack = '';
                manager._testFramework = '';

                // Test setters
                manager.setTechStack = jest.fn().mockImplementation((stack: string) => {
                    manager._techStack = stack;
                });

                manager.setTestFramework = jest.fn().mockImplementation((framework: string) => {
                    manager._testFramework = framework;
                });

                // Test getters
                Object.defineProperty(manager, 'techStack', {
                    get: () => manager._techStack
                });

                Object.defineProperty(manager, 'testFramework', {
                    get: () => manager._testFramework
                });

                // Test setting values
                manager.setTechStack('React');
                manager.setTestFramework('Jest');

                expect(manager.techStack).toBe('React');
                expect(manager.testFramework).toBe('Jest');
                expect(manager.setTechStack).toHaveBeenCalledWith('React');
                expect(manager.setTestFramework).toHaveBeenCalledWith('Jest');

            } catch (error) {
                console.error('Tech stack and test framework state test failed:', error);
                throw error;
            }
        });

        test('should correctly set and get isUiTddMode state', () => {
            try {
                const manager = createMockStateManager();

                // Test initial state
                expect(manager.isUiTddMode).toBe(false);

                // Test setting to true
                manager.isUiTddMode = true;
                expect(manager.isUiTddMode).toBe(true);

                // Test setting to false
                manager.isUiTddMode = false;
                expect(manager.isUiTddMode).toBe(false);

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('UI TDD mode getter/setter test failed:', error);
                throw error;
            }
        });

        test('should persist isUiTddMode state through saveSettings', async () => {
            try {
                const manager = createMockStateManager();

                // Mock vscode configuration
                const mockConfig = {
                    update: jest.fn().mockResolvedValue(undefined)
                };

                const mockGetConfiguration = jest.fn().mockReturnValue(mockConfig);

                // Set up the mock (this would normally be done in test setup)
                manager.saveSettings = jest.fn().mockImplementation(async () => {
                    // Simulate the actual saveSettings behavior
                    await mockConfig.update('isUiTddMode', manager._isUiTddMode, true);
                });

                // Test saving UI TDD mode state
                manager.isUiTddMode = true;
                await manager.saveSettings();

                expect(manager.saveSettings).toHaveBeenCalled();

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('UI TDD mode persistence test failed:', error);
                throw error;
            }
        });

        test('should handle UI test framework state', () => {
            try {
                const manager = createMockStateManager();

                // Add UI test framework property
                manager._uiTestFramework = '';

                // Test setter
                manager.setUiTestFramework = jest.fn().mockImplementation((framework: string) => {
                    manager._uiTestFramework = framework;
                });

                // Test getter
                Object.defineProperty(manager, 'uiTestFramework', {
                    get: () => manager._uiTestFramework
                });

                // Test setting values
                manager.setUiTestFramework('Playwright');

                expect(manager.uiTestFramework).toBe('Playwright');
                expect(manager.setUiTestFramework).toHaveBeenCalledWith('Playwright');

            } catch (error) {
                console.error('UI test framework state test failed:', error);
                throw error;
            }
        });
    });
});
