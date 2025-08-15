/**
 * LanguageService - Centralized Language Management
 * Provides access to language configurations and detection logic
 */

import { LanguageConfig, languageConfigurations } from './languageConfig';

export class LanguageService {
    private static instance: LanguageService;
    private languages: LanguageConfig[];

    private constructor() {
        this.languages = languageConfigurations;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): LanguageService {
        if (!LanguageService.instance) {
            LanguageService.instance = new LanguageService();
        }
        return LanguageService.instance;
    }

    /**
     * Get language configuration by name
     */
    public getLanguageConfig(name: string): LanguageConfig | undefined {
        return this.languages.find(lang => lang.name === name);
    }

    /**
     * Detect language from text content using keywords
     */
    public detectLanguageFromText(text: string): string {
        const lowerText = text.toLowerCase();

        // Score-based detection for better accuracy
        const scores: { [key: string]: number } = {};

        for (const language of this.languages) {
            scores[language.name] = 0;

            // Check for exact language name matches first (highest priority)
            const languageName = language.name.toLowerCase();

            // Special handling for different language name patterns
            if (languageName === 'c++') {
                // C++ needs special handling due to the + characters
                if (/\bc\+\+\b/i.test(lowerText)) {
                    scores[language.name] += 10;
                }
            } else if (languageName === 'c#') {
                // C# needs special handling due to the # character
                if (/\bc#\b/i.test(lowerText)) {
                    scores[language.name] += 10;
                }
            } else if (languageName.length === 1) {
                // For single-letter languages like "C" and "R", be very strict
                const wordBoundaryRegex = new RegExp(`\\b${languageName}\\b(?!\\w|[+#])`, 'i');
                if (wordBoundaryRegex.test(lowerText)) {
                    scores[language.name] += 10;
                }
            } else {
                // For multi-letter languages, use word boundaries
                const escapedName = languageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordBoundaryRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
                if (wordBoundaryRegex.test(lowerText)) {
                    scores[language.name] += 10;
                }
            }

            for (const keyword of language.detectionKeywords) {
                const lowerKeyword = keyword.toLowerCase();

                // Skip if this keyword is the same as the language name (already handled above)
                if (lowerKeyword === languageName) {
                    continue;
                }

                // Use word boundaries for short keywords to avoid false matches
                if (keyword.length <= 3) {
                    // Escape special regex characters
                    const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const wordBoundaryRegex = new RegExp(`\\b${escapedKeyword}\\b`);
                    if (wordBoundaryRegex.test(lowerText)) {
                        scores[language.name] += 2;
                    }
                } else {
                    // For longer keywords, simple includes is fine
                    if (lowerText.includes(lowerKeyword)) {
                        const specificity = keyword.length > 6 ? 3 : 2;
                        scores[language.name] += specificity;
                    }
                }
            }
        }

        // Find language with highest score
        let bestLanguage = 'TypeScript';
        let bestScore = 0;

        for (const [language, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestLanguage = language;
            }
        }



        return bestLanguage;
    }

    /**
     * Get all supported language names
     */
    public getAllLanguages(): string[] {
        return this.languages.map(lang => lang.name);
    }

    /**
     * Get only executable languages
     */
    public getExecutableLanguages(): string[] {
        return this.languages
            .filter(lang => lang.isExecutable)
            .map(lang => lang.name);
    }

    /**
     * Detect language from file extension
     */
    public getLanguageByFileExtension(extension: string): string | undefined {
        const language = this.languages.find(lang => 
            lang.fileExtensions.includes(extension)
        );
        return language?.name;
    }

    /**
     * Get file extensions for a language
     */
    public getFileExtensions(languageName: string): string[] {
        const language = this.getLanguageConfig(languageName);
        return language?.fileExtensions || [];
    }

    /**
     * Get test file patterns for a language
     */
    public getTestFilePatterns(languageName: string): string[] {
        const language = this.getLanguageConfig(languageName);
        return language?.testFilePatterns || [];
    }

    /**
     * Get detection keywords for a language
     */
    public getDetectionKeywords(languageName: string): string[] {
        const language = this.getLanguageConfig(languageName);
        return language?.detectionKeywords || [];
    }

    /**
     * Get execution command for a language
     */
    public getExecutionCommand(languageName: string, filePath: string): string {
        const language = this.getLanguageConfig(languageName);
        if (!language) {
            throw new Error(`Unknown language: ${languageName}`);
        }
        return language.executionCommand(filePath);
    }

    /**
     * Check if a language is executable
     */
    public isExecutableLanguage(languageName: string): boolean {
        const language = this.getLanguageConfig(languageName);
        return language?.isExecutable || false;
    }

    // WebDriver.IO Support Methods

    /**
     * Detect test framework from package.json dependencies
     */
    public detectTestFrameworkFromPackageJson(packageJson: any): string[] {
        const frameworks: string[] = [];
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Check for WebDriver.IO
        if (dependencies['@wdio/cli'] || dependencies['webdriverio'] || dependencies['@wdio/local-runner']) {
            frameworks.push('WebDriver.IO');
        }

        // Check for other frameworks
        if (dependencies.jest) frameworks.push('Jest');
        if (dependencies.mocha) frameworks.push('Mocha');
        if (dependencies.vitest) frameworks.push('Vitest');
        if (dependencies.cypress) frameworks.push('Cypress');
        if (dependencies.playwright) frameworks.push('Playwright');
        if (dependencies.jasmine) frameworks.push('Jasmine');

        return frameworks;
    }

