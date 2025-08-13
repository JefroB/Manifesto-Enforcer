/**
 * MANDATORY: Save guard that prevents saving files with manifesto violations
 * REQUIRED: Validates files before save operations
 */

import * as vscode from 'vscode';

/**
 * CRITICAL: Save guard that intercepts save operations
 */
export class ManifestoSaveGuard {
    /**
     * REQUIRED: Validate document before save
     */
    async onWillSaveDocument(document: vscode.TextDocument): Promise<void> {
        // MANDATORY: Input validation
        if (!document) {
            throw new Error('MANIFESTO VIOLATION: Document is required');
        }

        // REQUIRED: Check for manifesto violations
        const violations = await this.checkManifestoCompliance(document);
        
        if (violations.length > 0) {
            // CRITICAL: Show user the violations
            const allow = await vscode.window.showErrorMessage(
                `MANIFESTO VIOLATION: This file violates ${violations.length} manifesto rules. Save anyway?`,
                'Fix Issues', 'Save Anyway'
            );
            
            if (allow !== 'Save Anyway') {
                throw new Error('Save blocked by manifesto enforcement');
            }
        }
    }

    /**
     * REQUIRED: Check document for manifesto compliance
     */
    private async checkManifestoCompliance(document: vscode.TextDocument): Promise<string[]> {
        const violations: string[] = [];
        const text = document.getText();

        // MANDATORY: Check for prohibited patterns
        if (text.includes('innerHTML')) {
            violations.push('PROHIBITED: innerHTML usage detected');
        }

        if (text.includes(': any')) {
            violations.push('CRITICAL: any type usage detected');
        }

        // REQUIRED: Check for missing error handling
        if (text.includes('async ') && !text.includes('try') && !text.includes('catch')) {
            violations.push('MANDATORY: Missing error handling in async function');
        }

        return violations;
    }
}
