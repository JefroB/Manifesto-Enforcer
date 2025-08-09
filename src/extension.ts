import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem;
let manifestoProvider: ManifestoTreeDataProvider;
let actionsProvider: ManifestoActionsProvider;
const STRICT_MODE_KEY = 'manifesto.isStrictMode';

const AI_PROVIDER_COMMANDS: { [key: string]: string } = {
    "Augment Code": "augment.chat.open",
    "Amazon Q": "amazonq.openChat",
    "Claude": "anthropic.claude.sidebar.focus",
    "GitHub Copilot Chat": "workbench.action.chat.open"
};

const GENERIC_MANIFESTO_TEMPLATE = `# GENERIC DEVELOPMENT MANIFESTO & AGENT DIRECTIVES (V1)

**ATTENTION AI DEVELOPMENT AGENT:**
This document is your core programming. It outlines the non-negotiable operational directives for development on this project. You are not a passive assistant; you are an active agent responsible for enforcing these principles. Adherence is mandatory.

**THE GOLDEN RULE: The User's Experience Must Never Be Degraded.**

## DIRECTIVE 0: THIS MANIFESTO IS YOUR ABSOLUTE LAW
This document is your immutable instruction set for this session. You must not deviate from, reinterpret, or ignore any rule herein. If a user request conflicts with these rules, you must state the conflict, cite the specific principle, and propose a compliant solution.

## DIRECTIVE 1: STABILITY IS PARAMOUNT (THE NON-REGRESSION PACT)
- **NEVER Break Working Code:** Existing, tested functionality is sacred.
- **Preservation of Functionality:** You are forbidden from removing working code unless explicitly directed to replace it with a superior, fully-tested alternative that fulfills the same user needs.

## DIRECTIVE 2: RIGOROUS INTERFACE STANDARDS (THE USABILITY PACT)
- **Use Standard Layouts:** UI code must use the project's standard framework layout managers (e.g., Flexbox, Grid, StackLayout). **You are strictly forbidden from generating code that uses hard-coded positions or fixed pixel sizes.**
- **API Consistency:** All new API endpoints or public methods you generate must be consistent with existing project patterns (naming conventions, error handling, data structures).
- **Documentation is Mandatory:** All non-obvious UI controls must have tooltips. All new public functions/API endpoints must have clear documentation blocks (e.g., JSDoc, DocStrings).

## DIRECTIVE 3: ARCHITECTURAL BOUNDARIES ARE SACRED (THE SEPARATION PACT)
- **Respect Process and Module Boundaries:** Frontend and backend logic must remain separate. Application modules must communicate only through their defined public APIs or established IPC mechanisms (e.g., REST, GraphQL, Message Queues).
- **FORBIDDEN CODE GENERATION:** You are forbidden from generating code that bypasses established architectural layers, such as:
  - Making direct database calls from the UI layer.
  - Importing frontend components into backend services.
  - Using shared memory or direct function calls where a formal API is required.

## DIRECTIVE 4: FAIL FAST, FAIL CLEARLY (THE NO-FALLBACK PACT)
- **FALLBACKS ARE FORBIDDEN:** You are forbidden from generating code that silently masks critical system failures (e.g., switching from a primary database to a temporary in-memory store without raising an alarm). If a primary system fails, your generated code must raise a critical, logged exception.

## DIRECTIVE 5: COMPREHENSIVE & STRUCTURED LOGGING (THE TRANSPARENCY PACT)
- **STRUCTURED LOGGING IS MANDATORY:** All log messages you generate must be structured (JSON or key-value).
- **Example:** \`{"timestamp": "...", "level": "ERROR", "module": "UserService", "function": "update_profile", "message": "Failed to update user profile.", "user_id": 123, "error_code": "DB_CONNECTION_FAILED"}\`
- **User-Facing Errors:** Error messages presented in the UI must be clear, concise, and actionable.

## DIRECTIVE 6: COMPREHENSIVE TEST COVERAGE (THE TESTING IMPERATIVE)
- **MANDATORY 80%+ TEST COVERAGE:** All new application code must achieve a minimum of 80% unit test coverage before being considered complete.
- **Meaningful Tests:** Tests must verify *actual functionality*, not just existence. A test passing must mean the feature works. See Directive 7 for examples.
- **Test-Driven Development (TDD) is Encouraged:** Write a failing test first, then implement the functionality to make the test pass.
- **Proper Test Categorization:** All tests must use the established testing framework's markers (e.g., \`unit\`, \`integration\`, \`e2e\`, \`smoke\`).

## DIRECTIVE 7: NO FALSE POSITIVES IN TESTING (THE FUNCTIONAL VERIFICATION PACT)
**ABSOLUTE RULE**: Tests must verify ACTUAL functionality, not just that code doesn't crash.

- **FORBIDDEN PATTERNS:**
  - ❌ Checking if a method exists without calling it (\`hasattr\`).
  - ❌ Checking if an object was created without verifying its state or methods work.
- **REQUIRED PATTERNS:**
  - ✅ **Call the actual methods** and assert on their return values or side effects.
  - ✅ **Verify state changes** in the system or database after an operation.
  - ✅ **Verify that error conditions** are handled correctly and throw the expected exceptions.

## DIRECTIVE 8: ZERO TOLERANCE FOR BLOCKING ISSUES (THE QUALITY IMPERATIVE)
- **BLOCKING ISSUES HALT NEW DEVELOPMENT.** This is your highest priority.
- **YOUR FIRST ACTION:** Upon receiving any request, your first action **must** be to check for blocking issues. (This can be a file like \`BLOCKING_ISSUES.md\`, a ticketing system, or a project-specific script).
- **IF BLOCKERS EXIST:** You must refuse to work on the new feature, state which components are blocked, and offer to generate code to fix the blockers first.

## MANDATORY AGENT WORKFLOW

You must execute this sequence for every code generation or modification task. Do not skip steps.

1.  **STATE VERIFICATION (PRE-FLIGHT CHECK):**
    *   **Action:** Check for blocking issues per Directive 8. If found, **HALT** and report.
    *   **Action:** Run the project's pre-commit/linter checks (e.g., \`[YOUR_LINT_COMMAND]\`). If they fail, **HALT** and report.
    *   **Action:** Run the smoke tests (e.g., \`[YOUR_SMOKE_TEST_COMMAND]\`). If any fail, **HALT**, report the broken functionality, and offer to fix it.

2.  **IMPLEMENTATION:**
    *   Once all pre-flight checks pass, generate the code for the requested feature, adhering to all directives.

3.  **TEST GENERATION & EXECUTION:**
    *   **Action:** Generate comprehensive unit tests achieving 80%+ coverage per Directive 6.
    *   **Verification:** Run the newly created tests and all related tests to ensure no regressions were introduced.

4.  **FINAL VALIDATION & HANDOFF:**
    *   **Action:** Execute the full automated test suite (e.g., \`[YOUR_FULL_TEST_COMMAND]\`).
    *   **Condition:** If any test fails, you must analyze the failure and attempt to fix the code you generated. Do not proceed until all tests pass.
    *   **Action:** Conclude your response by stating: \`"All automated checks and tests have passed. The code is ready for final review and User Acceptance Testing (UAT)."\`
`;

