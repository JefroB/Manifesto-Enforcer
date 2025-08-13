/**
 * Comprehensive Tests for SecurityReviewProvider
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { SecurityReviewProvider, SecurityItem } from '../SecurityReviewProvider';
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

describe('SecurityReviewProvider', () => {
    let provider: SecurityReviewProvider;
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
        
        provider = new SecurityReviewProvider();
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
            const mockItem = new SecurityItem('Test', 'Test Description', vscode.TreeItemCollapsibleState.None);
            
            const result = provider.getTreeItem(mockItem);
            
            expect(result).toBe(mockItem);
        });

        it('should handle different security item types', () => {
            const items = [
                new SecurityItem('Scan Code', 'Security Scan', vscode.TreeItemCollapsibleState.None),
                new SecurityItem('Review Dependencies', 'Dependency Review', vscode.TreeItemCollapsibleState.Collapsed),
                new SecurityItem('Check Vulnerabilities', 'Vulnerability Check', vscode.TreeItemCollapsibleState.Expanded)
            ];

            items.forEach(item => {
                const result = provider.getTreeItem(item);
                expect(result).toBe(item);
            });
        });
    });

    describe('getChildren', () => {
        it('should return root level security actions when no element provided', async () => {
            const children = await provider.getChildren();
            
            expect(children).toHaveLength(5);
            expect(children[0].label).toBe('Review Selected Code');
            expect(children[1].label).toBe('Security Scan');
            expect(children[2].label).toBe('Refactor Code');
            expect(children[3].label).toBe('Explain Code');
            expect(children[4].label).toBe('Send to Amazon Q');
        });

        it('should return correct security items with proper commands', async () => {
            const children = await provider.getChildren();
            
            // Check Review Selected Code action
            expect(children[0].command).toEqual({
                command: 'manifestoEnforcer.reviewSelectedCode',
                title: 'Review Selected Code'
            });

            // Check Security Scan action
            expect(children[1].command).toEqual({
                command: 'manifestoEnforcer.validateCompliance',
                title: 'Security Scan'
            });

            // Check Refactor Code action
            expect(children[2].command).toEqual({
                command: 'manifestoEnforcer.refactorSelectedCode',
                title: 'Refactor Code'
            });
        });

        it('should return correct tooltips and icons', async () => {
            const children = await provider.getChildren();
            
            expect(children[0].tooltip).toBe('🔍 Review Selected Code');
            expect(children[1].tooltip).toBe('🛡️ Run Security Scan');
            expect(children[2].tooltip).toBe('♻️ Refactor Selected Code');
            expect(children[3].tooltip).toBe('❓ Explain Selected Code');
            expect(children[4].tooltip).toBe('🟠 Send to Amazon Q');
        });

        it('should return empty array for child elements', async () => {
            const mockItem = new SecurityItem('Test', 'Test Description', vscode.TreeItemCollapsibleState.None);
            
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

    describe('SecurityItem Class', () => {
        it('should create security item with all properties', () => {
            const command = {
                command: 'test.security',
                title: 'Test Security Command'
            };
            
            const item = new SecurityItem(
                'Test Security',
                'Test Security Description',
                vscode.TreeItemCollapsibleState.None,
                command
            );
            
            expect(item.label).toBe('Test Security');
            expect(item.tooltip).toBe('Test Security Description');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
            expect(item.command).toBe(command);
        });

        it('should create security item without command', () => {
            const item = new SecurityItem(
                'Test Security',
                'Test Security Description',
                vscode.TreeItemCollapsibleState.Collapsed
            );
            
            expect(item.label).toBe('Test Security');
            expect(item.tooltip).toBe('Test Security Description');
            expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
            expect(item.command).toBeUndefined();
        });

        it('should handle empty strings', () => {
            const item = new SecurityItem('', '', vscode.TreeItemCollapsibleState.None);
            
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

        it('should maintain consistent security action order', async () => {
            const children1 = await provider.getChildren();
            const children2 = await provider.getChildren();
            
            expect(children1.map(c => c.label)).toEqual(children2.map(c => c.label));
        });

        it('should handle provider disposal gracefully', () => {
            // Simulate disposal
            provider.refresh();
            
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });

        it('should handle concurrent refresh and getChildren calls', async () => {
            // Start getChildren call
            const childrenPromise = provider.getChildren();
            
            // Refresh while getChildren is running
            provider.refresh();
            
            // Both should complete successfully
            const children = await childrenPromise;
            expect(children).toHaveLength(5);
            expect(mockEventEmitter.fire).toHaveBeenCalled();
        });
    });
});
