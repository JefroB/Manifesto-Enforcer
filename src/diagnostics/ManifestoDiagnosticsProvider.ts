import * as vscode from 'vscode';
import * as ts from 'typescript';
import { StateManager } from '../core/StateManager';
import { LanguageService } from '../core/LanguageService';

/**
 * Provides real-time manifesto compliance diagnostics using AST-based analysis
 * Implements the Traditional UI part of the Duality Principle for proactive guidance
 */
export class ManifestoDiagnosticsProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private disposables: vscode.Disposable[] = [];

    constructor(private _stateManager: StateManager) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('manifesto-enforcer');
        
        // Watch for document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(this.onDocumentChange.bind(this)),
            vscode.workspace.onDidOpenTextDocument(this.analyzeDocument.bind(this)),
            vscode.workspace.onDidSaveTextDocument(this.analyzeDocument.bind(this))
        );

        // Analyze all open documents
        vscode.workspace.textDocuments.forEach(doc => this.analyzeDocument(doc));
    }

    /**
     * Handle document changes with debouncing
     */
    private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        // Debounce to avoid excessive analysis
        setTimeout(() => {
            this.analyzeDocument(event.document);
        }, 500);
    }

    /**
     * Analyze a document for manifesto violations using AST parsing
     */
    private analyzeDocument(document: vscode.TextDocument): void {
        if (!this.shouldAnalyzeDocument(document)) {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];

        try {
            // Parse the source code into an AST
            const sourceFile = ts.createSourceFile(
                document.fileName,
                document.getText(),
                ts.ScriptTarget.Latest,
                true
            );

            // Perform AST-based analysis
            this.visitNode(sourceFile, diagnostics, document);

        } catch (error) {
            console.error('Error analyzing document with AST:', error);
            // Fallback to clearing diagnostics if AST parsing fails
        }

        // Set diagnostics for this document
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Visit AST nodes recursively to find violations
     */
    private visitNode(node: ts.Node, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
        // Check for innerHTML usage (XSS vulnerability)
        if (ts.isPropertyAccessExpression(node) && node.name.text === 'innerHTML') {
            const start = document.positionAt(node.getStart());
            const end = document.positionAt(node.getEnd());
            
            diagnostics.push(this.createDiagnostic(
                new vscode.Range(start, end),
                'Manifesto Violation: innerHTML usage detected (XSS vulnerability)',
                'Use textContent, createElement, or safe DOM methods instead',
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Check for eval() usage (code injection risk)
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'eval') {
            const start = document.positionAt(node.expression.getStart());
            const end = document.positionAt(node.expression.getEnd());
            
            diagnostics.push(this.createDiagnostic(
                new vscode.Range(start, end),
                'Manifesto Violation: eval() usage detected (code injection risk)',
                'Avoid eval() - use safer alternatives like JSON.parse() or proper function calls',
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Check for console.log usage (production code cleanup)
        if (ts.isCallExpression(node) && 
            ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === 'console' &&
            node.expression.name.text === 'log' &&
            !document.fileName.includes('test') && 
            !document.fileName.includes('spec')) {
            
            const start = document.positionAt(node.expression.getStart());
            const end = document.positionAt(node.expression.getEnd());
            
            diagnostics.push(this.createDiagnostic(
                new vscode.Range(start, end),
                'Manifesto Violation: console.log in production code',
                'Remove console.log statements before production deployment',
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // Check for hardcoded credentials
        if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer)) {
            const propertyName = ts.isIdentifier(node.name) ? node.name.text : 
                               ts.isStringLiteral(node.name) ? node.name.text : '';
            
            if (this.isCredentialProperty(propertyName)) {
                const start = document.positionAt(node.getStart());
                const end = document.positionAt(node.getEnd());
                
                diagnostics.push(this.createDiagnostic(
                    new vscode.Range(start, end),
                    'Manifesto Violation: Potential hardcoded credential',
                    'Use environment variables or secure configuration for credentials',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Check for hardcoded credentials in variable declarations
        if (ts.isVariableDeclaration(node) && 
            ts.isIdentifier(node.name) && 
            node.initializer && 
            ts.isStringLiteral(node.initializer)) {
            
            if (this.isCredentialProperty(node.name.text)) {
                const start = document.positionAt(node.getStart());
                const end = document.positionAt(node.getEnd());
                
                diagnostics.push(this.createDiagnostic(
                    new vscode.Range(start, end),
                    'Manifesto Violation: Potential hardcoded credential',
                    'Use environment variables or secure configuration for credentials',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        // Check for missing JSDoc on exported functions
        if (this.isExportedFunction(node) && !this.hasJSDocComment(node)) {
            const start = document.positionAt(node.getStart());
            const nameEnd = this.getFunctionNameEnd(node, document);
            
            diagnostics.push(this.createDiagnostic(
                new vscode.Range(start, nameEnd),
                'Manifesto Violation: Missing JSDoc documentation',
                'Add JSDoc comments to document public functions',
                vscode.DiagnosticSeverity.Information
            ));
        }

        // Check for async functions without error handling
        if (this.isAsyncFunction(node) && !this.hasTryCatchBlock(node)) {
            const start = document.positionAt(node.getStart());
            const asyncEnd = this.getAsyncKeywordEnd(node, document);
            
            diagnostics.push(this.createDiagnostic(
                new vscode.Range(start, asyncEnd),
                'Manifesto Violation: Async function without error handling',
                'Add try-catch blocks to handle potential errors',
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // Check for function length
        if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.body) {
            const statementCount = node.body.statements.length;
            if (statementCount > 50) {
                const start = document.positionAt(node.getStart());
                const nameEnd = this.getFunctionNameEnd(node, document);
                
                diagnostics.push(this.createDiagnostic(
                    new vscode.Range(start, nameEnd),
                    'Manifesto Violation: Function too long',
                    `Function has ${statementCount} statements (limit: 50). Consider breaking into smaller functions`,
                    vscode.DiagnosticSeverity.Information
                ));
            }
        }

        // Continue visiting child nodes
        ts.forEachChild(node, child => this.visitNode(child, diagnostics, document));
    }

    /**
     * Check if a property name indicates a credential
     */
    private isCredentialProperty(name: string): boolean {
        const lowerName = name.toLowerCase();
        return lowerName.includes('password') || 
               lowerName.includes('apikey') || 
               lowerName.includes('api_key') || 
               lowerName.includes('secret') || 
               lowerName.includes('token');
    }

    /**
     * Check if a node is an exported function
     */
    private isExportedFunction(node: ts.Node): boolean {
        const isFunctionWithExport = ts.isFunctionDeclaration(node) && this.hasExportModifier(node);
        const isPublicMethod = ts.isMethodDeclaration(node) && this.isPublicMethod(node);
        const isExportedArrowFunction = ts.isVariableDeclaration(node) && 
                                       node.parent && node.parent.parent && 
                                       this.hasExportModifier(node.parent.parent as ts.Node) && 
                                       node.initializer && 
                                       ts.isArrowFunction(node.initializer);
        
        return Boolean(isFunctionWithExport || isPublicMethod || isExportedArrowFunction);
    }

    /**
     * Check if a node has export modifier
     */
    private hasExportModifier(node: ts.Node): boolean {
        if (!node) return false;
        const modifiersNode = node as any;
        if (!modifiersNode.modifiers) return false;
        const result = modifiersNode.modifiers.some((modifier: ts.Modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
        return Boolean(result);
    }

    /**
     * Check if a method is public
     */
    private isPublicMethod(node: ts.MethodDeclaration): boolean {
        if (!node.modifiers) return true; // Default is public
        return !node.modifiers.some((modifier: any) => 
            modifier.kind === ts.SyntaxKind.PrivateKeyword || 
            modifier.kind === ts.SyntaxKind.ProtectedKeyword
        );
    }

    /**
     * Check if a function has JSDoc comments
     */
    private hasJSDocComment(node: ts.Node): boolean {
        const sourceFile = node.getSourceFile();
        const fullText = sourceFile.getFullText();

        // Look for JSDoc comment before the node
        const leadingTrivia = fullText.substring(node.getFullStart(), node.getStart());
        return leadingTrivia.includes('/**') && leadingTrivia.includes('*/');
    }

    /**
     * Check if a node is an async function
     */
    private isAsyncFunction(node: ts.Node): boolean {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
            if (!node.modifiers) return false;
            return node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword);
        }
        return false;
    }

    /**
     * Check if a function has try-catch blocks
     */
    private hasTryCatchBlock(node: ts.Node): boolean {
        let hasTryCatch = false;
        
        const visit = (child: ts.Node) => {
            if (ts.isTryStatement(child)) {
                hasTryCatch = true;
                return;
            }
            ts.forEachChild(child, visit);
        };
        
        ts.forEachChild(node, visit);
        return hasTryCatch;
    }

    /**
     * Get the end position of function name for precise diagnostics
     */
    private getFunctionNameEnd(node: ts.Node, document: vscode.TextDocument): vscode.Position {
        if (ts.isFunctionDeclaration(node) && node.name) {
            return document.positionAt(node.name.getEnd());
        }
        if (ts.isMethodDeclaration(node)) {
            return document.positionAt(node.name.getEnd());
        }
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            return document.positionAt(node.name.getEnd());
        }
        // Fallback
        return document.positionAt(node.getStart() + 20);
    }

    /**
     * Get the end position of async keyword for precise diagnostics
     */
    private getAsyncKeywordEnd(node: ts.Node, document: vscode.TextDocument): vscode.Position {
        const modifiersNode = node as any;
        if (modifiersNode.modifiers) {
            const asyncModifier = modifiersNode.modifiers.find((m: any) => m.kind === ts.SyntaxKind.AsyncKeyword);
            if (asyncModifier) {
                return document.positionAt(asyncModifier.getEnd());
            }
        }
        // Fallback
        return document.positionAt(node.getStart() + 5);
    }

    /**
     * Create a diagnostic object with precise AST-based positioning
     */
    private createDiagnostic(
        range: vscode.Range,
        message: string,
        detail: string,
        severity: vscode.DiagnosticSeverity
    ): vscode.Diagnostic {
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.source = 'Manifesto Enforcer';
        diagnostic.code = 'manifesto-violation';
        
        // Add related information (only if we have a valid URI)
        try {
            const uri = vscode.window.activeTextEditor?.document.uri || vscode.Uri.file('unknown');
            diagnostic.relatedInformation = [
                new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(uri, range),
                    detail
                )
            ];
        } catch (error) {
            // MANDATORY: Comprehensive error handling
            // Skip related information if URI creation fails (e.g., in test environment)
            console.warn('Could not create diagnostic related information:', error);
        }

        return diagnostic;
    }

    /**
     * Check if document should be analyzed using LanguageService
     */
    private shouldAnalyzeDocument(document: vscode.TextDocument): boolean {
        if (document.uri.scheme !== 'file') {
            return false;
        }

        // Use LanguageService to determine if this is a supported code file
        const languageService = LanguageService.getInstance();
        const extension = document.fileName.substring(document.fileName.lastIndexOf('.') + 1);

        // Check if any language supports this file extension
        for (const langName of languageService.getAllLanguages()) {
            const extensions = languageService.getFileExtensions(langName);
            if (extensions.includes(extension)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all diagnostics for a document
     */
    getDiagnostics(document: vscode.TextDocument): readonly vscode.Diagnostic[] {
        return this.diagnosticCollection.get(document.uri) || [];
    }

    /**
     * Clear all diagnostics
     */
    clearDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.diagnosticCollection.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
