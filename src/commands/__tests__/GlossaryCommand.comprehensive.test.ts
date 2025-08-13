/**
 * Comprehensive Tests for GlossaryCommand
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { GlossaryCommand } from '../GlossaryCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

// Mock StateManager
const mockStateManager = {
    projectGlossary: new Map(),
    saveGlossaryToStorage: jest.fn().mockResolvedValue(true),
    loadGlossaryFromStorage: jest.fn().mockResolvedValue(true)
} as any;

// Mock AgentManager
const mockAgentManager = {
    sendMessage: jest.fn()
} as any;

describe('GlossaryCommand', () => {
    let command: GlossaryCommand;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new GlossaryCommand();
        
        // Reset glossary
        mockStateManager.projectGlossary = new Map();
        
        // Add sample glossary terms
        mockStateManager.projectGlossary.set('API', {
            term: 'API',
            definition: 'Application Programming Interface',
            category: 'Technical',
            dateAdded: new Date('2024-01-01'),
            examples: ['REST API', 'GraphQL API']
        });
        
        mockStateManager.projectGlossary.set('SLA', {
            term: 'SLA',
            definition: 'Service Level Agreement',
            category: 'Business',
            dateAdded: new Date('2024-01-02'),
            examples: ['99.9% uptime SLA']
        });
    });

    describe('command property', () => {
        it('should have correct command name', () => {
            expect(command.command).toBe('/glossary');
        });
    });

    describe('canHandle', () => {
        it('should handle glossary slash commands', () => {
            expect(command.canHandle('/glossary')).toBe(true);
            expect(command.canHandle('/define API')).toBe(true);
            expect(command.canHandle('/lookup SLA')).toBe(true);
            expect(command.canHandle('/GLOSSARY')).toBe(true);
        });

        it('should handle natural language glossary requests', () => {
            expect(command.canHandle('show glossary')).toBe(true);
            expect(command.canHandle('define something')).toBe(true);
            expect(command.canHandle('add term API')).toBe(true);
            expect(command.canHandle('add definition for SLA')).toBe(true);
            expect(command.canHandle('what does API mean')).toBe(true);
            expect(command.canHandle('explain acronym SLA')).toBe(true);
        });

        it('should handle definition patterns', () => {
            expect(command.canHandle('define API as Application Programming Interface')).toBe(true);
            expect(command.canHandle('add term SLA meaning Service Level Agreement')).toBe(true);
        });

        it('should not handle unrelated commands', () => {
            expect(command.canHandle('/help')).toBe(false);
            expect(command.canHandle('create new file')).toBe(false);
            expect(command.canHandle('random text')).toBe(false);
        });

        it('should handle case insensitive patterns', () => {
            expect(command.canHandle('DEFINE something')).toBe(true);
            expect(command.canHandle('Add Term API')).toBe(true);
            expect(command.canHandle('WHAT DOES API MEAN')).toBe(true);
        });
    });

    describe('execute', () => {
        describe('/define command', () => {
            it('should show usage when no parameters provided', async () => {
                const result = await command.execute('/define', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📖 **Define Command Usage:**');
                expect(result).toContain('/define TERM definition here');
                expect(result).toContain('Example: `/define API Application Programming Interface`');
            });

            it('should lookup existing term when only term provided', async () => {
                const result = await command.execute('/define API', mockStateManager, mockAgentManager);

                expect(result).toContain('📖 **API**');
                expect(result).toContain('Application Programming Interface');
                expect(result).toContain('*Added:');
                expect(result).toContain('*Used:');
            });

            it('should add new term when definition provided', async () => {
                const result = await command.execute('/define JWT JSON Web Token', mockStateManager, mockAgentManager);

                expect(result).toContain('✅ **Added to glossary:**');
                expect(result).toContain('**JWT**');
                expect(result).toContain('JSON Web Token');
                expect(mockStateManager.saveGlossaryToStorage).toHaveBeenCalled();
            });
        });

        describe('/lookup command', () => {
            it('should show usage when no parameters provided', async () => {
                const result = await command.execute('/lookup', mockStateManager, mockAgentManager);
                
                expect(result).toContain('🔍 **Lookup Command Usage:**');
                expect(result).toContain('/lookup TERM');
                expect(result).toContain('Example: `/lookup API`');
            });

            it('should lookup existing term', async () => {
                const result = await command.execute('/lookup API', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📖 **API**');
                expect(result).toContain('Application Programming Interface');
            });

            it('should handle non-existent term', async () => {
                const result = await command.execute('/lookup NONEXISTENT', mockStateManager, mockAgentManager);

                expect(result).toContain('❌ **Term "NONEXISTENT" not found in glossary**');
                expect(result).toContain('**To add it:**');
            });
        });

        describe('natural language patterns', () => {
            it('should handle "define X as Y" pattern', async () => {
                const result = await command.execute('define JWT as JSON Web Token', mockStateManager, mockAgentManager);

                expect(result).toContain('✅ **Added to glossary:**');
                expect(result).toContain('**JWT**');
                expect(result).toContain('JSON Web Token');
            });

            it('should handle "add term X meaning Y" pattern', async () => {
                const result = await command.execute('add term JWT meaning JSON Web Token', mockStateManager, mockAgentManager);

                expect(result).toContain('✅ **Added to glossary:**');
                expect(result).toContain('**JWT**');
                expect(result).toContain('JSON Web Token');
            });

            it('should handle "what does X mean" pattern', async () => {
                const result = await command.execute('what does API mean', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📖 **API**');
                expect(result).toContain('Application Programming Interface');
            });

            it('should show glossary when requested', async () => {
                const result = await command.execute('show glossary', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📖 **Project Glossary**');
                expect(result).toContain('2 terms');
                expect(result).toContain('**API**');
                expect(result).toContain('**SLA**');
            });

            it('should handle remove term request', async () => {
                const result = await command.execute('remove API', mockStateManager, mockAgentManager);

                expect(result).toContain('✅ **Removed from glossary:**');
                expect(result).toContain('API');
                expect(mockStateManager.saveGlossaryToStorage).toHaveBeenCalled();
            });
        });

        describe('general help', () => {
            it('should provide general glossary help for unmatched input', async () => {
                const result = await command.execute('glossary help', mockStateManager, mockAgentManager);
                
                expect(result).toContain('📖 **Glossary Commands:**');
                expect(result).toContain('**Add terms:**');
                expect(result).toContain('**Look up terms:**');
                expect(result).toContain('**Manage glossary:**');
            });
        });

        describe('error handling', () => {
            it('should handle execution errors gracefully', async () => {
                // Mock an error in the execution path
                mockStateManager.projectGlossary = null as any;
                
                const result = await command.execute('/define test', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Glossary operation failed:');
            });

            it('should handle non-Error exceptions', async () => {
                // Mock a non-Error exception
                const originalGet = mockStateManager.projectGlossary.get;
                mockStateManager.projectGlossary.get = () => {
                    throw 'String error';
                };
                
                const result = await command.execute('/lookup API', mockStateManager, mockAgentManager);
                
                expect(result).toContain('❌ Glossary operation failed: String error');
                
                // Restore original method
                mockStateManager.projectGlossary.get = originalGet;
            });
        });
    });

    describe('addTermToGlossary', () => {
        it('should add new term successfully', async () => {
            const result = await command['addTermToGlossary']('JWT', 'JSON Web Token', mockStateManager);

            expect(result).toContain('✅ **Added to glossary:**');
            expect(result).toContain('**JWT**');
            expect(result).toContain('JSON Web Token');
            expect(mockStateManager.saveGlossaryToStorage).toHaveBeenCalled();
        });

        it('should handle existing term with confirmation', async () => {
            const result = await command['addTermToGlossary']('API', 'New definition', mockStateManager);

            expect(result).toContain('📖 **Term "API" already exists**');
            expect(result).toContain('**Current definition:** Application Programming Interface');
            expect(result).toContain('**New definition:** New definition');
            expect(result).toContain('Use "update term API meaning New definition" to update it');
        });
    });

    describe('lookupSingleTerm', () => {
        it('should return term details when found', async () => {
            const result = await command['lookupSingleTerm']('API', mockStateManager);

            expect(result).toContain('📖 **API**');
            expect(result).toContain('Application Programming Interface');
            expect(result).toContain('*Added:');
            expect(result).toContain('*Used:');
        });

        it('should suggest similar terms when not found', async () => {
            const result = await command['lookupSingleTerm']('NONEXISTENT', mockStateManager);

            expect(result).toContain('❌ **Term "NONEXISTENT" not found in glossary**');
            expect(result).toContain('**To add it:**');
        });
    });

    describe('showGlossary', () => {
        it('should show all terms when glossary has content', async () => {
            const result = await command['showGlossary'](mockStateManager);
            
            expect(result).toContain('📖 **Project Glossary** (2 terms)');
            expect(result).toContain('**API**');
            expect(result).toContain('**SLA**');
        });

        it('should show empty message when glossary is empty', async () => {
            mockStateManager.projectGlossary.clear();
            
            const result = await command['showGlossary'](mockStateManager);
            
            expect(result).toContain('📖 **Glossary is empty**');
            expect(result).toContain('**Get started:**');
        });
    });

    describe('removeTerm', () => {
        it('should remove existing term', async () => {
            const result = await command['removeTerm']('remove API', mockStateManager);

            expect(result).toContain('✅ **Removed from glossary:**');
            expect(result).toContain('API');
            expect(mockStateManager.saveGlossaryToStorage).toHaveBeenCalled();
        });

        it('should handle non-existent term', async () => {
            const result = await command['removeTerm']('remove NONEXISTENT', mockStateManager);

            expect(result).toContain('❌ **Term "NONEXISTENT" not found in glossary**');
        });

        it('should handle invalid format', async () => {
            const result = await command['removeTerm']('remove', mockStateManager);

            expect(result).toContain('❌ Could not parse remove request');
            expect(result).toContain('Use format: "Remove TERM"');
        });
    });

    describe('findSimilarTerms', () => {
        it('should find similar terms by partial match', () => {
            const result = command['findSimilarTerms']('AP', mockStateManager);

            expect(result).toContain('API');
        });

        it('should find similar terms by acronym match', () => {
            const result = command['findSimilarTerms']('SL', mockStateManager);

            expect(result).toContain('SLA');
        });

        it('should return empty array when no similar terms found', () => {
            const result = command['findSimilarTerms']('ZZZZZ', mockStateManager);

            expect(result).toEqual([]);
        });

        it('should limit results to maximum 5 terms', () => {
            // Add more terms to test limit
            for (let i = 0; i < 10; i++) {
                mockStateManager.projectGlossary.set(`TERM${i}`, {
                    term: `TERM${i}`,
                    definition: `Definition ${i}`,
                    category: 'Test'
                });
            }

            const result = command['findSimilarTerms']('TERM', mockStateManager);

            expect(result.length).toBeLessThanOrEqual(5);
        });
    });

    describe('provideGlossaryHelp', () => {
        it('should provide comprehensive glossary help', () => {
            const result = command['provideGlossaryHelp'](mockStateManager);

            expect(result).toContain('📖 **Glossary Commands:**');
            expect(result).toContain('**Add terms:**');
            expect(result).toContain('**Look up terms:**');
            expect(result).toContain('**Manage glossary:**');
            expect(result).toContain('**Current glossary:** 2 terms defined');
        });

        it('should show empty glossary message when no terms', () => {
            mockStateManager.projectGlossary.clear();

            const result = command['provideGlossaryHelp'](mockStateManager);

            expect(result).toContain('**Current glossary:** 0 terms defined');
        });
    });

    describe('enhanceResponseWithGlossary', () => {
        it('should track usage when glossary terms found in response', () => {
            const originalResponse = 'This is about API development';
            const apiTerm = mockStateManager.projectGlossary.get('API');
            apiTerm.usage = 0; // Reset usage

            const result = command['enhanceResponseWithGlossary'](originalResponse, mockStateManager);

            expect(result).toBe(originalResponse);
            expect(apiTerm.usage).toBe(1); // Usage should be incremented
        });

        it('should return original response when no glossary terms found', () => {
            const originalResponse = 'This is about something else entirely';

            const result = command['enhanceResponseWithGlossary'](originalResponse, mockStateManager);

            expect(result).toBe(originalResponse);
        });

        it('should handle empty glossary', () => {
            mockStateManager.projectGlossary.clear();
            const originalResponse = 'This is about API development';

            const result = command['enhanceResponseWithGlossary'](originalResponse, mockStateManager);

            expect(result).toBe(originalResponse);
        });

        it('should handle case insensitive term matching', () => {
            const originalResponse = 'This is about api development';
            const apiTerm = mockStateManager.projectGlossary.get('API');
            apiTerm.usage = 0; // Reset usage

            const result = command['enhanceResponseWithGlossary'](originalResponse, mockStateManager);

            expect(result).toBe(originalResponse);
            expect(apiTerm.usage).toBe(1); // Usage should be incremented even with lowercase
        });
    });

    describe('pattern matching edge cases', () => {
        it('should handle malformed define patterns', async () => {
            const result = await command['handleDefineTerm']('define something', mockStateManager);

            expect(result).toContain('❌ Could not parse definition');
            expect(result).toContain('Use format: "Define TERM as DEFINITION"');
        });

        it('should handle malformed add term patterns', async () => {
            const result = await command['handleAddTerm']('add term something', mockStateManager);

            expect(result).toContain('❌ Could not parse term addition');
            expect(result).toContain('Use format: "Add term TERM meaning DEFINITION"');
        });

        it('should handle malformed lookup patterns', async () => {
            const result = await command['handleLookupTerm']('what does mean', mockStateManager);

            expect(result).toContain('❌ Could not parse lookup request');
            expect(result).toContain('Use format: "What does TERM mean?"');
        });
    });

    describe('integration scenarios', () => {
        it('should handle complete workflow: add, lookup, remove', async () => {
            // Add term
            let result = await command.execute('define JWT as JSON Web Token', mockStateManager, mockAgentManager);
            expect(result).toContain('✅ **Added to glossary:**');

            // Lookup term
            result = await command.execute('what does JWT mean', mockStateManager, mockAgentManager);
            expect(result).toContain('📖 **JWT**');
            expect(result).toContain('JSON Web Token');

            // Remove term
            result = await command.execute('remove JWT', mockStateManager, mockAgentManager);
            expect(result).toContain('✅ **Removed from glossary:**');
        });

        it('should handle case insensitive operations', async () => {
            const result = await command.execute('define jwt as json web token', mockStateManager, mockAgentManager);

            expect(result).toContain('✅ **Added to glossary:**');
            expect(result).toContain('**jwt**'); // Should preserve original case
        });
    });
});
