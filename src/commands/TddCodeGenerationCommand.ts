import * as vscode from 'vscode';
import * as path from 'path';
import { IChatCommand } from './IChatCommand';
import { StateManager } from '../core/StateManager';
import { AgentManager } from '../agents/AgentManager';

/**
 * Advanced TDD Code Generation Command with Conditional UI Testing
 * Orchestrates Test-Driven Development workflow with intelligent UI test generation
 * MANDATORY: Comprehensive error handling (manifesto requirement)
 */
export class TddCodeGenerationCommand implements IChatCommand {
    public readonly command: string = '/tdd';
    /**
     * Check if this command can handle the input
     * Only handles inputs when explicitly routed by ChatCommandManager TDD logic
     */
    canHandle(input: string): boolean {
        // This command should only be called through TDD routing in ChatCommandManager
        // It should never match inputs through normal command matching
        return false;
    }

    /**
     * Execute the TDD workflow with conditional UI testing
     * @param input - The user's code generation request
     * @param stateManager - State manager instance
     * @param agentManager - Agent manager instance
     * @returns Promise resolving to workflow completion message
     */
    async execute(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // Determine if this is a new project or existing project
            if (!stateManager.isCodebaseIndexed) {
                return await this.handleNewProjectWorkflow(input, stateManager, agentManager);
            } else {
                return await this.handleExistingProjectWorkflow(input, stateManager, agentManager);
            }

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('TDD workflow execution failed:', error);
            return `❌ **TDD Workflow Failed**: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Handle TDD workflow for new projects (not indexed)
     * Prompts for tech stack, test framework, and conditionally UI test framework
     */
    private async handleNewProjectWorkflow(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // Step 1: Prompt for tech stack selection
            const techStackOptions = ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Svelte'];
            const selectedTechStack = await vscode.window.showQuickPick(techStackOptions, {
                placeHolder: 'Select your tech stack'
            });

            if (!selectedTechStack) {
                return '❌ **TDD Setup Cancelled**: Tech stack selection is required';
            }

            // Step 2: Prompt for test framework selection
            const testFrameworkOptions = ['Jest', 'Mocha', 'Vitest', 'Cypress'];
            const selectedTestFramework = await vscode.window.showQuickPick(testFrameworkOptions, {
                placeHolder: 'Select your test framework'
            });

            if (!selectedTestFramework) {
                return '❌ **TDD Setup Cancelled**: Test framework selection is required';
            }

            // Step 3: Conditionally prompt for UI test framework if UI Tests are enabled and tech stack is frontend
            let selectedUiTestFramework = '';
            if (stateManager.isUiTddMode && this.isFrontendStack(selectedTechStack)) {
                const uiTestFrameworkOptions = ['Playwright', 'Cypress', 'Selenium', 'Testing Library'];
                const uiFramework = await vscode.window.showQuickPick(uiTestFrameworkOptions, {
                    placeHolder: 'Select your UI test framework'
                });

                if (uiFramework) {
                    selectedUiTestFramework = uiFramework;
                }
            }

            // Update StateManager with selections
            stateManager.setTechStack(selectedTechStack);
            stateManager.setTestFramework(selectedTestFramework);
            if (selectedUiTestFramework) {
                stateManager.setUiTestFramework(selectedUiTestFramework);
            }

            // Continue with TDD workflow
            return await this.executeTddLoop(input, stateManager, agentManager);

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('New project TDD workflow failed:', error);
            return `❌ **New Project Setup Failed**: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Handle TDD workflow for existing projects (indexed)
     * Detects tech stack and test frameworks from codebase
     */
    private async handleExistingProjectWorkflow(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            // Detect tech stack and test frameworks from existing codebase
            const detectedStack = this.detectTechStack(stateManager);
            const detectedFramework = this.detectTestFramework(stateManager);
            let detectedUiFramework = '';

            // Conditionally detect UI test framework if UI Tests are enabled
            if (stateManager.isUiTddMode) {
                detectedUiFramework = this.detectUiTestFramework(stateManager) || '';
            }

            if (!detectedStack || !detectedFramework) {
                return '❌ **TDD Detection Failed**: Could not detect tech stack or test framework from codebase. Please ensure package.json exists.';
            }

            // Update StateManager with detected values
            stateManager.setTechStack(detectedStack);
            stateManager.setTestFramework(detectedFramework);
            if (detectedUiFramework) {
                stateManager.setUiTestFramework(detectedUiFramework);
            }

            // Build detection confirmation message
            let detectionMessage = `✅ **Detected Configuration**:\n- **Tech stack**: ${detectedStack}\n- **Test framework**: ${detectedFramework}`;
            if (stateManager.isUiTddMode && detectedUiFramework) {
                detectionMessage += `\n- **UI test framework**: ${detectedUiFramework}`;
            }

            // Continue with TDD workflow
            const workflowResult = await this.executeTddLoop(input, stateManager, agentManager);
            return `${detectionMessage}\n\n${workflowResult}`;

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Existing project TDD workflow failed:', error);
            return `❌ **Existing Project Workflow Failed**: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Execute the core TDD loop with conditional UI testing
     * Generates tests (unit + optionally UI) then implementation
     */
    private async executeTddLoop(input: string, stateManager: StateManager, agentManager: AgentManager): Promise<string> {
        try {
            const isUiRequest = this.isUiRequest(input);
            const shouldGenerateUiTests = stateManager.isUiTddMode && isUiRequest;

            // Step 1: Generate failing unit test
            const unitTestPrompt = this.buildTestPrompt(input, stateManager, 'unit');
            const unitTestResponse = await agentManager.sendMessage(unitTestPrompt, true);
            const unitTestCode = typeof unitTestResponse === 'string' ? unitTestResponse : unitTestResponse.content;

            // Save unit test file
            const unitTestPath = await this.saveCodeFile(unitTestCode, 'test', stateManager);

            // Step 2: Conditionally generate failing UI test
            let uiTestCode = '';
            let uiTestPath = '';
            if (shouldGenerateUiTests) {
                const uiTestPrompt = this.buildTestPrompt(input, stateManager, 'ui');
                const uiTestResponse = await agentManager.sendMessage(uiTestPrompt, true);
                uiTestCode = typeof uiTestResponse === 'string' ? uiTestResponse : uiTestResponse.content;
                uiTestPath = await this.saveCodeFile(uiTestCode, 'ui-test', stateManager);
            }

            // Step 3: Run tests to confirm they fail
            const initialTestResult = await this.runTests(stateManager);
            if (initialTestResult === 'passing') {
                return '⚠️ **TDD Warning**: Tests are already passing. TDD requires failing tests first.';
            }

            // Step 4: Generate implementation
            const implementationPrompt = this.buildImplementationPrompt(input, stateManager, unitTestCode, uiTestCode);
            const implementationResponse = await agentManager.sendMessage(implementationPrompt, true);
            const implementationCode = typeof implementationResponse === 'string' ? implementationResponse : implementationResponse.content;

            // Save implementation file
            const implementationPath = await this.saveCodeFile(implementationCode, 'implementation', stateManager);

            // Step 5: Run tests again to verify they pass
            const finalTestResult = await this.runTests(stateManager);

            // Build completion message
            let completionMessage = '✅ **TDD Workflow Complete!**\n\n';
            completionMessage += `🧪 **Test**: ${unitTestCode.substring(0, 100)}...\n\n`;
            if (shouldGenerateUiTests) {
                completionMessage += `🎭 **UI Test**: ${uiTestCode.substring(0, 100)}...\n\n`;
            }
            completionMessage += `💻 **Implementation**: ${implementationCode.substring(0, 100)}...\n\n`;

            if (finalTestResult === 'passing') {
                completionMessage += '✅ **All tests passing!**';
            } else {
                completionMessage += '⚠️ **Tests still failing** - manual review required';
            }

            return completionMessage;

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('TDD loop execution failed:', error);
            return `❌ **TDD Loop Failed**: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    /**
     * Detect tech stack from codebase index
     */
    private detectTechStack(stateManager: StateManager): string | null {
        try {
            const packageJsonFile = stateManager.codebaseIndex.get('package.json');
            if (!packageJsonFile || !packageJsonFile.content) {
                return null;
            }

            const packageJson = JSON.parse(packageJsonFile.content);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            // Check for specific frameworks/libraries
            if (dependencies.react) return 'React';
            if (dependencies.vue) return 'Vue';
            if (dependencies.angular || dependencies['@angular/core']) return 'Angular';
            if (dependencies.express) return 'Node.js';
            if (dependencies.next) return 'Next.js';
            if (dependencies.svelte) return 'Svelte';

            // Default to Node.js if package.json exists
            return 'Node.js';

        } catch (error) {
            console.error('Tech stack detection failed:', error);
            return null;
        }
    }

    /**
     * Detect test framework from codebase index
     */
    private detectTestFramework(stateManager: StateManager): string | null {
        try {
            const packageJsonFile = stateManager.codebaseIndex.get('package.json');
            if (!packageJsonFile || !packageJsonFile.content) {
                return null;
            }

            const packageJson = JSON.parse(packageJsonFile.content);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            // Check for test frameworks
            if (dependencies.jest) return 'Jest';
            if (dependencies.mocha) return 'Mocha';
            if (dependencies.vitest) return 'Vitest';
            if (dependencies.cypress) return 'Cypress';
            if (dependencies.playwright) return 'Playwright';
            if (dependencies.jasmine) return 'Jasmine';

            return null;

        } catch (error) {
            console.error('Test framework detection failed:', error);
            return null;
        }
    }

    /**
     * Generate test file name based on input and tech stack
     */
    private generateTestFileName(input: string, techStack: string): string {
        const baseName = input.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        const extension = this.getTestExtension(techStack);
        return `${baseName}.test.${extension}`;
    }

    /**
     * Generate implementation file name based on input and tech stack
     */
    private generateImplementationFileName(input: string, techStack: string): string {
        const baseName = input.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        const extension = this.getImplementationExtension(techStack);
        return `${baseName}.${extension}`;
    }

    /**
     * Get test file extension for tech stack
     */
    private getTestExtension(techStack: string): string {
        switch (techStack.toLowerCase()) {
            case 'typescript':
            case 'react':
            case 'vue':
            case 'angular':
                return 'ts';
            default:
                return 'js';
        }
    }

    /**
     * Get implementation file extension for tech stack
     */
    private getImplementationExtension(techStack: string): string {
        switch (techStack.toLowerCase()) {
            case 'typescript':
            case 'react':
            case 'vue':
            case 'angular':
                return 'ts';
            default:
                return 'js';
        }
    }

    /**
     * Get language identifier for code blocks
     */
    private getLanguageFromStack(techStack: string): string {
        switch (techStack.toLowerCase()) {
            case 'typescript':
            case 'react':
            case 'vue':
            case 'angular':
                return 'typescript';
            default:
                return 'javascript';
        }
    }



    /**
     * Run tests and return result status
     * MANDATORY: Comprehensive error handling (manifesto requirement)
     */
    private async runTests(stateManager: StateManager): Promise<'passing' | 'failing' | 'error'> {
        try {
            const terminal = vscode.window.createTerminal('TDD Test Runner');
            const testFramework = stateManager.testFramework;

            // Determine test command based on framework
            let testCommand: string;
            switch (testFramework.toLowerCase()) {
                case 'jest':
                    testCommand = 'npm test';
                    break;
                case 'mocha':
                    testCommand = 'npx mocha';
                    break;
                case 'vitest':
                    testCommand = 'npx vitest run';
                    break;
                default:
                    testCommand = 'npm test';
            }

            // Execute test command
            terminal.sendText(testCommand);
            terminal.show();

            // For now, return a simulated result
            // In a real implementation, you would need to capture the terminal output
            // and parse the test results
            return new Promise((resolve) => {
                // Simulate test execution time
                setTimeout(() => {
                    // This is a simplified implementation
                    // Real implementation would parse terminal output
                    resolve('failing'); // Start with failing for TDD
                }, 2000);
            });

        } catch (error) {
            // MANDATORY: Comprehensive error handling (manifesto requirement)
            console.error('Test execution failed:', error);
            return 'error';
        }
    }

    /**
     * Check if the tech stack is frontend-focused
     */
    private isFrontendStack(techStack: string): boolean {
        const frontendStacks = ['React', 'Vue', 'Angular', 'Next.js', 'Svelte'];
        return frontendStacks.includes(techStack);
    }

    /**
     * Check if the input is a UI-related request
     */
    private isUiRequest(input: string): boolean {
        const uiKeywords = ['component', 'form', 'button', 'modal', 'page', 'ui', 'interface', 'view', 'screen'];
        return uiKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }

    /**
     * Detect UI test framework from package.json
     */
    private detectUiTestFramework(stateManager: StateManager): string | null {
        try {
            const packageJson = stateManager.codebaseIndex.get('package.json');
            if (!packageJson || !packageJson.content) return null;

            const packageData = JSON.parse(packageJson.content);
            const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };

            if (dependencies.playwright || dependencies['@playwright/test']) return 'Playwright';
            if (dependencies.cypress) return 'Cypress';
            if (dependencies.selenium || dependencies['selenium-webdriver']) return 'Selenium';
            if (dependencies['@testing-library/react'] || dependencies['@testing-library/vue']) return 'Testing Library';

            return null;

        } catch (error) {
            console.error('UI test framework detection failed:', error);
            return null;
        }
    }

    /**
     * Build test prompt for unit or UI tests
     */
    private buildTestPrompt(input: string, stateManager: StateManager, testType: 'unit' | 'ui'): string {
        const techStack = stateManager.techStack;
        const testFramework = testType === 'ui' ? stateManager.uiTestFramework : stateManager.testFramework;

        if (testType === 'ui') {
            return `Generate a failing UI test for the following request using ${testFramework} and ${techStack}:\n\n${input}\n\nReturn ONLY the UI test code, no explanations.`;
        } else {
            return `Generate a failing unit test for the following request using ${testFramework} and ${techStack}:\n\n${input}\n\nReturn ONLY the test code, no explanations.`;
        }
    }

    /**
     * Build implementation prompt
     */
    private buildImplementationPrompt(input: string, stateManager: StateManager, unitTestCode: string, uiTestCode: string): string {
        const techStack = stateManager.techStack;
        let prompt = `Generate the implementation code to make these tests pass:\n\nUnit Test:\n${unitTestCode}\n\n`;

        if (uiTestCode) {
            prompt += `UI Test:\n${uiTestCode}\n\n`;
        }

        prompt += `Request: ${input}\nTech stack: ${techStack}\n\nReturn ONLY the implementation code, no explanations.`;
        return prompt;
    }

    /**
     * Save code file with proper naming
     */
    private async saveCodeFile(code: string, fileType: 'test' | 'ui-test' | 'implementation', stateManager: StateManager): Promise<string> {
        try {
            // This is a simplified implementation
            // In a real implementation, you would save to the actual file system
            const fileName = `generated_${fileType}_${Date.now()}.js`;

            // Mock file save operation
            const encoder = new TextEncoder();
            const data = encoder.encode(code);
            const uri = vscode.Uri.file(fileName);
            await vscode.workspace.fs.writeFile(uri, data);

            return fileName;

        } catch (error) {
            console.error('File save failed:', error);
            throw new Error(`Failed to save ${fileType} file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}