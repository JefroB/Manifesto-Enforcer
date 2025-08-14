import { TddCodeGenerationCommand } from '../TddCodeGenerationCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';
import * as vscode from 'vscode';

/**
 * Test suite for TddCodeGenerationCommand
 * These tests define the TDD enforcement workflow behavior
 * MANDATORY: All tests must fail initially as implementation doesn't exist yet
 */
describe('TddCodeGenerationCommand', () => {
    let command: TddCodeGenerationCommand;
    let mockStateManager: any;
    let mockAgentManager: any;
    let mockTerminal: any;

    beforeEach(() => {
        // Mock StateManager
        mockStateManager = {
            isTddMode: true,
            isUiTddMode: false, // New property for UI testing
            isCodebaseIndexed: false,
            codebaseIndex: new Map(),
            techStack: '',
            testFramework: '',
            uiTestFramework: '', // New property for UI test framework
            setTechStack: jest.fn(),
            setTestFramework: jest.fn(),
            setUiTestFramework: jest.fn(), // New method for UI test framework
            addToConversationHistory: jest.fn()
        } as any;

        // Mock AgentManager
        mockAgentManager = {
            sendMessage: jest.fn().mockResolvedValue({
                id: 'test-message',
                role: 'assistant',
                content: 'Mock AI response',
                timestamp: new Date()
            })
        } as any;

        // Mock VSCode terminal
        mockTerminal = {
            sendText: jest.fn(),
            show: jest.fn(),
            dispose: jest.fn()
        };

        // Mock vscode APIs
        (vscode.window.createTerminal as jest.Mock) = jest.fn().mockReturnValue(mockTerminal);
        (vscode.window.showQuickPick as jest.Mock) = jest.fn();

        // Mock workspace APIs
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: [{ uri: { fsPath: '/mock/workspace' } }],
            writable: true
        });

        Object.defineProperty(vscode.workspace, 'fs', {
            value: {
                writeFile: jest.fn().mockResolvedValue(undefined),
                createDirectory: jest.fn().mockResolvedValue(undefined)
            },
            writable: true
        });

        // Create command instance
        command = new TddCodeGenerationCommand();

        // Mock the runTests method to avoid real terminal execution
        jest.spyOn(command as any, 'runTests').mockResolvedValue('failing');
    });

    describe('New Project Workflow', () => {
        test('should prompt for tech stack and test framework selection - UI Tests ON', async () => {
            try {
                // Setup: New project (not indexed) with UI Tests enabled
                mockStateManager.isCodebaseIndexed = false;
                mockStateManager.isTddMode = true;
                mockStateManager.isUiTddMode = true; // UI Tests enabled

                // Mock user selections
                (vscode.window.showQuickPick as jest.Mock)
                    .mockResolvedValueOnce('React') // Tech stack selection
                    .mockResolvedValueOnce('Jest') // Test framework selection
                    .mockResolvedValueOnce('Playwright'); // UI framework selection

                // Mock AI responses for the full TDD workflow
                mockAgentManager.sendMessage
                    .mockResolvedValueOnce({ content: 'test("button component", () => { expect(Button).toBeDefined(); });' })
                    .mockResolvedValueOnce({ content: 'const Button = () => <button>Click me</button>; export default Button;' });

                // Mock file operations - now returns vscode.Uri instead of string
                const mockUri = { fsPath: '/mock/path/file.js' } as any;
                jest.spyOn(command as any, 'saveCodeFile').mockResolvedValue(mockUri);

                // Mock test execution to pass after implementation
                jest.spyOn(command as any, 'runTests')
                    .mockResolvedValueOnce('failing')  // Initial test fails (expected)
                    .mockResolvedValueOnce('passing'); // After implementation, test passes

                // Execute command
                const response = await command.execute(
                    'create a button component',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert tech stack, test framework, and UI framework prompts
                expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(3);
                expect(vscode.window.showQuickPick).toHaveBeenNthCalledWith(1,
                    expect.arrayContaining(['React', 'Vue', 'Angular', 'Node.js', 'Express']),
                    expect.objectContaining({ placeHolder: expect.stringContaining('tech stack') })
                );
                expect(vscode.window.showQuickPick).toHaveBeenNthCalledWith(2,
                    expect.arrayContaining(['Jest', 'Mocha', 'Vitest', 'Cypress']),
                    expect.objectContaining({ placeHolder: expect.stringContaining('test framework') })
                );
                expect(vscode.window.showQuickPick).toHaveBeenNthCalledWith(3,
                    expect.arrayContaining(['Playwright', 'Cypress', 'Selenium']),
                    expect.objectContaining({ placeHolder: expect.stringContaining('UI test framework') })
                );

                // Assert StateManager updates
                expect(mockStateManager.setTechStack).toHaveBeenCalledWith('React');
                expect(mockStateManager.setTestFramework).toHaveBeenCalledWith('Jest');
                expect(mockStateManager.setUiTestFramework).toHaveBeenCalledWith('Playwright');

                // Assert successful completion
                expect(response).toContain('TDD Workflow Complete');

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('New project workflow test (UI Tests ON) failed:', error);
                throw error;
            }
        });

        test('should prompt for tech stack and test framework selection - UI Tests OFF', async () => {
            try {
                // Setup: New project (not indexed) with UI Tests disabled
                mockStateManager.isCodebaseIndexed = false;
                mockStateManager.isTddMode = true;
                mockStateManager.isUiTddMode = false; // UI Tests disabled

                // Mock user selections
                (vscode.window.showQuickPick as jest.Mock)
                    .mockResolvedValueOnce('React') // Tech stack selection
                    .mockResolvedValueOnce('Jest'); // Test framework selection

                // Mock AI responses for the full TDD workflow
                mockAgentManager.sendMessage
                    .mockResolvedValueOnce({ content: 'test("button component", () => { expect(Button).toBeDefined(); });' })
                    .mockResolvedValueOnce({ content: 'const Button = () => <button>Click me</button>; export default Button;' });

                // Mock file operations - now returns vscode.Uri instead of string
                const mockUri = { fsPath: '/mock/path/file.js' } as any;
                jest.spyOn(command as any, 'saveCodeFile').mockResolvedValue(mockUri);

                // Mock test execution to pass after implementation
                jest.spyOn(command as any, 'runTests')
                    .mockResolvedValueOnce('failing')  // Initial test fails (expected)
                    .mockResolvedValueOnce('passing'); // After implementation, test passes

                // Execute command
                const response = await command.execute(
                    'create a button component',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert only tech stack and test framework prompts (no UI framework)
                expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(2);
                expect(vscode.window.showQuickPick).toHaveBeenNthCalledWith(1,
                    expect.arrayContaining(['React', 'Vue', 'Angular', 'Node.js', 'Express']),
                    expect.objectContaining({ placeHolder: expect.stringContaining('tech stack') })
                );
                expect(vscode.window.showQuickPick).toHaveBeenNthCalledWith(2,
                    expect.arrayContaining(['Jest', 'Mocha', 'Vitest', 'Cypress']),
                    expect.objectContaining({ placeHolder: expect.stringContaining('test framework') })
                );

                // Assert StateManager updates (no UI framework)
                expect(mockStateManager.setTechStack).toHaveBeenCalledWith('React');
                expect(mockStateManager.setTestFramework).toHaveBeenCalledWith('Jest');
                expect(mockStateManager.setUiTestFramework).not.toHaveBeenCalled();

                // Assert successful completion
                expect(response).toContain('TDD Workflow Complete');

            } catch (error) {
                // MANDATORY: Comprehensive error handling (manifesto requirement)
                console.error('New project workflow test (UI Tests OFF) failed:', error);
                throw error;
            }
        });

        test('should handle user cancellation during tech stack selection', async () => {
            try {
                // Setup: User cancels tech stack selection
                mockStateManager.isCodebaseIndexed = false;
                (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);

                const response = await command.execute(
                    'create a button component',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert graceful handling
                expect(response).toContain('Cancelled');
                expect(mockStateManager.setTechStack).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Cancellation handling test failed:', error);
                throw error;
            }
        });
    });

    describe('Existing Project Workflow', () => {
        test('should detect tech stack and test frameworks - UI Tests ON', async () => {
            try {
                // Setup: Existing project with package.json including UI testing
                mockStateManager.isCodebaseIndexed = true;
                mockStateManager.isUiTddMode = true; // UI Tests enabled

                // Mock codebase index with package.json for detection
                const mockPackageJson = {
                    content: JSON.stringify({
                        dependencies: { express: '^4.18.0' },
                        devDependencies: {
                            jest: '^29.0.0',
                            cypress: '^12.0.0'
                        }
                    }),
                    path: 'package.json',
                    size: 100,
                    lastModified: new Date()
                };
                mockStateManager.codebaseIndex = new Map([['package.json', mockPackageJson]]);

                // Mock AI responses for the full TDD workflow
                mockAgentManager.sendMessage
                    .mockResolvedValueOnce({ content: 'test("user service", () => { expect(UserService).toBeDefined(); });' })
                    .mockResolvedValueOnce({ content: 'class UserService { constructor() {} }' });

                // Mock file operations - now returns vscode.Uri instead of string
                const mockUri = { fsPath: '/mock/path/file.js' } as any;
                jest.spyOn(command as any, 'saveCodeFile').mockResolvedValue(mockUri);

                // Mock test execution to pass after implementation
                jest.spyOn(command as any, 'runTests')
                    .mockResolvedValueOnce('failing')  // Initial test fails (expected)
                    .mockResolvedValueOnce('passing'); // After implementation, test passes

                const response = await command.execute(
                    'create a user service',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert automatic detection includes UI framework
                expect(response).toContain('Tech stack**: Node.js');
                expect(response).toContain('Test framework**: Jest');
                expect(response).toContain('UI test framework**: Cypress');
                expect(vscode.window.showQuickPick).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Existing project detection test (UI Tests ON) failed:', error);
                throw error;
            }
        });

        test('should detect tech stack and test frameworks - UI Tests OFF', async () => {
            try {
                // Setup: Existing project with package.json including UI testing
                mockStateManager.isCodebaseIndexed = true;
                mockStateManager.isUiTddMode = false; // UI Tests disabled

                // Mock codebase index with package.json for detection
                const mockPackageJson = {
                    content: JSON.stringify({
                        dependencies: { express: '^4.18.0' },
                        devDependencies: {
                            jest: '^29.0.0',
                            cypress: '^12.0.0'
                        }
                    }),
                    path: 'package.json',
                    size: 100,
                    lastModified: new Date()
                };
                mockStateManager.codebaseIndex = new Map([['package.json', mockPackageJson]]);

                // Mock AI responses for the full TDD workflow
                mockAgentManager.sendMessage
                    .mockResolvedValueOnce({ content: 'test("user service", () => { expect(UserService).toBeDefined(); });' })
                    .mockResolvedValueOnce({ content: 'class UserService { constructor() {} }' });

                // Mock file operations - now returns vscode.Uri instead of string
                const mockUri = { fsPath: '/mock/path/file.js' } as any;
                jest.spyOn(command as any, 'saveCodeFile').mockResolvedValue(mockUri);

                // Mock test execution to pass after implementation
                jest.spyOn(command as any, 'runTests')
                    .mockResolvedValueOnce('failing')  // Initial test fails (expected)
                    .mockResolvedValueOnce('passing'); // After implementation, test passes

                const response = await command.execute(
                    'create a user service',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert automatic detection excludes UI framework when disabled
                expect(response).toContain('Tech stack**: Node.js');
                expect(response).toContain('Test framework**: Jest');
                expect(response).not.toContain('UI test framework');
                expect(response).not.toContain('Cypress');
                expect(vscode.window.showQuickPick).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Existing project detection test (UI Tests OFF) failed:', error);
                throw error;
            }
        });

    });

    describe('Core TDD Loop for UI Component', () => {
        test('should generate unit and UI tests when UI Tests ON', async () => {
            try {
                // Setup: UI request with UI Tests enabled
                mockStateManager.isCodebaseIndexed = true;
                mockStateManager.isTddMode = true;
                mockStateManager.isUiTddMode = true; // UI Tests enabled
                mockStateManager.techStack = 'React';
                mockStateManager.testFramework = 'Jest';
                mockStateManager.uiTestFramework = 'Playwright';

                // Mock codebase index with package.json for detection
                const mockPackageJson = {
                    content: JSON.stringify({
                        dependencies: { react: '^18.0.0' },
                        devDependencies: {
                            jest: '^29.0.0',
                            playwright: '^1.30.0'
                        }
                    }),
                    path: 'package.json',
                    size: 100,
                    lastModified: new Date()
                };
                mockStateManager.codebaseIndex = new Map([['package.json', mockPackageJson]]);

                // Mock AI responses for unit test, UI test, and implementation
                const unitTest = 'test("login form renders", () => { expect(LoginForm).toBeDefined(); });';
                const uiTest = 'test("login form interaction", async ({ page }) => { await page.click("[data-testid=login-button]"); });';
                const implementation = 'const LoginForm = () => <form><button data-testid="login-button">Login</button></form>;';

                mockAgentManager.sendMessage
                    .mockResolvedValueOnce({ content: unitTest })     // First call: unit test
                    .mockResolvedValueOnce({ content: uiTest })       // Second call: UI test
                    .mockResolvedValueOnce({ content: implementation }); // Third call: implementation

                // Mock file operations - now returns vscode.Uri instead of string
                const mockUri = { fsPath: '/mock/path/file.js' } as any;
                jest.spyOn(command as any, 'saveCodeFile').mockResolvedValue(mockUri);

                // Mock test execution results
                jest.spyOn(command as any, 'runTests')
                    .mockResolvedValueOnce('failing')  // Initial tests fail
                    .mockResolvedValueOnce('passing'); // After implementation, tests pass

                const response = await command.execute(
                    'create a login form',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert successful completion
                expect(response).toContain('TDD Workflow Complete');

                // Assert that unit test was generated
                expect(response).toContain('🧪 **Unit Test**:');

                // Assert that UI test was generated (since UI Tests are ON)
                expect(response).toContain('🎭 **UI Test**:');

                // Assert that implementation was generated
                expect(response).toContain('💻 **Implementation**:');

                // Assert that all tests are passing
                expect(response).toContain('All tests passing');

            } catch (error) {
                console.error('UI TDD loop test (UI Tests ON) failed:', error);
                throw error;
            }
        });

        test('should generate only unit tests when UI Tests OFF', async () => {
            try {
                // Setup: UI request with UI Tests disabled
                mockStateManager.isCodebaseIndexed = true;
                mockStateManager.isTddMode = true;
                mockStateManager.isUiTddMode = false; // UI Tests disabled
                mockStateManager.techStack = 'React';
                mockStateManager.testFramework = 'Jest';

                // Mock codebase index with package.json for detection
                const mockPackageJson = {
                    content: JSON.stringify({
                        dependencies: { react: '^18.0.0' },
                        devDependencies: {
                            jest: '^29.0.0',
                            playwright: '^1.30.0'
                        }
                    }),
                    path: 'package.json',
                    size: 100,
                    lastModified: new Date()
                };
                mockStateManager.codebaseIndex = new Map([['package.json', mockPackageJson]]);

                // Mock AI responses for unit test and implementation only
                const unitTest = 'test("login form renders", () => { expect(LoginForm).toBeDefined(); });';
                const implementation = 'const LoginForm = () => <form><button data-testid="login-button">Login</button></form>;';

                mockAgentManager.sendMessage
                    .mockResolvedValueOnce({ content: unitTest })     // First call: unit test
                    .mockResolvedValueOnce({ content: implementation }); // Second call: implementation

                // Mock file operations - now returns vscode.Uri instead of string
                const mockUri = { fsPath: '/mock/path/file.js' } as any;
                jest.spyOn(command as any, 'saveCodeFile').mockResolvedValue(mockUri);

                // Mock test execution results
                jest.spyOn(command as any, 'runTests')
                    .mockResolvedValueOnce('failing')  // Initial test fails
                    .mockResolvedValueOnce('passing'); // After implementation, test passes

                const response = await command.execute(
                    'create a login form',
                    mockStateManager,
                    mockAgentManager
                );

                // Assert successful completion
                expect(response).toContain('TDD Workflow Complete');

                // Assert that unit test was generated
                expect(response).toContain('🧪 **Unit Test**:');

                // Assert that UI test was NOT generated (since UI Tests are OFF)
                expect(response).not.toContain('🎭 **UI Test**:');

                // Assert that implementation was generated
                expect(response).toContain('💻 **Implementation**:');

                // Assert that all tests are passing
                expect(response).toContain('All tests passing');

            } catch (error) {
                console.error('UI TDD loop test (UI Tests OFF) failed:', error);
                throw error;
            }
        });

    });
});
