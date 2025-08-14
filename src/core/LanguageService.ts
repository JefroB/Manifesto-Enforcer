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
            for (const keyword of language.detectionKeywords) {
                const lowerKeyword = keyword.toLowerCase();

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
}
