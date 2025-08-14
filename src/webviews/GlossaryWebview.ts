/**
 * Glossary Management Webview
 * Phase 4: TDD Implementation - Glossary Management with table interface
 * Following manifesto: comprehensive error handling, input validation, JSDoc
 */

import * as vscode from 'vscode';
import { StateManager } from '../core/StateManager';
import { GlossaryTerm } from '../core/types';

/**
 * Extended interface for glossary terms with UI-specific properties
 * MANDATORY: Type safety (manifesto requirement)
 */
export interface ExtendedGlossaryTerm extends GlossaryTerm {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount?: number;
}

/**
 * Webview panel for glossary management with table interface
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 */
export class GlossaryWebview {
    public panel: vscode.WebviewPanel | undefined;
    public readonly stateManager: StateManager;
    private context: vscode.ExtensionContext;
    private glossaryTerms: ExtendedGlossaryTerm[] = [];
    private selectedIds: string[] = [];
    private currentPage: number = 1;
    private pageSize: number = 25;
    private sortColumn: string = 'term';
    private sortDirection: 'asc' | 'desc' = 'asc';
    private searchQuery: string = '';
    private categoryFilter: string = '';

    /**
     * Constructor
     * MANDATORY: Input validation (manifesto requirement)
     */
    constructor(context: vscode.ExtensionContext, stateManager: StateManager) {
        try {
            if (!context || !stateManager) {
                throw new Error('Invalid parameters provided');
            }

            this.context = context;
            this.stateManager = stateManager;
            
            this.loadGlossaryTerms();
            this.createWebviewPanel();
        } catch (error) {
            console.error('GlossaryWebview initialization failed:', error);
            throw new Error(`GlossaryWebview initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Setup webview view for sidebar panel
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public setupView(webviewView: vscode.WebviewView): void {
        try {
            if (!webviewView) {
                throw new Error('Invalid webview view provided');
            }

            // Configure webview options
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this.context.extensionUri]
            };

            // Set initial HTML content
            webviewView.webview.html = this.getHtmlContent();

            // Handle messages from webview
            webviewView.webview.onDidReceiveMessage(
                message => this.handleMessage(message),
                undefined,
                this.context.subscriptions
            );

            // Store reference for refreshing
            this.panel = webviewView as any; // Temporary workaround for type compatibility

        } catch (error) {
            console.error('Failed to setup Glossary Management view:', error);
            throw new Error(`Glossary Management view setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create the webview panel
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private createWebviewPanel(): void {
        try {
            this.panel = vscode.window.createWebviewPanel(
                'glossaryManagement',
                'Glossary Management',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [this.context.extensionUri]
                }
            );

            this.panel.webview.html = this.getHtmlContent();
            this.panel.webview.onDidReceiveMessage(
                message => this.handleMessage(message),
                undefined,
                this.context.subscriptions
            );

            // Handle panel disposal
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);

        } catch (error) {
            console.error('Failed to create webview panel:', error);
            throw new Error(`Webview panel creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get HTML content for the webview
     * MANDATORY: Input validation (manifesto requirement)
     */
    public getHtmlContent(): string {
        try {
            const filteredTerms = this.getFilteredTerms();
            const paginatedTerms = this.getPaginatedTerms(filteredTerms);
            const totalPages = Math.ceil(filteredTerms.length / this.pageSize);

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Glossary</title>
                    <style>
                        body {
                            font-family: var(--vscode-font-family);
                            padding: 20px;
                            color: var(--vscode-foreground);
                            background-color: var(--vscode-editor-background);
                        }

                        .toolbar {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            padding: 15px;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 5px;
                        }
                        .search-section {
                            display: flex;
                            gap: 10px;
                            align-items: center;
                        }
                        .action-section {
                            display: flex;
                            gap: 10px;
                        }
                        input, select {
                            padding: 6px 10px;
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                        }
                        button {
                            padding: 6px 12px;
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                        }
                        button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        button.primary {
                            background-color: var(--vscode-textLink-foreground);
                        }
                        button.danger {
                            background-color: var(--vscode-errorForeground);
                        }
                        .glossary-table {
                            width: 100%;
                            border-collapse: collapse;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 5px;
                            overflow: hidden;
                        }
                        .glossary-table th,
                        .glossary-table td {
                            padding: 12px;
                            text-align: left;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        .glossary-table th {
                            background-color: var(--vscode-list-inactiveSelectionBackground);
                            font-weight: bold;
                            cursor: pointer;
                            user-select: none;
                        }
                        .glossary-table th:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        .glossary-table tr:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        .glossary-table tr.selected {
                            background-color: var(--vscode-list-activeSelectionBackground);
                        }
                        .sort-indicator {
                            margin-left: 5px;
                            font-size: 10px;
                        }
                        .pagination {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-top: 20px;
                            padding: 15px;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 5px;
                        }
                        .pagination-info {
                            font-size: 14px;
                            color: var(--vscode-descriptionForeground);
                        }
                        .pagination-controls {
                            display: flex;
                            gap: 10px;
                            align-items: center;
                        }
                        .checkbox {
                            margin-right: 8px;
                        }
                        .term-actions {
                            display: flex;
                            gap: 5px;
                        }
                        .term-actions button {
                            padding: 4px 8px;
                            font-size: 11px;
                        }
                        .modal {
                            display: none;
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            z-index: 1000;
                        }
                        .modal-content {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background-color: var(--vscode-editor-background);
                            padding: 20px;
                            border-radius: 5px;
                            border: 1px solid var(--vscode-panel-border);
                            min-width: 400px;
                        }
                        .form-group {
                            margin-bottom: 15px;
                        }
                        .form-group label {
                            display: block;
                            margin-bottom: 5px;
                            font-weight: bold;
                        }
                        .form-group input,
                        .form-group textarea,
                        .form-group select {
                            width: 100%;
                            padding: 8px;
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                        }
                        .form-group textarea {
                            height: 80px;
                            resize: vertical;
                        }
                        .modal-actions {
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="toolbar">
                        <div class="top-actions">
                            <input type="text" id="searchInput" placeholder="Search" value="${this.searchQuery}">
                            <button id="addTermBtn" class="primary">Add Term</button>
                            <button id="importBtn">Import</button>
                            <button id="exportBtn">Export</button>
                        </div>
                        <div class="sort-section">
                            <label>Sort by:</label>
                            <select id="sortDropdown">
                                <option value="usage" ${this.sortColumn === 'usage' ? 'selected' : ''}>Usage</option>
                                <option value="term" ${this.sortColumn === 'term' ? 'selected' : ''}>Term</option>
                                <option value="definition" ${this.sortColumn === 'definition' ? 'selected' : ''}>Definition</option>
                                <option value="category" ${this.sortColumn === 'category' ? 'selected' : ''}>Category</option>
                            </select>
                        </div>
                    </div>

                    <table class="glossary-table">
                        <thead>
                            <tr>
                                <th onclick="sortColumn('term')">Term</th>
                                <th onclick="sortColumn('definition')">Definition</th>
                                <th onclick="sortColumn('usage')">Used</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedTerms.map(term => `
                                <tr data-id="${term.id}">
                                    <td>${term.term}</td>
                                    <td>${term.definition}</td>
                                    <td>${term.usageCount || 0}x</td>
                                    <td>
                                        <div class="term-actions">
                                            <button onclick="editTerm('${term.id}')">Edit</button>
                                            <button onclick="deleteTerm('${term.id}')" class="danger">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="pagination">
                        <div class="pagination-info">
                            Showing ${(this.currentPage - 1) * this.pageSize + 1}-${Math.min(this.currentPage * this.pageSize, filteredTerms.length)} of ${filteredTerms.length} terms
                        </div>
                        <div class="pagination-controls">
                            <select id="pageSizeSelect">
                                <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10 per page</option>
                                <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25 per page</option>
                                <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50 per page</option>
                                <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100 per page</option>
                            </select>
                            <button onclick="changePage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>Previous</button>
                            <span>Page ${this.currentPage} of ${totalPages}</span>
                            <button onclick="changePage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next</button>
                        </div>
                    </div>

                    <!-- Add/Edit Term Modal -->
                    <div id="termModal" class="modal">
                        <div class="modal-content">
                            <h3 id="modalTitle">Add Term</h3>
                            <form id="termForm">
                                <div class="form-group">
                                    <label for="termInput">Term:</label>
                                    <input type="text" id="termInput" required>
                                </div>
                                <div class="form-group">
                                    <label for="definitionInput">Definition:</label>
                                    <textarea id="definitionInput" required></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="categoryInput">Category:</label>
                                    <input type="text" id="categoryInput" required>
                                </div>
                                <div class="modal-actions">
                                    <button type="button" onclick="closeModal()">Cancel</button>
                                    <button type="submit" class="primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
            `;
        } catch (error) {
            console.error('Failed to generate HTML content:', error);
            return '<html><body><h1>Error loading Glossary Management</h1></body></html>';
        }
    }

    /**
     * Handle messages from webview
     * MANDATORY: Input validation (manifesto requirement)
     */
    public handleMessage(message: any): void {
        try {
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid message format');
            }

            if (!message.command || typeof message.command !== 'string') {
                throw new Error('Missing or invalid command');
            }

            switch (message.command) {
                case 'addTerm':
                    this.handleAddTerm(message.term, message.definition, message.category);
                    break;
                case 'editTerm':
                    this.handleEditTerm(message.id, message.term, message.definition, message.category);
                    break;
                case 'deleteTerm':
                    this.handleDeleteTerm(message.id);
                    break;
                case 'bulkDelete':
                    this.handleBulkDelete(message.ids);
                    break;
                case 'bulkExport':
                    this.handleBulkExport(message.ids);
                    break;
                case 'searchTerms':
                    this.handleSearchTerms(message.query);
                    break;
                case 'filterByCategory':
                    this.handleFilterByCategory(message.category);
                    break;
                case 'advancedSearch':
                    this.handleAdvancedSearch(message.filters);
                    break;
                case 'sortColumn':
                    this.handleSortColumn(message.column, message.direction);
                    break;
                case 'changePage':
                    this.handleChangePage(message.page, message.pageSize);
                    break;
                case 'changePageSize':
                    this.handleChangePageSize(message.pageSize);
                    break;
                case 'importCSV':
                    this.handleImportCSV(message.filePath);
                    break;
                case 'importJSON':
                    this.handleImportJSON(message.filePath);
                    break;
                case 'exportCSV':
                    this.handleExportCSV(message.filePath);
                    break;
                case 'exportJSON':
                    this.handleExportJSON(message.filePath);
                    break;
                case 'selectRows':
                    this.handleSelectRows(message.ids);
                    break;
                default:
                    throw new Error(`Unknown command: ${message.command}`);
            }
        } catch (error) {
            console.error('Message handling failed:', error);
            vscode.window.showErrorMessage(`Glossary Management error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle add term
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleAddTerm(term: string, definition: string, category: string): void {
        try {
            if (!term || !definition || !category) {
                throw new Error('Missing required fields for term creation');
            }

            const termData = { term, definition, category };
            if (!this.validateTerm(termData)) {
                throw new Error('Invalid term data');
            }

            if (this.isDuplicateTerm(term)) {
                throw new Error('Term already exists');
            }

            const newTerm: ExtendedGlossaryTerm = {
                id: this.generateId(),
                term,
                definition,
                category,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.glossaryTerms.push(newTerm);
            this.saveGlossaryTerms();
            this.refreshTable();
            vscode.window.showInformationMessage(`Added term: ${term}`);
        } catch (error) {
            console.error('Add term failed:', error);
            throw error;
        }
    }

    /**
     * Handle edit term
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleEditTerm(id: string, term: string, definition: string, category: string): void {
        try {
            if (!id || !term || !definition || !category) {
                throw new Error('Missing required fields for term editing');
            }

            const termData = { term, definition, category };
            if (!this.validateTerm(termData)) {
                throw new Error('Invalid term data');
            }

            const existingTermIndex = this.glossaryTerms.findIndex(t => t.id === id);
            if (existingTermIndex === -1) {
                throw new Error('Term not found');
            }

            // Check for duplicates (excluding current term)
            const duplicateExists = this.glossaryTerms.some(t => t.id !== id && t.term.toLowerCase() === term.toLowerCase());
            if (duplicateExists) {
                throw new Error('Term already exists');
            }

            this.glossaryTerms[existingTermIndex] = {
                ...this.glossaryTerms[existingTermIndex],
                term,
                definition,
                category,
                updatedAt: new Date()
            };

            this.saveGlossaryTerms();
            this.refreshTable();
            vscode.window.showInformationMessage(`Updated term: ${term}`);
        } catch (error) {
            console.error('Edit term failed:', error);
            throw error;
        }
    }

    /**
     * Handle delete term
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleDeleteTerm(id: string): void {
        try {
            if (!id) {
                throw new Error('Missing term ID');
            }

            const termIndex = this.glossaryTerms.findIndex(t => t.id === id);
            if (termIndex === -1) {
                throw new Error('Term not found');
            }

            const term = this.glossaryTerms[termIndex];
            this.glossaryTerms.splice(termIndex, 1);
            this.saveGlossaryTerms();
            this.refreshTable();
            vscode.window.showInformationMessage(`Deleted term: ${term.term}`);
        } catch (error) {
            console.error('Delete term failed:', error);
            throw error;
        }
    }

    /**
     * Handle bulk delete
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleBulkDelete(ids: string[]): void {
        try {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('Invalid or empty ID list');
            }

            const deletedTerms = this.glossaryTerms.filter(t => ids.includes(t.id));
            this.glossaryTerms = this.glossaryTerms.filter(t => !ids.includes(t.id));
            this.selectedIds = [];

            this.saveGlossaryTerms();
            this.refreshTable();
            vscode.window.showInformationMessage(`Deleted ${deletedTerms.length} terms`);
        } catch (error) {
            console.error('Bulk delete failed:', error);
            throw error;
        }
    }

    /**
     * Handle bulk export
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleBulkExport(ids: string[]): void {
        try {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('Invalid or empty ID list');
            }

            const termsToExport = this.glossaryTerms.filter(t => ids.includes(t.id));
            vscode.window.showInformationMessage(`Exporting ${termsToExport.length} terms`);
        } catch (error) {
            console.error('Bulk export failed:', error);
            throw error;
        }
    }

    /**
     * Handle search terms
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleSearchTerms(query: string): void {
        try {
            this.searchQuery = query || '';
            this.currentPage = 1; // Reset to first page
            this.refreshTable();
        } catch (error) {
            console.error('Search terms failed:', error);
            throw error;
        }
    }

    /**
     * Handle filter by category
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleFilterByCategory(category: string): void {
        try {
            this.categoryFilter = category || '';
            this.currentPage = 1; // Reset to first page
            this.refreshTable();
        } catch (error) {
            console.error('Filter by category failed:', error);
            throw error;
        }
    }

    /**
     * Handle advanced search
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleAdvancedSearch(filters: any): void {
        try {
            if (!filters || typeof filters !== 'object') {
                throw new Error('Invalid filters object');
            }

            this.searchQuery = filters.term || '';
            this.categoryFilter = filters.category || '';
            this.currentPage = 1; // Reset to first page
            this.refreshTable();
        } catch (error) {
            console.error('Advanced search failed:', error);
            throw error;
        }
    }

    /**
     * Handle sort column
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleSortColumn(column: string, direction: string): void {
        try {
            if (!column || !['term', 'definition', 'category'].includes(column)) {
                throw new Error('Invalid sort column');
            }

            if (!direction || !['asc', 'desc'].includes(direction)) {
                throw new Error('Invalid sort direction');
            }

            this.sortColumn = column;
            this.sortDirection = direction as 'asc' | 'desc';
            this.refreshTable();
        } catch (error) {
            console.error('Sort column failed:', error);
            throw error;
        }
    }

    /**
     * Handle change page
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleChangePage(page: number, pageSize?: number): void {
        try {
            if (typeof page !== 'number' || page < 1) {
                throw new Error('Invalid page number');
            }

            this.currentPage = page;
            if (pageSize && typeof pageSize === 'number' && pageSize > 0) {
                this.pageSize = pageSize;
            }
            this.refreshTable();
        } catch (error) {
            console.error('Change page failed:', error);
            throw error;
        }
    }

    /**
     * Handle change page size
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleChangePageSize(pageSize: number): void {
        try {
            if (typeof pageSize !== 'number' || pageSize < 1) {
                throw new Error('Invalid page size');
            }

            this.pageSize = pageSize;
            this.currentPage = 1; // Reset to first page
            this.refreshTable();
        } catch (error) {
            console.error('Change page size failed:', error);
            throw error;
        }
    }

    /**
     * Handle import CSV
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleImportCSV(filePath: string): void {
        try {
            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Invalid file path');
            }

            vscode.window.showInformationMessage(`Importing CSV from: ${filePath}`);
        } catch (error) {
            console.error('Import CSV failed:', error);
            throw error;
        }
    }

    /**
     * Handle import JSON
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleImportJSON(filePath: string): void {
        try {
            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Invalid file path');
            }

            vscode.window.showInformationMessage(`Importing JSON from: ${filePath}`);
        } catch (error) {
            console.error('Import JSON failed:', error);
            throw error;
        }
    }

    /**
     * Handle export CSV
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleExportCSV(filePath: string): void {
        try {
            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Invalid file path');
            }

            vscode.window.showInformationMessage(`Exporting CSV to: ${filePath}`);
        } catch (error) {
            console.error('Export CSV failed:', error);
            throw error;
        }
    }

    /**
     * Handle export JSON
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleExportJSON(filePath: string): void {
        try {
            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Invalid file path');
            }

            vscode.window.showInformationMessage(`Exporting JSON to: ${filePath}`);
        } catch (error) {
            console.error('Export JSON failed:', error);
            throw error;
        }
    }

    /**
     * Handle select rows
     * MANDATORY: Input validation (manifesto requirement)
     */
    private handleSelectRows(ids: string[]): void {
        try {
            if (!ids || !Array.isArray(ids)) {
                throw new Error('Invalid ID list');
            }

            this.selectedIds = ids;
            this.refreshTable();
        } catch (error) {
            console.error('Select rows failed:', error);
            throw error;
        }
    }

    /**
     * Get glossary terms from StateManager
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public getGlossaryTerms(): ExtendedGlossaryTerm[] {
        try {
            return [...this.glossaryTerms]; // Return copy to prevent external modification
        } catch (error) {
            console.error('Failed to get glossary terms:', error);
            return [];
        }
    }

    /**
     * Validate term data
     * MANDATORY: Input validation (manifesto requirement)
     */
    public validateTerm(termData: any): boolean {
        try {
            if (!termData || typeof termData !== 'object') {
                return false;
            }

            const { term, definition, category } = termData;

            if (!term || typeof term !== 'string' || term.trim().length === 0) {
                return false;
            }

            if (!definition || typeof definition !== 'string' || definition.trim().length === 0) {
                return false;
            }

            if (!category || typeof category !== 'string' || category.trim().length === 0) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Term validation failed:', error);
            return false;
        }
    }

    /**
     * Check if term is duplicate
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public isDuplicateTerm(term: string): boolean {
        try {
            if (!term || typeof term !== 'string') {
                return false;
            }

            return this.glossaryTerms.some(t => t.term.toLowerCase() === term.toLowerCase());
        } catch (error) {
            console.error('Duplicate term check failed:', error);
            return false;
        }
    }

    /**
     * Get selected IDs
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public getSelectedIds(): string[] {
        try {
            return [...this.selectedIds]; // Return copy to prevent external modification
        } catch (error) {
            console.error('Failed to get selected IDs:', error);
            return [];
        }
    }

    /**
     * Refresh the table UI
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public refreshTable(): void {
        try {
            if (this.panel) {
                this.panel.webview.html = this.getHtmlContent();
            }
        } catch (error) {
            console.error('Failed to refresh table:', error);
        }
    }

    /**
     * Load glossary terms from StateManager
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private loadGlossaryTerms(): void {
        try {
            // Load from StateManager's project glossary
            const glossaryMap = this.stateManager.projectGlossary;
            this.glossaryTerms = Array.from(glossaryMap.entries()).map(([termKey, glossaryTerm]) => ({
                id: this.generateId(),
                term: glossaryTerm.term,
                definition: glossaryTerm.definition,
                category: glossaryTerm.category || 'General',
                examples: glossaryTerm.examples,
                relatedTerms: glossaryTerm.relatedTerms,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        } catch (error) {
            console.error('Failed to load glossary terms:', error);
            this.glossaryTerms = [];
        }
    }

    /**
     * Save glossary terms to StateManager
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private saveGlossaryTerms(): void {
        try {
            // Save to StateManager's project glossary
            const glossaryMap = new Map<string, GlossaryTerm>();
            this.glossaryTerms.forEach(extendedTerm => {
                const glossaryTerm: GlossaryTerm = {
                    term: extendedTerm.term,
                    definition: extendedTerm.definition,
                    category: extendedTerm.category,
                    examples: extendedTerm.examples,
                    relatedTerms: extendedTerm.relatedTerms
                };
                glossaryMap.set(extendedTerm.term, glossaryTerm);
            });
            this.stateManager.projectGlossary = glossaryMap;
        } catch (error) {
            console.error('Failed to save glossary terms:', error);
        }
    }

    /**
     * Get filtered terms based on search and category filter
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private getFilteredTerms(): ExtendedGlossaryTerm[] {
        try {
            let filtered = [...this.glossaryTerms];

            // Apply search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(term =>
                    term.term.toLowerCase().includes(query) ||
                    term.definition.toLowerCase().includes(query) ||
                    (term.category && term.category.toLowerCase().includes(query))
                );
            }

            // Apply category filter
            if (this.categoryFilter) {
                filtered = filtered.filter(term => term.category === this.categoryFilter);
            }

            // Apply sorting
            filtered.sort((a, b) => {
                const aValue = a[this.sortColumn as keyof ExtendedGlossaryTerm] as string;
                const bValue = b[this.sortColumn as keyof ExtendedGlossaryTerm] as string;

                if (this.sortDirection === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });

            return filtered;
        } catch (error) {
            console.error('Failed to get filtered terms:', error);
            return [];
        }
    }

    /**
     * Get paginated terms
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private getPaginatedTerms(filteredTerms: ExtendedGlossaryTerm[]): ExtendedGlossaryTerm[] {
        try {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            return filteredTerms.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Failed to get paginated terms:', error);
            return [];
        }
    }

    /**
     * Get unique categories
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private getUniqueCategories(): string[] {
        try {
            const categories = new Set(this.glossaryTerms.map(term => term.category || 'General').filter(Boolean));
            return Array.from(categories).sort();
        } catch (error) {
            console.error('Failed to get unique categories:', error);
            return [];
        }
    }

    /**
     * Get sort indicator for column
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private getSortIndicator(column: string): string {
        try {
            if (this.sortColumn === column) {
                return this.sortDirection === 'asc' ? '▲' : '▼';
            }
            return '';
        } catch (error) {
            console.error('Failed to get sort indicator:', error);
            return '';
        }
    }

    /**
     * Generate unique ID
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private generateId(): string {
        try {
            return `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        } catch (error) {
            console.error('Failed to generate ID:', error);
            return `term-${Date.now()}`;
        }
    }

    /**
     * Refresh webview content
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public refreshContent(): void {
        try {
            if (this.panel && this.panel.webview) {
                this.panel.webview.html = this.getHtmlContent();
            }
        } catch (error) {
            console.error('Failed to refresh webview content:', error);
        }
    }

    /**
     * Dispose of the webview
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    public dispose(): void {
        try {
            if (this.panel) {
                this.panel.dispose();
                this.panel = undefined;
            }
        } catch (error) {
            console.error('Failed to dispose webview:', error);
        }
    }
}