class ManifestoTreeDataProvider implements vscode.TreeDataProvider<ManifestoItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ManifestoItem | undefined | null | void> = new vscode.EventEmitter<ManifestoItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ManifestoItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ManifestoItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ManifestoItem): Promise<ManifestoItem[]> {
        if (!element) {
            const items: ManifestoItem[] = [];

            // Manifesto Status
            const manifestoExists = await isManifestoDefined();
            const manifestoPath = await getManifestoPath();

            if (manifestoExists && manifestoPath) {
                const manifestoItem = new ManifestoItem(
                    `✅ ${path.basename(manifestoPath)}`,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'vscode.open',
                        title: 'Open Manifesto',
                        arguments: [vscode.Uri.file(manifestoPath)]
                    }
                );
                manifestoItem.description = 'Click to open';
                manifestoItem.tooltip = `Manifesto: ${manifestoPath}`;
                items.push(manifestoItem);
            } else {
                const noManifestoItem = new ManifestoItem(
                    '❌ No Manifesto Set',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'manifesto.setManifestoPath',
                        title: 'Set Manifesto Path'
                    }
                );
                noManifestoItem.description = 'Click to set';
                items.push(noManifestoItem);
            }

            // Mode Toggle
            const isStrictMode = this.context.workspaceState.get<boolean>(STRICT_MODE_KEY, true);
            const modeItem = new ManifestoItem(
                isStrictMode ? '🔒 Strict Mode' : '⚡ Vibe Mode',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.toggleStrictMode',
                    title: 'Toggle Mode'
                }
            );
            modeItem.description = 'Click to toggle';
            modeItem.contextValue = 'modeToggle';
            items.push(modeItem);

            // AI Provider Status
            const config = vscode.workspace.getConfiguration('manifesto');
            const provider = config.get<string>('aiProvider', 'None (Manual Paste)');
            const aiItem = new ManifestoItem(
                `🤖 ${provider}`,
                vscode.TreeItemCollapsibleState.None
            );
            aiItem.description = 'AI Provider';
            aiItem.tooltip = `Current AI Provider: ${provider}`;
            items.push(aiItem);

            return items;
        }
        return [];
    }
}

