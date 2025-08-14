/**
 * RED PHASE: Failing Tests for LanguageService
 * These tests define the expected behavior for centralized language configuration
 */

import { LanguageService } from '../LanguageService';

describe('LanguageService', () => {
    let languageService: LanguageService;

    beforeEach(() => {
        languageService = LanguageService.getInstance();
    });

    describe('getInstance', () => {
        it('should return a singleton instance', () => {
            const instance1 = LanguageService.getInstance();
            const instance2 = LanguageService.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('getLanguageConfig', () => {
        it('should return correct configuration for C++', () => {
            const config = languageService.getLanguageConfig('C++');
            expect(config).toBeDefined();
            expect(config?.name).toBe('C++');
            expect(config?.fileExtensions).toContain('cpp');
            expect(config?.fileExtensions).toContain('h');
            expect(config?.isExecutable).toBe(true);
        });

        it('should return correct configuration for Ruby', () => {
            const config = languageService.getLanguageConfig('Ruby');
            expect(config).toBeDefined();
            expect(config?.name).toBe('Ruby');
            expect(config?.fileExtensions).toContain('rb');
            expect(config?.isExecutable).toBe(true);
        });

        it('should return correct configuration for Java', () => {
            const config = languageService.getLanguageConfig('Java');
            expect(config).toBeDefined();
            expect(config?.name).toBe('Java');
            expect(config?.fileExtensions).toContain('java');
            expect(config?.isExecutable).toBe(true);
        });

        it('should return correct configuration for Vue.js', () => {
            const config = languageService.getLanguageConfig('Vue.js');
            expect(config).toBeDefined();
            expect(config?.name).toBe('Vue.js');
            expect(config?.fileExtensions).toContain('vue');
            expect(config?.isExecutable).toBe(false);
        });

        it('should return correct configuration for TypeScript', () => {
            const config = languageService.getLanguageConfig('TypeScript');
            expect(config).toBeDefined();
            expect(config?.name).toBe('TypeScript');
            expect(config?.fileExtensions).toContain('ts');
            expect(config?.isExecutable).toBe(true);
        });

        it('should return correct configuration for Python', () => {
            const config = languageService.getLanguageConfig('Python');
            expect(config).toBeDefined();
            expect(config?.name).toBe('Python');
            expect(config?.fileExtensions).toContain('py');
            expect(config?.isExecutable).toBe(true);
        });

        it('should return undefined for unknown language', () => {
            const config = languageService.getLanguageConfig('UnknownLanguage');
            expect(config).toBeUndefined();
        });
    });

    describe('detectLanguageFromText', () => {
        it('should detect C++ from keywords', () => {
            const text = 'Create a C++ application with classes and inheritance';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('C++');
        });

        it('should detect Ruby from keywords', () => {
            const text = 'Build a Ruby on Rails web application';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('Ruby');
        });

        it('should detect Java from keywords', () => {
            const text = 'Create a Java Spring Boot application';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('Java');
        });

        it('should detect Vue.js from keywords', () => {
            const text = 'Build a Vue.js component with reactive data';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('Vue.js');
        });

        it('should detect TypeScript from keywords', () => {
            const text = 'Create a TypeScript interface with type definitions';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('TypeScript');
        });

        it('should detect Python from keywords', () => {
            const text = 'Write a Python script using pandas and numpy';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('Python');
        });

        it('should return default language for unrecognized text', () => {
            const text = 'Some generic programming task';
            const language = languageService.detectLanguageFromText(text);
            expect(language).toBe('TypeScript'); // Default fallback
        });
    });

    describe('getAllLanguages', () => {
        it('should return all supported languages', () => {
            const languages = languageService.getAllLanguages();
            expect(languages).toContain('C++');
            expect(languages).toContain('Ruby');
            expect(languages).toContain('Java');
            expect(languages).toContain('Vue.js');
            expect(languages).toContain('TypeScript');
            expect(languages).toContain('Python');
            expect(languages).toContain('JavaScript');
            expect(languages.length).toBeGreaterThan(10); // Should have many languages
        });
    });

    describe('getExecutableLanguages', () => {
        it('should return only executable languages', () => {
            const executableLanguages = languageService.getExecutableLanguages();
            expect(executableLanguages).toContain('C++');
            expect(executableLanguages).toContain('Python');
            expect(executableLanguages).toContain('TypeScript');
            expect(executableLanguages).not.toContain('Vue.js'); // Not executable
        });
    });

    describe('getLanguageByFileExtension', () => {
        it('should detect language from file extension', () => {
            expect(languageService.getLanguageByFileExtension('cpp')).toBe('C++');
            expect(languageService.getLanguageByFileExtension('rb')).toBe('Ruby');
            expect(languageService.getLanguageByFileExtension('java')).toBe('Java');
            expect(languageService.getLanguageByFileExtension('vue')).toBe('Vue.js');
            expect(languageService.getLanguageByFileExtension('ts')).toBe('TypeScript');
            expect(languageService.getLanguageByFileExtension('py')).toBe('Python');
        });

        it('should return undefined for unknown extension', () => {
            expect(languageService.getLanguageByFileExtension('unknown')).toBeUndefined();
        });
    });
});
