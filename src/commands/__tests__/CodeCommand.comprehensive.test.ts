/**
 * Comprehensive Tests for CodeCommand
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { CodeCommand } from '../CodeCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

// Mock StateManager
const mockStateManager = {
    isManifestoMode: true,
    manifestoRules: [
        { id: 'error-handling', description: 'Comprehensive error handling required' },
        { id: 'input-validation', description: 'Input validation mandatory' },
        { id: 'documentation', description: 'JSDoc documentation required' }
    ]
} as any;

// Mock AgentManager
const mockAgentManager = {
    sendMessage: jest.fn()
} as any;

describe('CodeCommand', () => {
    let command: CodeCommand;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new CodeCommand();
        
        // Reset StateManager state
        mockStateManager.isManifestoMode = true;
    });

    describe('command property', () => {
        it('should have correct command name', () => {
            expect(command.command).toBe('/code');
        });
    });

    describe('canHandle', () => {
        it('should handle code generation keywords', () => {
            expect(command.canHandle('write a function')).toBe(true);
            expect(command.canHandle('create a component')).toBe(true);
            expect(command.canHandle('generate code')).toBe(true);
            expect(command.canHandle('build a class')).toBe(true);
            expect(command.canHandle('make a script')).toBe(true);
            expect(command.canHandle('code something')).toBe(true);
            expect(command.canHandle('function test')).toBe(true);
            expect(command.canHandle('class example')).toBe(true);
            expect(command.canHandle('component button')).toBe(true);
            expect(command.canHandle('hello world')).toBe(true);
            expect(command.canHandle('script automation')).toBe(true);
        });

        it('should handle case insensitive input', () => {
            expect(command.canHandle('WRITE a function')).toBe(true);
            expect(command.canHandle('Create A Component')).toBe(true);
            expect(command.canHandle('HELLO WORLD')).toBe(true);
        });

        it('should not handle unrelated commands', () => {
            expect(command.canHandle('/help')).toBe(false);
            expect(command.canHandle('random text')).toBe(false);
            expect(command.canHandle('delete file')).toBe(false);
            expect(command.canHandle('show status')).toBe(false);
        });
    });

    describe('execute', () => {
        describe('hello world requests', () => {
            it('should handle hello world request in manifesto mode', async () => {
                const result = await command.execute('hello world', mockStateManager, mockAgentManager);

                expect(result).toContain('🎉 **Hello World Script Ready!**');
                expect(result).toContain('console.log("Hello, World!");');
                expect(result).toContain('**Manifesto-compliant features:**');
                expect(result).toContain('✅ Comprehensive error handling');
                expect(result).toContain('✅ Input validation');
                expect(result).toContain('✅ JSDoc-ready structure');
            });

            it('should handle hello world request in free mode', async () => {
                mockStateManager.isManifestoMode = false;

                const result = await command.execute('hello world', mockStateManager, mockAgentManager);

                expect(result).toContain('👋 **Hello World**');
                expect(result).toContain('console.log("Hello, World!");');
                expect(result).toContain('Run with: `node hello-world.js`');
            });
        });

        describe('component requests', () => {
            it('should handle React component request', async () => {
                const result = await command.execute('create component Button', mockStateManager, mockAgentManager);

                expect(result).toContain('⚛️ **React Component Generated: component**');
                expect(result).toContain('import React from \'react\';');
                expect(result).toContain('interface componentProps');
                expect(result).toContain('export const component: React.FC<componentProps>');
                expect(result).toContain('**Manifesto Features:**');
            });

            it('should handle component request without name', async () => {
                const result = await command.execute('create component', mockStateManager, mockAgentManager);

                expect(result).toContain('⚛️ **React Component Generated: component**');
                expect(result).toContain('export const component: React.FC');
            });
        });

        describe('function requests', () => {
            it('should handle function creation request', async () => {
                const result = await command.execute('create function validateUser', mockStateManager, mockAgentManager);

                expect(result).toContain('🔧 **Function Generated: function**');
                expect(result).toContain('async function function');
                expect(result).toContain('try {');
                expect(result).toContain('catch (error)');
                expect(result).toContain('**Manifesto Features:**');
            });

            it('should handle function request without name', async () => {
                const result = await command.execute('create function', mockStateManager, mockAgentManager);

                expect(result).toContain('🔧 **Function Generated: function**');
                expect(result).toContain('async function function');
            });
        });

        describe('class requests', () => {
            it('should handle class creation request', async () => {
                const result = await command.execute('create class UserService', mockStateManager, mockAgentManager);

                expect(result).toContain('🏗️ **Class Generated: class**');
                expect(result).toContain('export class class');
                expect(result).toContain('constructor()');
                expect(result).toContain('validateInputs()');
                expect(result).toContain('performOperation()');
                expect(result).toContain('**Manifesto Features:**');
            });

            it('should handle class request without name', async () => {
                const result = await command.execute('create class', mockStateManager, mockAgentManager);

                expect(result).toContain('🏗️ **Class Generated: class**');
                expect(result).toContain('export class class');
            });
        });

        describe('API requests', () => {
            it('should handle API endpoint creation request', async () => {
                const result = await command.execute('create api users', mockStateManager, mockAgentManager);

                expect(result).toContain('🌐 **API Endpoint Generated: api**');
                expect(result).toContain('import express from \'express\'');
                expect(result).toContain('export async function handleApi');
                expect(result).toContain('validateRequest');
                expect(result).toContain('**Manifesto Features:**');
            });

            it('should handle API request without name', async () => {
                const result = await command.execute('create api', mockStateManager, mockAgentManager);

                expect(result).toContain('🌐 **API Endpoint Generated: api**');
                expect(result).toContain('export async function handleApi');
            });
        });

        describe('general code requests', () => {
            it('should handle general code request in manifesto mode', async () => {
                const result = await command.execute('write some code', mockStateManager, mockAgentManager);

                expect(result).toContain('💻 **Ready to create manifesto-compliant code!**');
                expect(result).toContain('**Request:** write some code');
                expect(result).toContain('**I can create:**');
                expect(result).toContain('**Be more specific:**');
            });

            it('should handle general code request in free mode', async () => {
                mockStateManager.isManifestoMode = false;

                const result = await command.execute('write some code', mockStateManager, mockAgentManager);

                expect(result).toContain('💻 **Ready to create code!**');
                expect(result).toContain('**Request:** write some code');
                expect(result).toContain('**I can create:**');
            });
        });

        describe('error handling', () => {
            it('should handle execution errors gracefully', async () => {
                // Mock an error by making extractComponentName throw
                const originalExtract = command['extractComponentName'];
                command['extractComponentName'] = () => {
                    throw new Error('Extraction failed');
                };
                
                const result = await command.execute('create component Test', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Code generation failed:');
                expect(result).toContain('Extraction failed');
                
                // Restore original method
                command['extractComponentName'] = originalExtract;
            });

            it('should handle non-Error exceptions', async () => {
                // Mock a non-Error exception
                const originalExtract = command['extractFunctionName'];
                command['extractFunctionName'] = () => {
                    throw 'String error';
                };
                
                const result = await command.execute('create function test', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Code generation failed: String error');
                
                // Restore original method
                command['extractFunctionName'] = originalExtract;
            });
        });
    });

    describe('extractComponentName', () => {
        it('should extract component name from input', () => {
            expect(command['extractComponentName']('create component Button')).toBe('component');
            expect(command['extractComponentName']('generate component Modal')).toBe('component');
            expect(command['extractComponentName']('component Header')).toBe('Header');
        });

        it('should return null when no component pattern found', () => {
            expect(command['extractComponentName']('random text')).toBeNull();
            expect(command['extractComponentName']('make something')).toBeNull();
        });
    });

    describe('extractFunctionName', () => {
        it('should extract function name from input', () => {
            expect(command['extractFunctionName']('create function validateUser')).toBe('function');
            expect(command['extractFunctionName']('generate function processData')).toBe('function');
            expect(command['extractFunctionName']('function helper')).toBe('helper');
        });

        it('should return null when no function pattern found', () => {
            expect(command['extractFunctionName']('random text')).toBeNull();
            expect(command['extractFunctionName']('make something')).toBeNull();
        });
    });

    describe('extractClassName', () => {
        it('should extract class name from input', () => {
            expect(command['extractClassName']('create class UserService')).toBe('class');
            expect(command['extractClassName']('generate service DataManager')).toBe('service');
            expect(command['extractClassName']('class Helper')).toBe('Helper');
        });

        it('should return null when no class pattern found', () => {
            expect(command['extractClassName']('random text')).toBeNull();
            expect(command['extractClassName']('make something')).toBeNull();
        });
    });

    describe('extractEndpointName', () => {
        it('should extract endpoint name from input', () => {
            expect(command['extractEndpointName']('create api users')).toBe('api');
            expect(command['extractEndpointName']('generate endpoint products')).toBe('endpoint');
            expect(command['extractEndpointName']('api orders')).toBe('orders');
        });

        it('should return null when no endpoint pattern found', () => {
            expect(command['extractEndpointName']('random text')).toBeNull();
            expect(command['extractEndpointName']('make something')).toBeNull();
        });
    });

    describe('getRelevantManifestoRules', () => {
        it('should return relevant rules based on input keywords', () => {
            const result = command['getRelevantManifestoRules']('create function with error handling');

            expect(result).toContain('error handling');
        });

        it('should return multiple relevant rules', () => {
            const result = command['getRelevantManifestoRules']('create security api with error handling and testing');

            expect(result).toContain('comprehensive error handling');
            expect(result).toContain('<200ms response times');
            expect(result).toContain('input validation & security');
            expect(result).toContain('unit tests required');
        });

        it('should return default rules when no specific keywords found', () => {
            const result = command['getRelevantManifestoRules']('simple code');

            expect(result).toContain('error handling, input validation, JSDoc documentation');
        });
    });
});
