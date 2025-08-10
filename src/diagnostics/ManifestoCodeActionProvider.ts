import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';

/**
 * Provides quick fixes for manifesto violations using AST-based precision
 * Implements the Traditional UI part of the Duality Principle for code actions
 */
export class ManifestoCodeActionProvider implements vscode.CodeActionProvider {
    
    constructor(private _stateManager: StateManager) {}

    /**
     * Provide code actions for manifesto violations
     */
    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        
        const actions: vscode.CodeAction[] = [];
        
        // Process each diagnostic in the context
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source === 'Manifesto Enforcer') {
                const action = this.createFixAction(document, diagnostic);
                if (action) {
                    actions.push(action);
                }
            }
        }
        
        return actions;
    }

    /**
     * Create a fix action for a specific diagnostic using AST-based analysis
     */
    private createFixAction(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
        try {
            // innerHTML fix
            if (diagnostic.message.includes('innerHTML')) {
                return this.createInnerHTMLFix(document, diagnostic);
            }
            
            // eval() fix
            if (diagnostic.message.includes('eval()')) {
                return this.createEvalFix(document, diagnostic);
            }
            
            // console.log fix
            if (diagnostic.message.includes('console.log')) {
                return this.createConsoleLogFix(document, diagnostic);
            }
            
            // Missing error handling fix
            if (diagnostic.message.includes('error handling')) {
                return this.createErrorHandlingFix(document, diagnostic);
            }
            
            // Missing JSDoc fix
            if (diagnostic.message.includes('JSDoc')) {
                return this.createJSDocFix(document, diagnostic);
            }
            
            // Hardcoded credentials fix
            if (diagnostic.message.includes('credential')) {
                return this.createCredentialFix(document, diagnostic);
            }
            
        } catch (error) {
            console.error('Error creating fix action:', error);
        }
        
        return undefined;
    }

    /**
     * Create fix for innerHTML usage using AST precision
     */
    private createInnerHTMLFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction('Replace innerHTML with textContent', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();
        // Use AST-accurate diagnostic.range directly - no string manipulation
        edit.replace(document.uri, diagnostic.range, 'textContent');

        action.edit = edit;
        return action;
    }

    /**
     * Create fix for eval() usage using AST precision
     */
    private createEvalFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction('Replace eval() with JSON.parse()', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();
        // Use AST-accurate diagnostic.range directly - no string manipulation
        edit.replace(document.uri, diagnostic.range, 'JSON.parse');

        action.edit = edit;
        return action;
    }

    /**
     * Create fix for console.log removal using AST precision
     */
    private createConsoleLogFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction('Remove console.log statement', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();
        // Use AST-accurate diagnostic.range directly - no string manipulation or line-based logic
        edit.delete(document.uri, diagnostic.range);

        action.edit = edit;
        return action;
    }

    /**
     * Create fix for missing error handling using AST precision
     */
    private createErrorHandlingFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction('Add try-catch block', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();

        // Use AST-accurate diagnostic.range directly - insert try-catch at the precise location
        // The diagnostic should already identify the exact function body location
        const tryBlock = `try {\n        // TODO: Wrap function body in try block\n    } catch (error) {\n        console.error('Error:', error);\n        throw error;\n    }`;
        edit.insert(document.uri, diagnostic.range.start, tryBlock + '\n');

        action.edit = edit;
        return action;
    }

    /**
     * Create fix for missing JSDoc using AST precision
     */
    private createJSDocFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction('Add JSDoc comment', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();

        // Use AST-accurate diagnostic.range directly - insert JSDoc at the precise location
        const jsDoc = `/**\n * Function description\n * @param {any} params - Parameter descriptions\n * @returns {any} Return description\n */\n`;
        edit.insert(document.uri, diagnostic.range.start, jsDoc);

        action.edit = edit;
        return action;
    }

    /**
     * Create fix for hardcoded credentials using AST precision
     */
    private createCredentialFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction('Replace with environment variable', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const edit = new vscode.WorkspaceEdit();

        // Use AST-accurate diagnostic.range directly - replace with generic environment variable
        edit.replace(document.uri, diagnostic.range, 'process.env.CREDENTIAL_VALUE');

        action.edit = edit;
        return action;
    }

    /**
     * Create a general "Fix All Issues" action
     */
    static createFixAllAction(_document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]): vscode.CodeAction {
        const action = new vscode.CodeAction('Fix All Manifesto Violations', vscode.CodeActionKind.SourceFixAll);
        action.diagnostics = diagnostics;
        
        const edit = new vscode.WorkspaceEdit();
        
        // Apply fixes for each diagnostic
        for (const _diagnostic of diagnostics) {
            // This would need to be implemented to apply all fixes at once
            // For now, we'll just mark it as available
        }
        
        action.edit = edit;
        return action;
    }
}
