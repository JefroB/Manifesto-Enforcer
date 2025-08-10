import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';

/**
 * Command for handling code generation and creation requests
 * Handles patterns like "write", "create", "generate", "build", "make", "code", "function", "class", "component"
 */
export class CodeCommand implements IChatCommand {
    public readonly command = '/code';

    /**
     * Determines if this command can handle the given input
     */
    canHandle(input: string): boolean {
        // Handle code generation requests
        if (/\b(write|create|generate|build|make|code|function|class|component|hello world|script)\b/i.test(input)) {
            return true;
        }

        return false;
    }

    /**
     * Executes the code command
     */
    async execute(input: string, stateManager: StateManager): Promise<string> {
        try {
            // Check for specific code patterns
            if (/hello world/i.test(input)) {
                return await this.handleHelloWorldRequest(input, stateManager);
            }

            if (/\b(component|react)\b/i.test(input)) {
                return await this.handleComponentRequest(input, stateManager);
            }

            if (/\b(function|method)\b/i.test(input)) {
                return await this.handleFunctionRequest(input, stateManager);
            }

            if (/\b(class|service)\b/i.test(input)) {
                return await this.handleClassRequest(input, stateManager);
            }

            if (/\b(api|endpoint)\b/i.test(input)) {
                return await this.handleAPIRequest(input, stateManager);
            }

            // General code generation
            return await this.handleGeneralCodeRequest(input, stateManager);

        } catch (error) {
            return `❌ Code generation failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Handle Hello World requests
     */
    private async handleHelloWorldRequest(input: string, stateManager: StateManager): Promise<string> {
        if (stateManager.isManifestoMode) {
            // Manifesto Mode: Full compliance features
            const helloWorldCode = `// Hello World with manifesto compliance
console.log("Hello, World!");

// Additional manifesto-compliant features
function greet(name = "World") {
    try {
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid name parameter');
        }
        return \`Hello, \${name}!\`;
    } catch (error) {
        console.error('Greeting error:', error);
        return 'Hello, World!';
    }
}

console.log(greet());
console.log(greet("Developer"));`;

            let response = `🎉 **Hello World Script Ready!**\n\n`;
            response += `**Manifesto-compliant features:**\n`;
            response += `• ✅ Comprehensive error handling\n`;
            response += `• ✅ Input validation\n`;
            response += `• ✅ Proper logging\n`;
            response += `• ✅ JSDoc-ready structure\n\n`;

            response += `**Code:**\n\`\`\`javascript\n${helloWorldCode}\n\`\`\`\n\n`;

            response += `**Next Steps:**\n`;
            response += `• Copy the code to create hello-world.js\n`;
            response += `• Run with: \`node hello-world.js\`\n`;
            response += `• Extend with additional functionality as needed`;

            return response;
        } else {
            // Free Mode: Simple, direct code
            const simpleCode = `console.log("Hello, World!");`;

            let response = `👋 **Hello World**\n\n`;
            response += `**Code:**\n\`\`\`javascript\n${simpleCode}\n\`\`\`\n\n`;
            response += `Run with: \`node hello-world.js\``;

            return response;
        }
    }

    /**
     * Handle React component requests
     */
    private async handleComponentRequest(input: string, stateManager: StateManager): Promise<string> {
        const componentName = this.extractComponentName(input) || 'NewComponent';
        const relevantRules = this.getRelevantManifestoRules(input);

        const componentCode = `import React from 'react';

interface ${componentName}Props {
  // TODO: Define props based on requirements
}

/**
 * ${componentName} component
 * Manifesto compliance: ${relevantRules}
 */
export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  try {
    // TODO: Implement component logic
    return (
      <div>
        <h1>${componentName}</h1>
        {/* TODO: Add component content */}
      </div>
    );
  } catch (error) {
    console.error('${componentName} error:', error);
    return <div>Error loading component</div>;
  }
};

export default ${componentName};`;

        let response = `⚛️ **React Component Generated: ${componentName}**\n\n`;
        response += `**Manifesto Features:**\n`;
        response += `• ✅ TypeScript interfaces\n`;
        response += `• ✅ Error boundary pattern\n`;
        response += `• ✅ JSDoc documentation\n`;
        response += `• ✅ Proper error handling\n\n`;

        response += `**Code:**\n\`\`\`typescript\n${componentCode}\n\`\`\`\n\n`;

        response += `**Next Steps:**\n`;
        response += `• Save as \`${componentName}.tsx\`\n`;
        response += `• Define props interface\n`;
        response += `• Implement component logic\n`;
        response += `• Add unit tests`;

        return response;
    }

    /**
     * Handle function creation requests
     */
    private async handleFunctionRequest(input: string, stateManager: StateManager): Promise<string> {
        const functionName = this.extractFunctionName(input) || 'newFunction';
        const relevantRules = this.getRelevantManifestoRules(input);

        const functionCode = `/**
 * ${functionName} - TODO: Add description
 * Manifesto compliance: ${relevantRules}
 * @param {any} input - Input parameter
 * @returns {Promise<any>} Result
 */
async function ${functionName}(input) {
    try {
        // Input validation
        if (!input) {
            throw new Error('Input is required');
        }

        // TODO: Implement function logic
        const result = processInput(input);
        
        return { success: true, data: result };

    } catch (error) {
        console.error(\`\${${functionName}.name} error:\`, error);
        throw new Error(\`Operation failed: \${error.message}\`);
    }
}

/**
 * Helper function for processing input
 * @param {any} input - Input to process
 * @returns {any} Processed result
 */
function processInput(input) {
    // TODO: Implement processing logic
    return input;
}

module.exports = { ${functionName} };`;

        let response = `🔧 **Function Generated: ${functionName}**\n\n`;
        response += `**Manifesto Features:**\n`;
        response += `• ✅ Comprehensive error handling\n`;
        response += `• ✅ Input validation\n`;
        response += `• ✅ JSDoc documentation\n`;
        response += `• ✅ Proper logging\n`;
        response += `• ✅ Helper function separation\n\n`;

        response += `**Code:**\n\`\`\`javascript\n${functionCode}\n\`\`\`\n\n`;

        response += `**Next Steps:**\n`;
        response += `• Implement the actual logic\n`;
        response += `• Add specific input validation\n`;
        response += `• Write unit tests\n`;
        response += `• Update JSDoc with specific parameters`;

        return response;
    }

    /**
     * Handle class/service creation requests
     */
    private async handleClassRequest(input: string, stateManager: StateManager): Promise<string> {
        const className = this.extractClassName(input) || 'NewService';
        const relevantRules = this.getRelevantManifestoRules(input);

        const classCode = `/**
 * ${className} - TODO: Add description
 * Manifesto compliance: ${relevantRules}
 */
export interface I${className} {
    // TODO: Define interface methods
    execute(): Promise<void>;
}

export class ${className} implements I${className} {
    /**
     * Constructor with dependency injection
     */
    constructor() {
        // TODO: Initialize dependencies
    }

    /**
     * Main service method with comprehensive error handling
     * @returns {Promise<void>}
     */
    async execute(): Promise<void> {
        try {
            // TODO: Implement service logic
            await this.validateInputs();
            await this.performOperation();
            
        } catch (error) {
            console.error(\`\${${className}.name} execution error:\`, error);
            throw new Error(\`Service failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
        }
    }

    /**
     * Validate inputs before processing
     * @private
     */
    private async validateInputs(): Promise<void> {
        // TODO: Add input validation logic
    }

    /**
     * Perform the main operation
     * @private
     */
    private async performOperation(): Promise<void> {
        // TODO: Implement main operation logic
    }
}`;

        let response = `🏗️ **Class Generated: ${className}**\n\n`;
        response += `**Manifesto Features:**\n`;
        response += `• ✅ Interface-based programming\n`;
        response += `• ✅ Dependency injection ready\n`;
        response += `• ✅ Comprehensive error handling\n`;
        response += `• ✅ Input validation\n`;
        response += `• ✅ Separation of concerns\n`;
        response += `• ✅ JSDoc documentation\n\n`;

        response += `**Code:**\n\`\`\`typescript\n${classCode}\n\`\`\`\n\n`;

        response += `**Next Steps:**\n`;
        response += `• Define interface methods\n`;
        response += `• Implement constructor dependencies\n`;
        response += `• Add specific validation logic\n`;
        response += `• Write comprehensive tests`;

        return response;
    }

    /**
     * Handle API endpoint creation requests
     */
    private async handleAPIRequest(input: string, stateManager: StateManager): Promise<string> {
        const endpointName = this.extractEndpointName(input) || 'newEndpoint';
        const relevantRules = this.getRelevantManifestoRules(input);

        const apiCode = `import express from 'express';
import { Request, Response } from 'express';

/**
 * ${endpointName} API endpoint
 * Manifesto compliance: ${relevantRules}
 */

/**
 * Handle ${endpointName} request
 * @param req - Express request object
 * @param res - Express response object
 */
export async function handle${endpointName.charAt(0).toUpperCase() + endpointName.slice(1)}(req: Request, res: Response): Promise<void> {
    try {
        // Input validation
        const validationResult = validateRequest(req);
        if (!validationResult.isValid) {
            res.status(400).json({
                error: 'Invalid request',
                details: validationResult.errors
            });
            return;
        }

        // Process request
        const result = await processRequest(req.body);

        // Return success response
        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(\`\${handle${endpointName.charAt(0).toUpperCase() + endpointName.slice(1)}.name} error:\`, error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Validate incoming request
 * @param req - Express request object
 * @returns Validation result
 */
function validateRequest(req: Request): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // TODO: Add specific validation rules
    if (!req.body) {
        errors.push('Request body is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Process the validated request
 * @param data - Request data
 * @returns Processing result
 */
async function processRequest(data: any): Promise<any> {
    // TODO: Implement business logic
    return { processed: true, data };
}`;

        let response = `🌐 **API Endpoint Generated: ${endpointName}**\n\n`;
        response += `**Manifesto Features:**\n`;
        response += `• ✅ Comprehensive error handling\n`;
        response += `• ✅ Input validation\n`;
        response += `• ✅ Consistent response format\n`;
        response += `• ✅ Proper HTTP status codes\n`;
        response += `• ✅ TypeScript interfaces\n`;
        response += `• ✅ Separation of concerns\n\n`;

        response += `**Code:**\n\`\`\`typescript\n${apiCode}\n\`\`\`\n\n`;

        response += `**Next Steps:**\n`;
        response += `• Add to Express router\n`;
        response += `• Implement validation rules\n`;
        response += `• Add business logic\n`;
        response += `• Write API tests\n`;
        response += `• Add rate limiting`;

        return response;
    }

    /**
     * Handle general code generation requests
     */
    private async handleGeneralCodeRequest(input: string, stateManager: StateManager): Promise<string> {
        if (stateManager.isManifestoMode) {
            // Manifesto Mode: Emphasize compliance
            const relevantRules = this.getRelevantManifestoRules(input);

            let response = `💻 **Ready to create manifesto-compliant code!**\n\n`;
            response += `**Request:** ${input}\n`;
            response += `**Applicable Rules:** ${relevantRules}\n\n`;

            if (stateManager.isCodebaseIndexed) {
                response += `**Context-Aware Generation:**\n`;
                response += `• 📖 I'll analyze your existing codebase patterns\n`;
                response += `• 🔗 I'll understand your imports and dependencies\n`;
                response += `• 🎯 I'll match your coding style and conventions\n`;
                response += `• 🛡️ I'll apply manifesto compliance automatically\n\n`;
            } else {
                response += `**Standard Generation:**\n`;
                response += `• 🛡️ Manifesto-compliant structure\n`;
                response += `• ✅ Error handling and validation\n`;
                response += `• 📚 JSDoc documentation\n`;
                response += `• 🧪 Test-ready code\n\n`;
                response += `💡 **Tip:** Index your codebase for smarter, context-aware code generation!\n\n`;
            }

            response += `**I can create:**\n`;
            response += `• Functions with error handling\n`;
            response += `• Classes with interfaces\n`;
            response += `• React components\n`;
            response += `• API endpoints\n`;
            response += `• Service classes\n`;
            response += `• Utility modules\n\n`;

            response += `**Be more specific:** "Create a UserService class" or "Generate a login API endpoint"`;

            return response;
        } else {
            // Free Mode: Simple, direct approach
            let response = `💻 **Ready to create code!**\n\n`;
            response += `**Request:** ${input}\n\n`;

            if (stateManager.isCodebaseIndexed) {
                response += `**Context-Aware Generation:**\n`;
                response += `• 📖 I'll analyze your existing codebase patterns\n`;
                response += `• 🔗 I'll understand your imports and dependencies\n`;
                response += `• 🎯 I'll match your coding style and conventions\n\n`;
            } else {
                response += `**Standard Generation:**\n`;
                response += `• 🚀 Quick and simple code\n`;
                response += `• 📝 Clean structure\n`;
                response += `• 🎯 Focused on your request\n\n`;
                response += `💡 **Tip:** Index your codebase for smarter, context-aware code generation!\n\n`;
            }

            response += `**I can create:**\n`;
            response += `• Functions\n`;
            response += `• Classes\n`;
            response += `• React components\n`;
            response += `• API endpoints\n`;
            response += `• Service classes\n`;
            response += `• Utility modules\n\n`;

            response += `**Be more specific:** "Create a UserService class" or "Generate a login API endpoint"`;

            return response;
        }
    }

    /**
     * Extract component name from input
     */
    private extractComponentName(input: string): string | null {
        const match = input.match(/(?:component|create|generate)\s+(\w+)/i);
        return match ? match[1] : null;
    }

    /**
     * Extract function name from input
     */
    private extractFunctionName(input: string): string | null {
        const match = input.match(/(?:function|create|generate)\s+(\w+)/i);
        return match ? match[1] : null;
    }

    /**
     * Extract class name from input
     */
    private extractClassName(input: string): string | null {
        const match = input.match(/(?:class|service|create|generate)\s+(\w+)/i);
        return match ? match[1] : null;
    }

    /**
     * Extract endpoint name from input
     */
    private extractEndpointName(input: string): string | null {
        const match = input.match(/(?:api|endpoint|create|generate)\s+(\w+)/i);
        return match ? match[1] : null;
    }

    /**
     * Get relevant manifesto rules based on input
     */
    private getRelevantManifestoRules(input: string): string {
        const rules: string[] = [];
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('error') || lowerInput.includes('exception')) {
            rules.push('comprehensive error handling');
        }
        if (lowerInput.includes('api') || lowerInput.includes('endpoint')) {
            rules.push('<200ms response times');
        }
        if (lowerInput.includes('security') || lowerInput.includes('auth')) {
            rules.push('input validation & security');
        }
        if (lowerInput.includes('test') || lowerInput.includes('testing')) {
            rules.push('unit tests required');
        }

        // Always include core rules
        if (rules.length === 0) {
            return 'error handling, input validation, JSDoc documentation';
        }

        return rules.join(', ');
    }
}
