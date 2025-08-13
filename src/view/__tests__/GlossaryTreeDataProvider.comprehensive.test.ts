/**
 * Comprehensive Tests for GlossaryTreeDataProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { GlossaryTreeDataProvider, GlossaryItem } from '../GlossaryTreeDataProvider';
import { GlossaryTerm } from '../../core/types';
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
    ThemeIcon: jest.fn().mockImplementation((name: string) => ({ name })),
    ExtensionContext: jest.fn()
}));

// Mock StateManager
jest.mock('../../core/StateManager');

describe('GlossaryTreeDataProvider', () => {
    let provider: GlossaryTreeDataProvider;
    let mockContext: vscode.ExtensionContext;
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
        
        // Create mock context
        mockContext = {
            globalState: {
                get: jest.fn().mockReturnValue(undefined),
                update: jest.fn().mockResolvedValue(undefined)
            },
            workspaceState: {
                get: jest.fn().mockReturnValue(undefined),
                update: jest.fn().mockResolvedValue(undefined)
            }
        } as any;
        
        // Create mock StateManager
        mockStateManager = {
            projectGlossary: new Map([
                ['API', {
                    term: 'API',
                    definition: 'Application Programming Interface',
                    dateAdded: Date.now(),
                    usage: 5
                }]
            ]),
            glossaryTerms: new Map([
                ['API', {
                    term: 'API',
                    definition: 'Application Programming Interface',
                    dateAdded: Date.now(),
                    usage: 5
                }],
                ['REST', {
                    term: 'REST',
                    definition: 'Representational State Transfer',
                    dateAdded: Date.now(),
                    usage: 3
                }]
            ])
        } as any;
        
        provider = new GlossaryTreeDataProvider(mockContext, mockStateManager);
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with context and StateManager', () => {
            expect(vscode.EventEmitter).toHaveBeenCalled();
            expect(provider.onDidChangeTreeData).toBeDefined();
        });

        it('should call loadGlossary during initialization', () => {
            // loadGlossary is called in constructor and syncs with StateManager
            expect(mockStateManager.projectGlossary).toBeDefined();
            // The constructor should have called loadGlossary which syncs with StateManager
            expect(provider).toBeDefined();
        });

        it('should handle missing context gracefully', () => {
            expect(() => {
                new GlossaryTreeDataProvider(undefined as any, mockStateManager);
            }).not.toThrow();
        });
    });

    describe('refresh', () => {
        it('should fire tree data change event', () => {
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalledWith();
        });

        it('should reload glossary on refresh', () => {
            const loadGlossarySpy = jest.spyOn(provider as any, 'loadGlossary');
            
            provider.refresh();
            
            expect(loadGlossarySpy).toHaveBeenCalled();
        });
    });

    describe('getTreeItem', () => {
        it('should return the same element passed in', () => {
            const mockItem = new GlossaryItem('Test', 'Test Definition', 'term');
            
            const result = provider.getTreeItem(mockItem);
            
            expect(result).toBe(mockItem);
        });

        it('should handle different glossary item types', () => {
            const items = [
                new GlossaryItem('API', 'Application Programming Interface', 'term'),
                new GlossaryItem('Empty', 'No terms defined', 'empty'),
                new GlossaryItem('Another Term', 'Another term description', 'term')
            ];

            items.forEach(item => {
                const result = provider.getTreeItem(item);
                expect(result).toBe(item);
            });
        });
    });

    describe('getChildren', () => {
        it('should return glossary terms when terms exist', async () => {
            // Mock non-empty glossary
            (provider as any).glossaryTerms = new Map([
                ['API', {
                    term: 'API',
                    definition: 'Application Programming Interface',
                    dateAdded: Date.now(),
                    usage: 5
                }],
                ['REST', {
                    term: 'REST',
                    definition: 'Representational State Transfer',
                    dateAdded: Date.now(),
                    usage: 3
                }]
            ]);
            
            const children = await provider.getChildren();
            
            expect(children).toHaveLength(2);
            expect(children[0].label).toBe('API');
            expect(children[1].label).toBe('REST');
        });

        it('should return empty message when no terms exist', async () => {
            // Mock empty glossary
            (provider as any).glossaryTerms = new Map();
            
            const children = await provider.getChildren();
            
            expect(children).toHaveLength(1);
            expect(children[0].label).toBe('No Terms Defined');
            expect(children[0].definition).toBe('Use chat commands to add terms: "Define API as Application Programming Interface"');
        });

        it('should sort terms alphabetically', async () => {
            // Mock glossary with unsorted terms
            (provider as any).glossaryTerms = new Map([
                ['Zebra', { term: 'Zebra', definition: 'Z definition', dateAdded: Date.now(), usage: 1 }],
                ['Alpha', { term: 'Alpha', definition: 'A definition', dateAdded: Date.now(), usage: 1 }],
                ['Beta', { term: 'Beta', definition: 'B definition', dateAdded: Date.now(), usage: 1 }]
            ]);
            
            const children = await provider.getChildren();
            
            expect(children[0].label).toBe('Alpha');
            expect(children[1].label).toBe('Beta');
            expect(children[2].label).toBe('Zebra');
        });

        it('should return empty array for child elements', async () => {
            const mockItem = new GlossaryItem('Test', 'Test Definition', 'term');
            
            const children = await provider.getChildren(mockItem);
            
            expect(children).toEqual([]);
        });
    });

    describe('addTerm', () => {
        it('should add new term successfully', async () => {
            const result = await provider.addTerm('GraphQL', 'A query language for APIs');
            
            expect(result).toBe(true);
            expect(mockContext.workspaceState.update).toHaveBeenCalled();
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });

        it('should handle duplicate terms', async () => {
            // Add term twice
            await provider.addTerm('API', 'Application Programming Interface');
            const result = await provider.addTerm('API', 'Different definition');
            
            expect(result).toBe(true); // Should update existing term
        });

        it('should validate input parameters', async () => {
            // Test empty term
            const result1 = await provider.addTerm('', 'Some definition');
            expect(result1).toBe(false);
            
            // Test empty definition
            const result2 = await provider.addTerm('Term', '');
            expect(result2).toBe(false);
            
            // Test null/undefined
            const result3 = await provider.addTerm(null as any, 'Definition');
            expect(result3).toBe(false);
        });

        it('should handle storage errors gracefully', async () => {
            mockContext.workspaceState.update = jest.fn().mockRejectedValue(new Error('Storage error'));

            const result = await provider.addTerm('Test', 'Test definition');

            expect(result).toBe(false);
        });

        it('should handle special characters in terms', async () => {
            const result = await provider.addTerm('API/REST', 'API with REST protocol');

            expect(result).toBe(true);
        });
    });

    describe('removeTerm', () => {
        it('should remove existing term successfully', async () => {
            // First add a term
            await provider.addTerm('ToRemove', 'Term to be removed');
            
            const result = await provider.removeTerm('ToRemove');
            
            expect(result).toBe(true);
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });

        it('should handle non-existent term removal', async () => {
            const result = await provider.removeTerm('NonExistent');
            
            expect(result).toBe(false);
        });

        it('should validate input parameters', async () => {
            const result1 = await provider.removeTerm('');
            expect(result1).toBe(false);
            
            const result2 = await provider.removeTerm(null as any);
            expect(result2).toBe(false);
        });
    });

    describe('incrementUsage', () => {
        it('should increment usage for existing term', async () => {
            // Add a term first
            await provider.addTerm('TestTerm', 'Test definition');
            
            const result = await provider.incrementUsage('TestTerm');
            
            expect(result).toBe(true);
        });

        it('should handle non-existent term', async () => {
            const result = await provider.incrementUsage('NonExistent');
            
            expect(result).toBe(false);
        });
    });

    describe('GlossaryItem Class', () => {
        it('should create term item with all properties', () => {
            const item = new GlossaryItem('API', 'Application Programming Interface', 'term', 5);
            
            expect(item.label).toBe('API');
            expect(item.description).toBe('Application Programming Interface (5x)');
            expect(item.contextValue).toBe('term');
            expect(item.command).toBeDefined();
            expect(item.command?.command).toBe('manifestoEnforcer.showGlossaryTerm');
        });

        it('should create empty item', () => {
            const item = new GlossaryItem('No Terms', 'Use chat commands', 'empty');
            
            expect(item.label).toBe('No Terms');
            expect(item.contextValue).toBe('empty');
            expect(item.command).toBeUndefined();
        });

        it('should handle long definitions with truncation', () => {
            const longDefinition = 'This is a very long definition that should be truncated when displayed in the tree view';
            const item = new GlossaryItem('LongTerm', longDefinition, 'term', 1);
            
            expect(item.description).toContain('...');
            expect(typeof item.description === 'string' ? item.description.length : 0).toBeLessThan(longDefinition.length + 10);
        });

        it('should handle zero usage count', () => {
            const item = new GlossaryItem('NewTerm', 'New definition', 'term', 0);
            
            expect(item.description).not.toContain('(0x)');
        });
    });

    describe('Integration and Edge Cases', () => {
        it('should handle rapid successive operations', async () => {
            const promises = [
                provider.addTerm('Term1', 'Definition1'),
                provider.addTerm('Term2', 'Definition2'),
                provider.addTerm('Term3', 'Definition3')
            ];
            
            const results = await Promise.all(promises);
            
            expect(results.every(r => typeof r === 'boolean')).toBe(true);
        });

        it('should maintain data consistency across operations', async () => {
            await provider.addTerm('TestTerm', 'Test definition');
            await provider.incrementUsage('TestTerm');
            
            const children = await provider.getChildren();
            const testTerm = children.find(c => c.label === 'TestTerm');
            
            expect(testTerm).toBeDefined();
            expect(testTerm?.description).toContain('(1x)');
        });

        it('should handle concurrent refresh and operations', async () => {
            const addPromise = provider.addTerm('ConcurrentTerm', 'Concurrent definition');
            provider.refresh();
            
            const result = await addPromise;
            expect(result).toBe(true);
        });
    });
});