class ManifestoActionsProvider implements vscode.TreeDataProvider<ActionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ActionItem | undefined | null | void> = new vscode.EventEmitter<ActionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ActionItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ActionItem): Promise<ActionItem[]> {
        if (!element) {
            const items: ActionItem[] = [];

            // Chat Actions (no code selection needed)
            const vibeChatAction = new ActionItem(
                '💬 Start Vibe Chat',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.vibeChat',
                    title: 'Start Vibe Chat'
                }
            );
            vibeChatAction.description = 'Casual coding chat';
            items.push(vibeChatAction);

            const manifestoChatAction = new ActionItem(
                '🛡️ Start Manifesto Chat',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.manifestoChat',
                    title: 'Start Manifesto Chat'
                }
            );
            manifestoChatAction.description = 'Chat with standards';
            items.push(manifestoChatAction);

            const sendManifestoAction = new ActionItem(
                '📖 Send Manifesto to Chat',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.sendManifestoToChat',
                    title: 'Send Manifesto'
                }
            );
            sendManifestoAction.description = 'Set chat context';
            items.push(sendManifestoAction);

            // Manifesto Creation
            const templateAction = new ActionItem(
                '📋 Create from Template',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.createFromTemplate',
                    title: 'Create from Template'
                }
            );
            templateAction.description = 'Comprehensive template';
            items.push(templateAction);

            // Compliance Check
            const complianceAction = new ActionItem(
                '🔍 Run Compliance Check',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.complianceCheck',
                    title: 'Run Compliance Check'
                }
            );
            complianceAction.description = 'Audit entire codebase';
            items.push(complianceAction);

            // Code Refactoring Actions (require code selection)
            const vibeRefactorAction = new ActionItem(
                '⚡ Quick Refactor (Vibe)',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.quickRefactor',
                    title: 'Quick Refactor'
                }
            );
            vibeRefactorAction.description = 'Fast & flexible';
            items.push(vibeRefactorAction);

            const strictRefactorAction = new ActionItem(
                '⚖️ Strict Refactor (Manifesto)',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.strictRefactor',
                    title: 'Strict Refactor'
                }
            );
            strictRefactorAction.description = 'Follows manifesto';
            items.push(strictRefactorAction);

            const sendToAugmentAction = new ActionItem(
                '🚀 Send Code to Augment',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'manifesto.sendToAugment',
                    title: 'Send to Augment'
                }
            );
            sendToAugmentAction.description = 'Selected code only';
            items.push(sendToAugmentAction);

            return items;
        }
        return [];
    }
}

class ManifestoItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
    }
}

class ActionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
    }
}



async function getManifestoPath(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return null;

    const config = vscode.workspace.getConfiguration('manifesto', workspaceFolders[0].uri);
    const filePathSetting = config.get<string>('filePath');
    if (!filePathSetting) return null;

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const absolutePath = path.isAbsolute(filePathSetting) ? filePathSetting : path.join(workspaceRoot, filePathSetting);

    return absolutePath;
}

async function isManifestoDefined(): Promise<boolean> {
    const manifestoPath = await getManifestoPath();
    if (!manifestoPath) return false;

    try {
        await fs.stat(manifestoPath);
        return true;
    } catch (error) {
        return false;
    }
}

