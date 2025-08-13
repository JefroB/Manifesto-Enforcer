/**
 * Chat Response Builder - Create rich chat responses with action buttons
 * Following manifesto: comprehensive error handling, input validation, clean architecture
 */

import { ChatAction, ActionSafety } from './types';

export interface ChatResponseWithActions {
    content: string;
    actions?: ChatAction[];
}

/**
 * Builder class for creating rich chat responses with action buttons
 */
export class ChatResponseBuilder {
    private content: string = '';
    private actions: ChatAction[] = [];

    /**
     * Set the main content of the response
     */
    setContent(content: string): ChatResponseBuilder {
        if (!content || typeof content !== 'string') {
            throw new Error('Content must be a non-empty string');
        }
        this.content = content;
        return this;
    }

    /**
     * Add an action button to the response
     */
    addAction(action: ChatAction): ChatResponseBuilder {
        if (!action || !action.id || !action.label || !action.command) {
            throw new Error('Action must have id, label, and command properties');
        }
        this.actions.push(action);
        return this;
    }

    /**
     * Add a file creation action button
     */
    addFileCreationAction(fileName: string, content: string, fileType: string = 'file'): ChatResponseBuilder {
        return this.addAction({
            id: `create-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`,
            label: `📄 Create ${fileName}`,
            icon: '📄',
            command: 'createFile',
            data: { fileName, content, fileType },
            style: 'primary',
            safety: ActionSafety.SAFE // Creating new files is safe
        });
    }

    /**
     * Add a file edit action button
     */
    addFileEditAction(fileName: string, content: string): ChatResponseBuilder {
        return this.addAction({
            id: `edit-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`,
            label: `✏️ Edit ${fileName}`,
            icon: '✏️',
            command: 'editFile',
            data: { fileName, content },
            style: 'secondary',
            safety: ActionSafety.CAUTIOUS // Editing existing files requires approval
        });
    }

    /**
     * Add a manifesto creation action button
     */
    addManifestoCreationAction(manifestoContent: string, manifestoType: string = 'General'): ChatResponseBuilder {
        return this.addAction({
            id: 'create-manifesto',
            label: '📋 Create manifesto.md',
            icon: '📋',
            command: 'createManifesto',
            data: { content: manifestoContent, type: manifestoType },
            style: 'success',
            safety: ActionSafety.CAUTIOUS // Manifestos are important, require approval
        });
    }

    /**
     * Add a code generation action button
     */
    addCodeGenerationAction(fileName: string, code: string, language: string): ChatResponseBuilder {
        return this.addAction({
            id: `generate-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`,
            label: `💻 Create ${fileName}`,
            icon: '💻',
            command: 'generateCode',
            data: { fileName, code, language },
            style: 'primary',
            safety: ActionSafety.SAFE // Generating new code files is safe
        });
    }

    /**
     * Add a lint/validation action button
     */
    addLintAction(filePath?: string): ChatResponseBuilder {
        return this.addAction({
            id: 'lint-code',
            label: '🔍 Run Lint Check',
            icon: '🔍',
            command: 'lintCode',
            data: { filePath },
            style: 'warning',
            safety: ActionSafety.SAFE // Linting is always safe
        });
    }

    /**
     * Add an indexing action button
     */
    addIndexAction(): ChatResponseBuilder {
        return this.addAction({
            id: 'index-codebase',
            label: '📚 Index Codebase',
            icon: '📚',
            command: 'indexCodebase',
            data: {},
            style: 'secondary',
            safety: ActionSafety.SAFE // Indexing is safe
        });
    }

    /**
     * Build the final response
     */
    build(): ChatResponseWithActions {
        if (!this.content) {
            throw new Error('Content is required to build a response');
        }

        return {
            content: this.content,
            actions: this.actions.length > 0 ? this.actions : undefined
        };
    }

    /**
     * Build and return just the content with action buttons formatted as HTML
     */
    buildAsHtml(): string {
        const response = this.build();
        let html = response.content;

        if (response.actions && response.actions.length > 0) {
            html += '\n\n**Actions:**\n';
            html += '<div class="chat-actions">\n';
            
            for (const action of response.actions) {
                const buttonClass = `action-button ${action.style || 'secondary'}`;
                const dataAttr = action.data ? `data-action-data='${JSON.stringify(action.data)}'` : '';
                
                html += `<button class="${buttonClass}" `;
                html += `data-action-command="${action.command}" `;
                html += `data-action-id="${action.id}" `;
                html += `${dataAttr}`;
                html += `>${action.label}</button>\n`;
            }
            
            html += '</div>';
        }

        return html;
    }

    /**
     * Static helper to create a simple response with one action
     */
    static withAction(content: string, action: ChatAction): ChatResponseWithActions {
        return new ChatResponseBuilder()
            .setContent(content)
            .addAction(action)
            .build();
    }

    /**
     * Static helper to create a manifesto creation response
     */
    static manifestoCreation(content: string, manifestoContent: string, manifestoType: string = 'General'): ChatResponseWithActions {
        return new ChatResponseBuilder()
            .setContent(content)
            .addManifestoCreationAction(manifestoContent, manifestoType)
            .build();
    }

    /**
     * Static helper to create a code generation response
     */
    static codeGeneration(content: string, fileName: string, code: string, language: string): ChatResponseWithActions {
        return new ChatResponseBuilder()
            .setContent(content)
            .addCodeGenerationAction(fileName, code, language)
            .addLintAction(fileName)
            .build();
    }
}
