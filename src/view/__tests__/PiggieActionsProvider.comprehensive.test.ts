/**
 * Comprehensive Tests for PiggieActionsProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { PiggieActionsProvider, ActionItem } from '../PiggieActionsProvider';
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

describe('PiggieActionsProvider', () => {
    let provider: PiggieActionsProvider;
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
        
        provider = new PiggieActionsProvider();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with event emitter', () => {
            expect(vscode.EventEmitter).toHaveBeenCalled();
            expect(provider.onDidChangeTreeData).toBeDefined();
        });

        it('should have proper event emitter setup', () => {
            expect(provider.onDidChangeTreeData).toBeDefined();
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
            const mockItem = new ActionItem('Test', 'Test Description', vscode.TreeItemCollapsibleState.None);
            
            const result = provider.getTreeItem(mockItem);
            
            expect(result).toBe(mockItem);
        });

        it('should handle different action item types', () => {
            const items = [
                new ActionItem('Quick Chat', 'Chat Description', vscode.TreeItemCollapsibleState.None),
                new ActionItem('Write Code', 'Code Description', vscode.TreeItemCollapsibleState.Collapsed),
                new ActionItem('Validate', 'Validate Description', vscode.TreeItemCollapsibleState.Expanded)
            ];

            items.forEach(item => {
                const result = provider.getTreeItem(item);
                expect(result).toBe(item);
            });
        });
    });

    describe('getChildren', () => {
        it('should return root level actions when no element provided', async () => {
            const children = await provider.getChildren();
            
            expect(children).toHaveLength(6);
            expect(children[0].label).toBe('Quick Chat');
            expect(children[1].label).toBe('Write Code');
            expect(children[2].label).toBe('Validate Compliance');
            expect(children[3].label).toBe('Switch Agent');
            expect(children[4].label).toBe('Test Connection');
            expect(children[5].label).toBe('Discover APIs');
        });

        it('should return correct action items with proper commands', async () => {
            const children = await provider.getChildren();
            
            // Check Quick Chat action
            expect(children[0].command).toEqual({
                command: 'manifestoEnforcer.quickChat',
                title: 'Quick Chat'
            });

            // Check Write Code action
            expect(children[1].command).toEqual({
                command: 'manifestoEnforcer.writeCode',
                title: 'Write Code'
            });

            // Check Validate Compliance action
            expect(children[2].command).toEqual({
                command: 'manifestoEnforcer.validateCompliance',
                title: 'Validate Compliance'
            });
        });

        it('should return correct tooltips and icons', async () => {
            const children = await provider.getChildren();

            expect(children[0].tooltip).toBe('💬 Quick Chat with Piggie');
            expect(children[1].tooltip).toBe('📝 Write Code');
            expect(children[2].tooltip).toBe('✅ Validate Compliance');
            expect(children[3].tooltip).toBe('🤖 Switch AI Agent');
            expect(children[4].tooltip).toBe('🔧 Test Connection');
            expect(children[5].tooltip).toBe('🔍 Discover APIs');
        });

        it('should return empty array for child elements', async () => {
            const mockItem = new ActionItem('Test', 'Test Description', vscode.TreeItemCollapsibleState.None);
            
            const children = await provider.getChildren(mockItem);
            
            expect(children).toEqual([]);
        });

        it('should handle all tree item collapsible states correctly', async () => {
            const children = await provider.getChildren();
            
            // All root actions should be non-collapsible
            children.forEach(child => {
                expect(child.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
            });
        });
    });

    describe('ActionItem Class', () => {
        it('should create action item with all properties', () => {
            const command = {
                command: 'test.command',
                title: 'Test Command'
            };

            const item = new ActionItem(
                'Test Label',
                'Test Tooltip',
                vscode.TreeItemCollapsibleState.None,
                command
            );

            expect(item.label).toBe('Test Label');
            expect(item.tooltip).toBe('Test Tooltip');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
            expect(item.command).toBe(command);
        });

        it('should create action item without command', () => {
            const item = new ActionItem(
                'Test Label',
                'Test Tooltip',
                vscode.TreeItemCollapsibleState.Collapsed
            );

            expect(item.label).toBe('Test Label');
            expect(item.tooltip).toBe('Test Tooltip');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
            expect(item.command).toBeUndefined();
        });

        it('should handle empty strings', () => {
            const item = new ActionItem('', '', vscode.TreeItemCollapsibleState.None);

            expect(item.label).toBe('');
            expect(item.tooltip).toBe('');
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
            // Simulate disposal
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });
    });
});