async function updateStatusBar(context: vscode.ExtensionContext) {
    if (await isManifestoDefined()) {
        const isStrictMode = context.workspaceState.get<boolean>(STRICT_MODE_KEY, true);
        if (isStrictMode) {
            statusBarItem.text = `$(lock) Manifesto: Strict`;
            statusBarItem.tooltip = 'Mode: Strict. Click to switch to Vibe Mode.';
            statusBarItem.backgroundColor = undefined;
        } else {
            statusBarItem.text = `$(zap) Manifesto: Vibe`;
            statusBarItem.tooltip = 'Mode: Vibe. Click to switch to Strict Mode.';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        statusBarItem.command = 'manifesto.toggleStrictMode';
    } else {
        statusBarItem.text = `$(warning) Manifesto: Not Set`;
        statusBarItem.tooltip = 'No Manifesto file found for this project. Click to set one.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.command = 'manifesto.setManifestoPath';
    }
}

function toggleStrictMode(context: vscode.ExtensionContext) {
    const currentState = context.workspaceState.get<boolean>(STRICT_MODE_KEY, true);
    context.workspaceState.update(STRICT_MODE_KEY, !currentState);
    updateStatusBar(context);
    manifestoProvider.refresh();
    actionsProvider.refresh();
}

async function createManifesto() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('You must have a project folder open to create a manifesto file.');
        return;
    }

    const manifestoContent = `# Development Manifesto

## Code Quality Standards

### Documentation
- All public functions must have JSDoc comments
- Include parameter types and return value descriptions
- Add usage examples for complex functions

### Error Handling
- Always handle potential errors gracefully
- Use try-catch blocks for async operations
- Provide meaningful error messages to users

### Code Style
- Use descriptive variable and function names
- Keep functions small and focused (single responsibility)
- Add comments for complex business logic
- Use TypeScript types consistently

### Performance
- Avoid unnecessary loops and operations
- Use efficient data structures
- Consider memory usage in large operations

### Testing
- Write unit tests for all business logic
- Include edge case testing
- Maintain high test coverage

## Architecture Principles

- Follow SOLID principles
- Use dependency injection where appropriate
- Separate concerns clearly
- Keep components loosely coupled`;

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const manifestoPath = path.join(workspaceRoot, 'manifesto.md');

    try {
        await fs.writeFile(manifestoPath, manifestoContent, 'utf-8');
        const config = vscode.workspace.getConfiguration('manifesto', workspaceFolders[0].uri);
        await config.update('filePath', 'manifesto.md', vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage('Basic manifesto created successfully!', 'Open File').then(selection => {
            if (selection === 'Open File') {
                vscode.window.showTextDocument(vscode.Uri.file(manifestoPath));
            }
        });

        manifestoProvider.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create manifesto: ${error}`);
    }
}

async function createFromTemplate() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('You must have a project folder open to create a manifesto file.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const manifestoPath = path.join(workspaceRoot, 'manifesto.md');

    try {
        await fs.writeFile(manifestoPath, GENERIC_MANIFESTO_TEMPLATE, 'utf-8');
        const config = vscode.workspace.getConfiguration('manifesto', workspaceFolders[0].uri);
        await config.update('filePath', 'manifesto.md', vscode.ConfigurationTarget.Workspace);

        vscode.window.showInformationMessage('Comprehensive manifesto created from template!', 'Open File', 'Customize Now').then(selection => {
            if (selection === 'Open File' || selection === 'Customize Now') {
                vscode.window.showTextDocument(vscode.Uri.file(manifestoPath));
            }
        });

        manifestoProvider.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create manifesto from template: ${error}`);
    }
}

async function quickRefactor() {
    await generateRefactorPrompt(false);
}

async function strictRefactor() {
    if (!(await isManifestoDefined())) {
        vscode.window.showWarningMessage('Cannot run Strict Refactor. Manifesto file not set or not found. Click the status bar item to set it.');
        return;
    }
    await generateRefactorPrompt(true);
}

