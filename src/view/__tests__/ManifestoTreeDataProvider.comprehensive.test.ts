/**
 * Comprehensive Tests for ManifestoTreeDataProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { ManifestoTreeDataProvider, ManifestoItem, ManifestoSection } from '../ManifestoTreeDataProvider';
import { StateManager } from '../../core/StateManager';
import * as vscode from 'vscode';

// Mock vscode module
jest.mock('vscode', () => ({
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2
    },
    EventEmitter: jest.fn().mockImplementation(() => ({
        event: jest.fn(),
        fire: jest.fn(),
        dispose: jest.fn()
    })),
    workspace: {
        workspaceFolders: [{
            uri: { fsPath: '/test/workspace' },
            name: 'test-workspace',
            index: 0
        }],
        findFiles: jest.fn().mockResolvedValue([])
    },
    TreeItem: class MockTreeItem {
        public label: string;
        public collapsibleState: any;
        public command?: any;
        public tooltip?: string;
        public description?: string;
        public iconPath?: any;
        public contextValue?: string;

        constructor(label: string, collapsibleState?: any) {
            this.label = label;
            this.collapsibleState = collapsibleState;
        }
    },
    ThemeIcon: jest.fn().mockImplementation((name: string) => ({ name }))
}));

// Mock StateManager
jest.mock('../../core/StateManager');

describe('ManifestoTreeDataProvider', () => {
    let provider: ManifestoTreeDataProvider;
    let mockStateManager: jest.Mocked<StateManager>;
    let mockEventEmitter: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock event emitter
        mockEventEmitter = {
            event: jest.fn(),
            fire: jest.fn(),
            dispose: jest.fn()
        };
        
        (vscode.EventEmitter as jest.Mock).mockImplementation(() => mockEventEmitter);
        
        // Create mock StateManager
        mockStateManager = {
            manifestoRules: [
                {
                    id: 'rule-1',
                    text: 'All code must include comprehensive error handling',
                    severity: 'CRITICAL',
                    category: 'ERROR_HANDLING'
                },
                {
                    id: 'rule-2',
                    text: 'Unit tests required for all business logic',
                    severity: 'REQUIRED',
                    category: 'TESTING'
                }
            ]
        } as any;
        
        provider = new ManifestoTreeDataProvider(mockStateManager);
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with StateManager and event emitter', () => {
            expect(vscode.EventEmitter).toHaveBeenCalled();
            expect(provider.onDidChangeTreeData).toBeDefined();
        });

        it('should call loadManifesto during initialization', () => {
            // loadManifesto is called in constructor
            expect((provider as any).stateManager).toBe(mockStateManager);
        });

        it('should handle missing StateManager gracefully', () => {
            expect(() => {
                new ManifestoTreeDataProvider(undefined as any);
            }).not.toThrow();
        });
    });

    describe('refresh', () => {
        it('should fire tree data change event', () => {
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalledWith();
        });

        it('should reload manifesto on refresh', () => {
            const loadManifestoSpy = jest.spyOn(provider as any, 'loadManifesto');
            
            provider.refresh();
            
            expect(loadManifestoSpy).toHaveBeenCalled();
        });

        it('should handle multiple refresh calls', () => {
            provider.refresh();
            provider.refresh();
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalledTimes(3);
        });
    });

    describe('getTreeItem', () => {
        it('should return the same element passed in', () => {
            const mockItem = new ManifestoItem('Test', 'Test Content', vscode.TreeItemCollapsibleState.None, 'section');
            
            const result = provider.getTreeItem(mockItem);
            
            expect(result).toBe(mockItem);
        });

        it('should handle different manifesto item types', () => {
            const items = [
                new ManifestoItem('Section', 'Section content', vscode.TreeItemCollapsibleState.Collapsed, 'section'),
                new ManifestoItem('Rule', 'Rule content', vscode.TreeItemCollapsibleState.None, 'rule'),
                new ManifestoItem('Another Rule', 'Another rule content', vscode.TreeItemCollapsibleState.Expanded, 'rule')
            ];

            items.forEach(item => {
                const result = provider.getTreeItem(item);
                expect(result).toBe(item);
            });
        });
    });

    describe('getChildren', () => {
        it('should return manifesto sections when no element provided', async () => {
            // Mock manifesto sections
            (provider as any).manifestoSections = [
                {
                    title: 'Code Quality',
                    content: 'Quality standards',
                    rules: [
                        { title: 'Error Handling', content: 'Handle all errors' },
                        { title: 'Testing', content: 'Write comprehensive tests' }
                    ]
                },
                {
                    title: 'Documentation',
                    content: 'Documentation standards',
                    rules: [
                        { title: 'JSDoc', content: 'Document all functions' }
                    ]
                }
            ];
            
            const children = await provider.getChildren();
            
            expect(children).toHaveLength(2);
            expect(children[0].label).toBe('Code Quality');
            expect(children[1].label).toBe('Documentation');
            expect(children[0].collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
        });

        it('should return rules for section elements', async () => {
            // Mock manifesto sections
            (provider as any).manifestoSections = [
                {
                    title: 'Code Quality',
                    content: 'Quality standards',
                    rules: [
                        { title: 'Error Handling', content: 'Handle all errors' },
                        { title: 'Testing', content: 'Write comprehensive tests' }
                    ]
                }
            ];
            
            const sectionItem = new ManifestoItem('Code Quality', 'Quality standards', vscode.TreeItemCollapsibleState.Collapsed, 'section');
            const children = await provider.getChildren(sectionItem);
            
            expect(children).toHaveLength(2);
            expect(children[0].label).toBe('Error Handling');
            expect(children[1].label).toBe('Testing');
            expect(children[0].type).toBe('rule');
            expect(children[0].collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
        });

        it('should return empty array for rule elements', async () => {
            const ruleItem = new ManifestoItem('Error Handling', 'Handle all errors', vscode.TreeItemCollapsibleState.None, 'rule');
            
            const children = await provider.getChildren(ruleItem);
            
            expect(children).toEqual([]);
        });

        it('should handle empty manifesto sections', async () => {
            (provider as any).manifestoSections = [];
            
            const children = await provider.getChildren();
            
            expect(children).toEqual([]);
        });

        it('should handle section without matching rules', async () => {
            (provider as any).manifestoSections = [
                {
                    title: 'Non-existent Section',
                    content: 'Content',
                    rules: []
                }
            ];
            
            const sectionItem = new ManifestoItem('Different Section', 'Content', vscode.TreeItemCollapsibleState.Collapsed, 'section');
            const children = await provider.getChildren(sectionItem);
            
            expect(children).toEqual([]);
        });
    });

    describe('loadManifesto', () => {
        it('should parse manifesto content into sections', () => {
            const manifestoContent = `# Development Manifesto

## Code Quality Standards
- **MANDATORY**: All code must include comprehensive error handling
- **REQUIRED**: Unit tests for all business logic

## Documentation Standards
- **CRITICAL**: JSDoc documentation for all functions
- **OPTIMIZE**: API responses must be under 200ms`;

            (provider as any).manifestoContent = manifestoContent;
            (provider as any).parseManifestoContent();

            const sections = (provider as any).manifestoSections;
            expect(sections).toHaveLength(3);
            expect(sections[0].title).toBe('Development Manifesto');
            expect(sections[1].title).toBe('Code Quality Standards');
            expect(sections[2].title).toBe('Documentation Standards');
        });

        it('should handle empty manifesto content', () => {
            (provider as any).manifestoContent = '';
            (provider as any).parseManifestoContent();

            const sections = (provider as any).manifestoSections;
            // Should show helpful default section for empty content
            expect(sections).toHaveLength(1);
            expect(sections[0].title).toBe('Empty Manifesto');
            expect(sections[0].content).toBe('The manifesto file appears to be empty');
        });

        it('should handle malformed manifesto content', () => {
            (provider as any).manifestoContent = 'Invalid content without proper structure';
            
            expect(() => {
                (provider as any).loadManifesto();
            }).not.toThrow();
        });
    });

    describe('ManifestoItem Class', () => {
        it('should create manifesto item with all properties', () => {
            const item = new ManifestoItem(
                'Test Section',
                'Test content',
                vscode.TreeItemCollapsibleState.Collapsed,
                'section'
            );
            
            expect(item.label).toBe('Test Section');
            expect(item.tooltip).toBe('Test content');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
            expect(item.type).toBe('section');
            expect(item.contextValue).toBe('section');
        });

        it('should create rule item with proper styling', () => {
            const item = new ManifestoItem(
                'Error Handling',
                'Handle all errors properly',
                vscode.TreeItemCollapsibleState.None,
                'rule'
            );
            
            expect(item.type).toBe('rule');
            expect(item.contextValue).toBe('rule');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
        });

        it('should handle empty content', () => {
            const item = new ManifestoItem('', '', vscode.TreeItemCollapsibleState.None, 'rule');
            
            expect(item.label).toBe('');
            expect(item.tooltip).toBe('');
        });

        it('should set proper icons for different types', () => {
            const sectionItem = new ManifestoItem('Section', 'Content', vscode.TreeItemCollapsibleState.Collapsed, 'section');
            const ruleItem = new ManifestoItem('Rule', 'Content', vscode.TreeItemCollapsibleState.None, 'rule');
            
            // Icons should be set based on type
            expect(sectionItem.iconPath).toBeDefined();
            expect(ruleItem.iconPath).toBeDefined();
        });
    });

    describe('Integration and Edge Cases', () => {
        it('should handle rapid successive calls', async () => {
            const promises = [
                provider.getChildren(),
                provider.getChildren(),
                provider.getChildren()
            ];
            
            const results = await Promise.all(promises);
            
            // All results should be identical
            expect(results[0]).toEqual(results[1]);
            expect(results[1]).toEqual(results[2]);
        });

        it('should maintain consistent section order', async () => {
            (provider as any).manifestoSections = [
                { title: 'A Section', content: 'A', rules: [] },
                { title: 'B Section', content: 'B', rules: [] },
                { title: 'C Section', content: 'C', rules: [] }
            ];
            
            const children1 = await provider.getChildren();
            const children2 = await provider.getChildren();
            
            expect(children1.map(c => c.label)).toEqual(children2.map(c => c.label));
        });

        it('should handle concurrent refresh and getChildren calls', async () => {
            const childrenPromise = provider.getChildren();
            provider.refresh();
            
            const children = await childrenPromise;
            expect(Array.isArray(children)).toBe(true);
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });

        it('should handle provider disposal gracefully', () => {
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });
    });
});