    /**
     * Detect WebDriver.IO from configuration files
     */
    public detectWebDriverIOFromConfigFiles(files: string[]): boolean {
        const wdioConfigFiles = ['wdio.conf.js', 'wdio.conf.ts', 'wdio.config.js', 'wdio.config.ts'];
        return files.some(file => wdioConfigFiles.includes(file));
    }

    /**
     * Check if project structure indicates WebDriver.IO usage
     */
    public isWebDriverIOProject(projectStructure: string[]): boolean {
        const wdioIndicators = [
            'test/specs/',
            'test/pageobjects/',
            'wdio.conf.js',
            'wdio.conf.ts',
            'e2e/',
            'tests/e2e/'
        ];

        return wdioIndicators.some(indicator =>
            projectStructure.some(path => path.includes(indicator))
        );
    }

    /**
     * Get WebDriver.IO execution command for specific test file
     */
    public getWebDriverIOCommand(language: string, filePath: string): string {
        const configFile = language === 'TypeScript' ? 'wdio.conf.ts' : 'wdio.conf.js';
        return `npx wdio run ${configFile} --spec ${filePath}`;
    }

    /**
     * Get WebDriver.IO command to run all tests
     */
    public getWebDriverIORunAllCommand(): string {
        return 'npx wdio run wdio.conf.js';
    }

    /**
     * Get WebDriver.IO command to run specific test suite
     */
    public getWebDriverIOSuiteCommand(suiteName: string): string {
        return `npx wdio run wdio.conf.js --suite ${suiteName}`;
    }

    /**
     * Detect test framework from text content
     */
    public detectTestFrameworkFromText(text: string): string | null {
        const lowerText = text.toLowerCase();

        // WebDriver.IO keywords
        const wdioKeywords = ['webdriver.io', 'webdriverio', 'wdio', 'browser automation', 'page object model'];
        if (wdioKeywords.some(keyword => lowerText.includes(keyword))) {
            return 'WebDriver.IO';
        }

        // Other framework keywords
        if (lowerText.includes('jest')) return 'Jest';
        if (lowerText.includes('mocha')) return 'Mocha';
        if (lowerText.includes('cypress')) return 'Cypress';
        if (lowerText.includes('playwright')) return 'Playwright';

        return null;
    }

    /**
     * Generate WebDriver.IO test template
     */
    public generateWebDriverIOTestTemplate(testName: string, language: string): string {
        const isTypeScript = language === 'TypeScript';
        const capitalizedTestName = testName.charAt(0).toUpperCase() + testName.slice(1);

        return `describe('${capitalizedTestName} functionality', () => {
    it('should ${testName.toLowerCase()} successfully', async () => {
        await browser.url('/');

        // Add your test steps here
        await $('#username').setValue('testuser');
        await $('#password').setValue('testpass');
        await $('#loginButton').click();

        await expect($('#dashboard')).toBeDisplayed();
    });
});`;
    }

    /**
     * Generate WebDriver.IO page object template
     */
    public generateWebDriverIOPageObject(pageName: string, language: string): string {
        const isTypeScript = language === 'TypeScript';
        const typeAnnotations = isTypeScript ? ': ChainablePromiseElement' : '';
        const asyncType = isTypeScript ? ': Promise<void>' : '';

        return `class ${pageName} {
    get usernameInput()${typeAnnotations} {
        return $('#username');
    }

    get passwordInput()${typeAnnotations} {
        return $('#password');
    }

    get loginButton()${typeAnnotations} {
        return $('#loginButton');
    }

    async login(username${isTypeScript ? ': string' : ''}, password${isTypeScript ? ': string' : ''})${asyncType} {
        await this.usernameInput.setValue(username);
        await this.passwordInput.setValue(password);
        await this.loginButton.click();
    }
}

export default new ${pageName}();`;
    }

    /**
     * Get WebDriver.IO manifesto rules
     */
    public getWebDriverIOManifestoRules(): string[] {
        return [
            'All E2E tests must use Page Object Model',
            'WebDriver.IO tests must have proper wait strategies',
            'Browser instances must be properly cleaned up',
            'Test data must be isolated and reusable',
            'Selectors should be maintainable and descriptive',
            'Tests must be independent and can run in any order'
        ];
    }

    /**
     * Validate WebDriver.IO configuration
     */
    public validateWebDriverIOConfig(config: any): boolean {
        const requiredFields = ['runner', 'specs'];
        return requiredFields.every(field => config.hasOwnProperty(field));
    }

    /**
     * Get WebDriver.IO configuration suggestions
     */
    public getWebDriverIOConfigSuggestions(config: any): string[] {
        const suggestions: string[] = [];

        if (!config.capabilities) {
            suggestions.push('Add capabilities configuration');
        }
        if (!config.framework) {
            suggestions.push('Specify test framework (mocha, jasmine, cucumber)');
        }
        if (!config.reporters) {
            suggestions.push('Configure reporters for better test output');
        }
        if (!config.services) {
            suggestions.push('Add services for enhanced functionality');
        }

        return suggestions;
    }
}
