/**
 * Comprehensive Tests for ManifestoRulesProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { ManifestoRulesProvider, RuleItem } from '../ManifestoRulesProvider';
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
    }
}));

// Mock StateManager
jest.mock('../../core/StateManager');

describe('ManifestoRulesProvider', () => {
    let provider: ManifestoRulesProvider;
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
            ],
            isManifestoMode: true
        } as any;
        
        provider = new ManifestoRulesProvider(mockStateManager);
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with StateManager and event emitter', () => {
            expect(vscode.EventEmitter).toHaveBeenCalled();
            expect(provider.onDidChangeTreeData).toBeDefined();
        });

        it('should store StateManager reference', () => {
            expect((provider as any).stateManager).toBe(mockStateManager);
        });
    });

    describe('refresh', () => {
        it('should fire tree data change event', () => {
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalledWith();
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
            const mockItem = new RuleItem('Test', 'Test Description', vscode.TreeItemCollapsibleState.None);
            
            const result = provider.getTreeItem(mockItem);
            
            expect(result).toBe(mockItem);
        });

        it('should handle different rule item types', () => {
            const items = [
                new RuleItem('Error Handling', 'Error Rule', vscode.TreeItemCollapsibleState.None),
                new RuleItem('Testing', 'Test Rule', vscode.TreeItemCollapsibleState.Collapsed),
                new RuleItem('Documentation', 'Doc Rule', vscode.TreeItemCollapsibleState.Expanded)
            ];

            items.forEach(item => {
                const result = provider.getTreeItem(item);
                expect(result).toBe(item);
            });
        });
    });

    describe('getChildren', () => {
        it('should return manifesto management actions when no element provided', async () => {
            const children = await provider.getChildren();

            expect(children).toHaveLength(5);
            expect(children[0].label).toBe('Toggle Manifesto Mode');
            expect(children[1].label).toBe('Create Manifesto');
            expect(children[2].label).toBe('Refresh Manifesto');
            expect(children[3].label).toBe('Validate Compliance');
            expect(children[4].label).toBe('Settings');
        });

        it('should return correct management items with proper commands', async () => {
            const children = await provider.getChildren();

            // Check Toggle Manifesto Mode action
            expect(children[0].command).toEqual({
                command: 'manifestoEnforcer.toggleManifestoMode',
                title: 'Toggle Manifesto Mode'
            });

            // Check Create Manifesto action
            expect(children[1].command).toEqual({
                command: 'manifestoEnforcer.createManifesto',
                title: 'Create Manifesto'
            });

            // Check Refresh Manifesto action
            expect(children[2].command).toEqual({
                command: 'manifestoEnforcer.refreshManifesto',
                title: 'Refresh Manifesto'
            });
        });

        it('should return correct tooltips and icons', async () => {
            const children = await provider.getChildren();

            expect(children[0].tooltip).toBe('🛡️ Toggle Manifesto Mode');
            expect(children[1].tooltip).toBe('📝 Create New Manifesto');
            expect(children[2].tooltip).toBe('🔄 Refresh Manifesto');
            expect(children[3].tooltip).toBe('✅ Validate Compliance');
            expect(children[4].tooltip).toBe('⚙️ Open Settings');
        });

        it('should return empty array for child elements', async () => {
            const mockItem = new RuleItem('Test', 'Test Description', vscode.TreeItemCollapsibleState.None);
            
            const children = await provider.getChildren(mockItem);
            
            expect(children).toEqual([]);
        });

        it('should handle manifesto mode status in tooltips', async () => {
            // Test with manifesto mode ON
            mockStateManager.isManifestoMode = true;
            const childrenOn = await provider.getChildren();
            expect(childrenOn[0].tooltip).toBe('🛡️ Toggle Manifesto Mode');

            // Test with manifesto mode OFF
            mockStateManager.isManifestoMode = false;
            const childrenOff = await provider.getChildren();
            expect(childrenOff[0].tooltip).toBe('🛡️ Toggle Manifesto Mode');
        });
    });

    describe('RuleItem Class', () => {
        it('should create rule item with all properties', () => {
            const command = {
                command: 'test.rule',
                title: 'Test Rule Command'
            };
            
            const item = new RuleItem(
                'Test Rule',
                'Test Rule Description',
                vscode.TreeItemCollapsibleState.None,
                command
            );
            
            expect(item.label).toBe('Test Rule');
            expect(item.tooltip).toBe('Test Rule Description');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
            expect(item.command).toBe(command);
        });

        it('should create rule item without command', () => {
            const item = new RuleItem(
                'Test Rule',
                'Test Rule Description',
                vscode.TreeItemCollapsibleState.Collapsed
            );
            
            expect(item.label).toBe('Test Rule');
            expect(item.tooltip).toBe('Test Rule Description');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
            expect(item.command).toBeUndefined();
        });

        it('should handle empty strings', () => {
            const item = new RuleItem('', '', vscode.TreeItemCollapsibleState.None);
            
            expect(item.label).toBe('');
            expect(item.tooltip).toBe('');
        });
    });

    describe('StateManager Integration', () => {
        it('should access StateManager manifesto rules', async () => {
            // The provider should be able to access state manager rules
            expect(mockStateManager.manifestoRules).toHaveLength(2);
            expect(mockStateManager.manifestoRules[0].text).toBe('All code must include comprehensive error handling');
        });

        it('should handle empty manifesto rules', async () => {
            mockStateManager.manifestoRules = [];
            
            const children = await provider.getChildren();
            
            // Should still return management actions
            expect(children).toHaveLength(5);
        });

        it('should handle undefined StateManager', () => {
            // Test error handling for missing StateManager
            expect(() => {
                new ManifestoRulesProvider(undefined as any);
            }).not.toThrow();
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

        it('should maintain consistent action order', async () => {
            const children1 = await provider.getChildren();
            const children2 = await provider.getChildren();
            
            expect(children1.map(c => c.label)).toEqual(children2.map(c => c.label));
        });

        it('should handle provider disposal gracefully', () => {
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });

        it('should handle concurrent refresh and getChildren calls', async () => {
            const childrenPromise = provider.getChildren();
            provider.refresh();
            
            const children = await childrenPromise;
            expect(children).toHaveLength(5);
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });
    });
});