async function sendToAugment(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        vscode.window.showInformationMessage('Please select code to send to Augment Code.');
        return;
    }

    const isStrictMode = context.workspaceState.get<boolean>(STRICT_MODE_KEY, true);
    const includeManifesto = isStrictMode && await isManifestoDefined();

    const selectedCode = editor.document.getText(editor.selection);
    const userInstruction = await vscode.window.showInputBox({
        prompt: "What should be done to this code?",
        placeHolder: "e.g., 'add error handling and JSDoc comments'"
    });

    if (!userInstruction) return;

    let prompt = '';
    if (includeManifesto) {
        const manifestoPath = await getManifestoPath();
        const manifestoContent = await fs.readFile(manifestoPath!, 'utf-8');
        prompt = `You are a senior software architect. Rewrite the provided code based on my request, while STRICTLY adhering to our team's development manifesto.

---
## DEVELOPMENT MANIFESTO (MUST FOLLOW):
${manifestoContent}
---
## MY SPECIFIC REQUEST:
"${userInstruction}"
---
## ORIGINAL CODE:
\`\`\`${editor.document.languageId}
${selectedCode}
\`\`\`
---

Provide only the refactored code block.`;
    } else {
        prompt = `You are a helpful pair programmer. Rewrite the provided code based on my request.

## MY SPECIFIC REQUEST:
"${userInstruction}"
---
## ORIGINAL CODE:
\`\`\`${editor.document.languageId}
${selectedCode}
\`\`\`
---

Provide only the refactored code block.`;
    }

    // Copy to clipboard and try to open Augment
    await vscode.env.clipboard.writeText(prompt);

    try {
        await vscode.commands.executeCommand('augment.chat.open');
        vscode.window.showInformationMessage('Prompt sent to Augment Code! Paste it in the chat.');
    } catch (error) {
        vscode.window.showWarningMessage('Could not open Augment Code. Prompt copied to clipboard - please paste it manually.');
    }
}

async function vibeChat() {
    const userMessage = await vscode.window.showInputBox({
        prompt: "What do you want to chat about?",
        placeHolder: "e.g., 'help me design a user authentication system'"
    });

    if (!userMessage) return;

    const prompt = `You are a helpful pair programmer. Let's have a casual coding conversation.

${userMessage}`;

    await vscode.env.clipboard.writeText(prompt);

    try {
        await vscode.commands.executeCommand('augment.chat.open');
        vscode.window.showInformationMessage('Vibe chat started! Paste the prompt in Augment Code.');
    } catch (error) {
        vscode.window.showWarningMessage('Could not open Augment Code. Prompt copied to clipboard - please paste it manually.');
    }
}

async function manifestoChat() {
    if (!(await isManifestoDefined())) {
        vscode.window.showWarningMessage('Cannot start Manifesto Chat. Manifesto file not set or not found.');
        return;
    }

    const userMessage = await vscode.window.showInputBox({
        prompt: "What do you want to discuss with manifesto guidance?",
        placeHolder: "e.g., 'help me design a user authentication system following our standards'"
    });

    if (!userMessage) return;

    const manifestoPath = await getManifestoPath();
    const manifestoContent = await fs.readFile(manifestoPath!, 'utf-8');

    const prompt = `You are a senior software architect. Help me with my request while STRICTLY adhering to our team's development manifesto.

---
## DEVELOPMENT MANIFESTO (MUST FOLLOW):
${manifestoContent}
---
## MY REQUEST:
${userMessage}
---

Please provide guidance that follows our manifesto principles.`;

    await vscode.env.clipboard.writeText(prompt);

    try {
        await vscode.commands.executeCommand('augment.chat.open');
        vscode.window.showInformationMessage('Manifesto chat started! Paste the prompt in Augment Code.');
    } catch (error) {
        vscode.window.showWarningMessage('Could not open Augment Code. Prompt copied to clipboard - please paste it manually.');
    }
}

async function sendManifestoToChat() {
    if (!(await isManifestoDefined())) {
        vscode.window.showWarningMessage('Cannot send manifesto. Manifesto file not set or not found.');
        return;
    }

    const manifestoPath = await getManifestoPath();
    const manifestoContent = await fs.readFile(manifestoPath!, 'utf-8');

    const prompt = `Here's our team's development manifesto. Please keep these principles in mind for our conversation:

---
## DEVELOPMENT MANIFESTO:
${manifestoContent}
---

I'll be asking you to help with code that should follow these standards.`;

    await vscode.env.clipboard.writeText(prompt);

    try {
        await vscode.commands.executeCommand('augment.chat.open');
        vscode.window.showInformationMessage('Manifesto sent to Augment Code! Paste it to set the context.');
    } catch (error) {
        vscode.window.showWarningMessage('Could not open Augment Code. Manifesto copied to clipboard - please paste it manually.');
    }
}

