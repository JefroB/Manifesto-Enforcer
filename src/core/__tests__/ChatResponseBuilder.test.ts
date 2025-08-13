/**
 * ChatResponseBuilder Tests - Action button system validation
 */

import { ChatResponseBuilder } from '../ChatResponseBuilder';
import { ActionSafety } from '../types';

describe('ChatResponseBuilder', () => {
    let builder: ChatResponseBuilder;

    beforeEach(() => {
        builder = new ChatResponseBuilder();
    });

    describe('basic functionality', () => {
        it('should set content correctly', () => {
            const content = 'Test content';
            builder.setContent(content);
            
            const result = builder.build();
            expect(result.content).toBe(content);
        });

        it('should throw error for empty content', () => {
            expect(() => builder.setContent('')).toThrow('Content must be a non-empty string');
        });

        it('should throw error when building without content', () => {
            expect(() => builder.build()).toThrow('Content is required to build a response');
        });
    });

    describe('action management', () => {
        it('should add actions correctly', () => {
            const action = {
                id: 'test',
                label: 'Test Action',
                command: 'test',
                data: { fileName: 'test.txt', content: 'test content' }
            };

            builder.setContent('Test').addAction(action);
            
            const result = builder.build();
            expect(result.actions).toHaveLength(1);
            expect(result.actions![0]).toEqual(action);
        });

        it('should throw error for invalid action', () => {
            expect(() => builder.addAction({} as any)).toThrow('Action must have id, label, and command properties');
        });

        it('should add multiple actions', () => {
            builder.setContent('Test')
                .addAction({ id: '1', label: 'Action 1', command: 'cmd1' })
                .addAction({ id: '2', label: 'Action 2', command: 'cmd2' });
            
            const result = builder.build();
            expect(result.actions).toHaveLength(2);
        });
    });

    describe('convenience methods', () => {
        it('should add file creation action with correct safety level', () => {
            builder.setContent('Test').addFileCreationAction('test.txt', 'content', 'text');
            
            const result = builder.build();
            const action = result.actions![0];
            
            expect(action.command).toBe('createFile');
            expect(action.safety).toBe(ActionSafety.SAFE);
            expect(action.data?.fileName).toBe('test.txt');
            expect(action.data?.content).toBe('content');
        });

        it('should add file edit action with cautious safety level', () => {
            builder.setContent('Test').addFileEditAction('test.txt', 'new content');
            
            const result = builder.build();
            const action = result.actions![0];
            
            expect(action.command).toBe('editFile');
            expect(action.safety).toBe(ActionSafety.CAUTIOUS);
            expect(action.data?.fileName).toBe('test.txt');
        });

        it('should add manifesto creation action with cautious safety level', () => {
            builder.setContent('Test').addManifestoCreationAction('# Manifesto', 'General');
            
            const result = builder.build();
            const action = result.actions![0];
            
            expect(action.command).toBe('createManifesto');
            expect(action.safety).toBe(ActionSafety.CAUTIOUS);
            expect(action.data?.content).toBe('# Manifesto');
            expect(action.data?.type).toBe('General');
        });

        it('should add code generation action with safe safety level', () => {
            builder.setContent('Test').addCodeGenerationAction('hello.js', 'console.log("Hello");', 'javascript');
            
            const result = builder.build();
            const action = result.actions![0];
            
            expect(action.command).toBe('generateCode');
            expect(action.safety).toBe(ActionSafety.SAFE);
            expect(action.data?.fileName).toBe('hello.js');
            expect(action.data?.language).toBe('javascript');
        });

        it('should add lint action with safe safety level', () => {
            builder.setContent('Test').addLintAction('test.js');
            
            const result = builder.build();
            const action = result.actions![0];
            
            expect(action.command).toBe('lintCode');
            expect(action.safety).toBe(ActionSafety.SAFE);
            expect(action.data?.filePath).toBe('test.js');
        });

        it('should add index action with safe safety level', () => {
            builder.setContent('Test').addIndexAction();
            
            const result = builder.build();
            const action = result.actions![0];
            
            expect(action.command).toBe('indexCodebase');
            expect(action.safety).toBe(ActionSafety.SAFE);
        });
    });

    describe('HTML output', () => {
        it('should build HTML with action buttons', () => {
            builder.setContent('Test content')
                .addAction({
                    id: 'test',
                    label: 'Test Action',
                    command: 'test',
                    icon: '🔧',
                    style: 'primary'
                });
            
            const html = builder.buildAsHtml();
            
            expect(html).toContain('Test content');
            expect(html).toContain('<div class="chat-actions">');
            expect(html).toContain('action-button primary');
            expect(html).toContain('Test Action'); // Button text without icon
            expect(html).toContain('data-action-command="test"');
        });

        it('should handle actions without icons', () => {
            builder.setContent('Test')
                .addAction({
                    id: 'test',
                    label: 'Test Action',
                    command: 'test'
                });
            
            const html = builder.buildAsHtml();
            expect(html).toContain('Test Action'); // Button text without icon
        });

        it('should include action data in HTML', () => {
            builder.setContent('Test')
                .addAction({
                    id: 'test',
                    label: 'Test Action',
                    command: 'test',
                    data: { fileName: 'test.txt', content: 'test' }
                });
            
            const html = builder.buildAsHtml();
            expect(html).toContain('data-action-data=');
            expect(html).toContain('fileName');
        });
    });

    describe('static helpers', () => {
        it('should create response with single action', () => {
            const action = {
                id: 'test',
                label: 'Test Action',
                command: 'test'
            };
            
            const result = ChatResponseBuilder.withAction('Test content', action);
            
            expect(result.content).toBe('Test content');
            expect(result.actions).toHaveLength(1);
            expect(result.actions![0]).toEqual(action);
        });

        it('should create manifesto creation response', () => {
            const result = ChatResponseBuilder.manifestoCreation(
                'Manifesto ready',
                '# Test Manifesto',
                'General'
            );
            
            expect(result.content).toBe('Manifesto ready');
            expect(result.actions).toHaveLength(1);
            expect(result.actions![0].command).toBe('createManifesto');
        });

        it('should create code generation response with lint action', () => {
            const result = ChatResponseBuilder.codeGeneration(
                'Code ready',
                'hello.js',
                'console.log("Hello");',
                'javascript'
            );
            
            expect(result.content).toBe('Code ready');
            expect(result.actions).toHaveLength(2);
            expect(result.actions![0].command).toBe('generateCode');
            expect(result.actions![1].command).toBe('lintCode');
        });
    });

    describe('method chaining', () => {
        it('should support fluent interface', () => {
            const result = builder
                .setContent('Test')
                .addFileCreationAction('file1.txt', 'content1')
                .addCodeGenerationAction('file2.js', 'code', 'javascript')
                .addLintAction()
                .build();
            
            expect(result.content).toBe('Test');
            expect(result.actions).toHaveLength(3);
        });
    });
});