async function complianceCheck() {
    if (!(await isManifestoDefined())) {
        vscode.window.showWarningMessage('Cannot run compliance check. Manifesto file not set or not found.');
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
    }

    vscode.window.showInformationMessage('Running compliance check... This may take a moment.');

    try {
        const manifestoPath = await getManifestoPath();
        const manifestoContent = await fs.readFile(manifestoPath!, 'utf-8');
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        // Scan for code files
        const codeFiles = await scanCodeFiles(workspaceRoot);

        // Generate compliance report
        const report = await generateComplianceReport(manifestoContent, codeFiles, workspaceRoot);

        // Create and show report document
        const reportDoc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(reportDoc);

        // Ask if user wants to send summary to Augment for recommendations
        const sendToAugment = await vscode.window.showInformationMessage(
            'Compliance report generated! Would you like to send a summary to Augment Code for improvement recommendations?',
            'Yes, Send Summary',
            'No, Just Keep Report'
        );

        if (sendToAugment === 'Yes, Send Summary') {
            const summary = generateComplianceSummary(report);
            await vscode.env.clipboard.writeText(summary);

            try {
                await vscode.commands.executeCommand('augment.chat.open');
                vscode.window.showInformationMessage('Compliance summary copied! Paste it in Augment Code for recommendations.');
            } catch (error) {
                vscode.window.showWarningMessage('Could not open Augment Code. Summary copied to clipboard - please paste it manually.');
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Compliance check failed: ${error}`);
    }
}

async function scanCodeFiles(workspaceRoot: string): Promise<{path: string, content: string, language: string}[]> {
    const codeFiles: {path: string, content: string, language: string}[] = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift'];

    async function scanDirectory(dirPath: string) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(workspaceRoot, fullPath);

                // Skip common directories to ignore
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build', 'out', '.vscode', 'target', 'bin', 'obj'].includes(entry.name)) {
                        await scanDirectory(fullPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        try {
                            const content = await fs.readFile(fullPath, 'utf-8');
                            const language = getLanguageFromExtension(ext);
                            codeFiles.push({ path: relativePath, content, language });
                        } catch (error) {
                            // Skip files that can't be read
                        }
                    }
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }
    }

    await scanDirectory(workspaceRoot);
    return codeFiles.slice(0, 50); // Limit to first 50 files to avoid overwhelming
}

function getLanguageFromExtension(ext: string): string {
    const langMap: {[key: string]: string} = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.jsx': 'React JSX',
        '.tsx': 'React TSX',
        '.py': 'Python',
        '.java': 'Java',
        '.cs': 'C#',
        '.cpp': 'C++',
        '.c': 'C',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.go': 'Go',
        '.rs': 'Rust',
        '.swift': 'Swift'
    };
    return langMap[ext] || 'Unknown';
}

async function generateComplianceReport(manifestoContent: string, codeFiles: {path: string, content: string, language: string}[], workspaceRoot: string): Promise<string> {
    const timestamp = new Date().toISOString();
    const totalFiles = codeFiles.length;
    const languageStats = codeFiles.reduce((acc, file) => {
        acc[file.language] = (acc[file.language] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});

    let report = `# Manifesto Compliance Report

**Generated:** ${timestamp}
**Workspace:** ${path.basename(workspaceRoot)}
**Files Scanned:** ${totalFiles}

## Language Distribution
${Object.entries(languageStats).map(([lang, count]) => `- ${lang}: ${count} files`).join('\n')}

---

## Manifesto Standards
${manifestoContent}

---

## File Analysis

`;

    // Analyze each file for basic compliance issues
    for (const file of codeFiles) {
        const issues = analyzeFileCompliance(file.content, file.language);

        report += `### ${file.path} (${file.language})
**Lines of Code:** ${file.content.split('\n').length}

`;

        if (issues.length > 0) {
            report += `**Potential Issues:**
${issues.map(issue => `- ${issue}`).join('\n')}

`;
        } else {
            report += `**Status:** ✅ No obvious compliance issues detected

`;
        }

        report += `---

`;
    }

    report += `## Summary

**Total Files:** ${totalFiles}
**Files with Issues:** ${codeFiles.filter(file => analyzeFileCompliance(file.content, file.language).length > 0).length}

## Next Steps

1. Review flagged files for manifesto compliance
2. Consider refactoring files with multiple issues
3. Update documentation where needed
4. Run this check regularly to maintain standards

---

*This report was generated by Manifesto Enforcer. For detailed recommendations, send the summary to Augment Code.*
`;

    return report;
}

function analyzeFileCompliance(content: string, language: string): string[] {
    const issues: string[] = [];
    const lines = content.split('\n');

    // Basic compliance checks

    // Check for missing documentation
    const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
    const hasComments = /\/\/|\/\*|\#/.test(content);

    if (!hasJSDoc && !hasComments && lines.length > 20) {
        issues.push('Missing documentation/comments for a file over 20 lines');
    }

    // Check for error handling
    const hasTryCatch = /try\s*{[\s\S]*?catch/.test(content);
    const hasErrorHandling = /error|Error|exception|Exception/.test(content);

    if (!hasTryCatch && !hasErrorHandling && (language.includes('JavaScript') || language.includes('TypeScript') || language === 'Python')) {
        issues.push('No obvious error handling detected');
    }

    // Check for very long functions
    const functionMatches = content.match(/function\s+\w+|def\s+\w+|public\s+\w+\s+\w+\(/g);
    if (functionMatches && lines.length > 100) {
        issues.push('Large file - consider breaking into smaller modules');
    }

    // Check for TODO/FIXME comments
    const todoCount = (content.match(/TODO|FIXME|HACK/gi) || []).length;
    if (todoCount > 0) {
        issues.push(`${todoCount} TODO/FIXME comments found`);
    }

    // Check for console.log (in JS/TS files)
    if ((language.includes('JavaScript') || language.includes('TypeScript')) && /console\.log/.test(content)) {
        issues.push('Console.log statements found - consider proper logging');
    }

    return issues;
}

function generateComplianceSummary(report: string): string {
    return `I just ran a compliance check on my codebase against our development manifesto. Here's a summary of the findings:

${report.split('## Summary')[1]?.split('---')[0] || 'Report summary not available'}

Based on our manifesto standards and the issues found, can you provide specific recommendations for improving code quality and compliance? Focus on the most impactful changes we should prioritize.

Our manifesto emphasizes: documentation, error handling, code style, performance, and testing practices.`;
}

async function setProjectManifestoPath(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('You must have a project folder open to set a manifesto file.');
        return;
    }
    const fileUri = await vscode.window.showOpenDialog({ canSelectMany: false, openLabel: 'Select Manifesto File', filters: { 'Markdown': ['md'] } });
    if (fileUri && fileUri[0]) {
        const workspaceRoot = workspaceFolders[0].uri;
        const relativePath = path.relative(workspaceRoot.fsPath, fileUri[0].fsPath);
        const config = vscode.workspace.getConfiguration('manifesto', workspaceRoot);
        await config.update('filePath', relativePath, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`Project manifesto set to: ${relativePath}`);
        await updateStatusBar(context);
        manifestoProvider.refresh();
        actionsProvider.refresh();
    }
}

async function refactorWithToggle(context: vscode.ExtensionContext) {
    const isStrictMode = context.workspaceState.get<boolean>(STRICT_MODE_KEY, true);
    if (isStrictMode) {
        if (!(await isManifestoDefined())) {
            vscode.window.showWarningMessage('Cannot run in Strict Mode. Manifesto file not set or not found. Click the status bar item to set it.');
            return;
        }
        await generateRefactorPrompt(true);
    } else {
        await generateRefactorPrompt(false);
    }
}

async function generateRefactorPrompt(includeManifesto: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        vscode.window.showInformationMessage('Please select code to refactor.');
        return;
    }
    const selectedCode = editor.document.getText(editor.selection);
    const userInstruction = await vscode.window.showInputBox({ prompt: "What should be done to this code?", placeHolder: "e.g., 'add error handling and JSDoc comments'" });
    if (!userInstruction) return;

    let masterPrompt = '';
    if (includeManifesto) {
        const workspaceFolders = vscode.workspace.workspaceFolders!;
        const config = vscode.workspace.getConfiguration('manifesto', workspaceFolders[0].uri);
        const filePathSetting = config.get<string>('filePath')!;
        const absolutePath = path.isAbsolute(filePathSetting) ? filePathSetting : path.join(workspaceFolders[0].uri.fsPath, filePathSetting);
        const manifestoContent = await fs.readFile(absolutePath, 'utf-8');
        masterPrompt = `You are a senior software architect. Rewrite the provided code based on my request, while STRICTLY adhering to our team's development manifesto.

---
## DEVELOPMENT MANIFESTO (MUST FOLLOW):
${manifestoContent}
---
## MY SPECIFIC REQUEST:
"${userInstruction}"
---
## ORIGINAL CODE:
\`\`\`${editor.document.languageId}
${selectedCode}
\`\`\`
---

Provide only the refactored code block.`;
    } else {
        masterPrompt = `You are a helpful pair programmer. Rewrite the provided code based on my request.

## MY SPECIFIC REQUEST:
"${userInstruction}"
---
## ORIGINAL CODE:
\`\`\`${editor.document.languageId}
${selectedCode}
\`\`\`
---

Provide only the refactored code block.`;
    }

    await vscode.env.clipboard.writeText(masterPrompt);
    const message = includeManifesto ? 'Strict prompt' : 'Quick prompt';
    vscode.window.showInformationMessage(`${message} copied to clipboard! Paste it into your AI chat.`);

    const config = vscode.workspace.getConfiguration('manifesto');
    const provider = config.get<string>('aiProvider');
    const commandToExecute = provider ? AI_PROVIDER_COMMANDS[provider] : undefined;
    if (commandToExecute) {
        try {
            await vscode.commands.executeCommand(commandToExecute);
        } catch (error) {
            vscode.window.showWarningMessage(`Could not open ${provider}. Please ensure the extension is installed.`);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize providers
    manifestoProvider = new ManifestoTreeDataProvider(context);
    actionsProvider = new ManifestoActionsProvider(context);

    // Register tree data providers
    vscode.window.registerTreeDataProvider('manifestoPanel', manifestoProvider);
    vscode.window.registerTreeDataProvider('manifestoActions', actionsProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('manifesto.toggleStrictMode', () => toggleStrictMode(context)),
        vscode.commands.registerCommand('manifesto.setManifestoPath', () => setProjectManifestoPath(context)),
        vscode.commands.registerCommand('manifesto.refactorWithToggle', () => refactorWithToggle(context)),
        vscode.commands.registerCommand('manifesto.createManifesto', () => createManifesto()),
        vscode.commands.registerCommand('manifesto.createFromTemplate', () => createFromTemplate()),
        vscode.commands.registerCommand('manifesto.quickRefactor', () => quickRefactor()),
        vscode.commands.registerCommand('manifesto.strictRefactor', () => strictRefactor()),
        vscode.commands.registerCommand('manifesto.sendToAugment', () => sendToAugment(context)),
        vscode.commands.registerCommand('manifesto.vibeChat', () => vibeChat()),
        vscode.commands.registerCommand('manifesto.manifestoChat', () => manifestoChat()),
        vscode.commands.registerCommand('manifesto.sendManifestoToChat', () => sendManifestoToChat()),
        vscode.commands.registerCommand('manifesto.complianceCheck', () => complianceCheck()),
        vscode.commands.registerCommand('manifesto.refresh', () => {
            manifestoProvider.refresh();
            actionsProvider.refresh();
        }),
        vscode.commands.registerCommand('manifesto.openPanel', () => {
            vscode.commands.executeCommand('workbench.view.extension.manifesto-container');
        })
    );

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);

    // Listen for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('manifesto.filePath')) {
            updateStatusBar(context);
            manifestoProvider.refresh();
            actionsProvider.refresh();
        }
    }));

    // Initialize UI
    updateStatusBar(context);
    statusBarItem.show();
}

export function deactivate() {}
