/**
 * MANDATORY: VSCode Extension Integration Test Runner
 * REQUIRED: Test extension.ts in real VSCode environment for better coverage
 */

import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
    try {
        // Use path.join to properly handle paths with spaces
        const extensionDevelopmentPath = path.join(__dirname, '..', '..');
        const extensionTestsPath = path.join(__dirname, 'suite', 'index');

        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);
        console.log('Current Working Directory:', process.cwd());
        console.log('__dirname:', __dirname);

        // Create a custom user data directory to avoid path conflicts
        const userDataDir = path.join(__dirname, '..', '..', '.vscode-test-user-data');

        // Download VS Code, unzip it and run the integration test
        // CRITICAL: Use quoted paths to handle spaces in directory names
        // NOTE: Allow all extensions so our extension can find its dependencies
        await runTests({
            extensionDevelopmentPath: `"${extensionDevelopmentPath}"`,
            extensionTestsPath: `"${extensionTestsPath}"`,
            launchArgs: [
                `--user-data-dir="${userDataDir}"`, // Quote the user data directory path
                // No --disable-extensions flag - we need other extensions to work
                '--disable-workspace-trust', // Disable workspace trust for testing
                '--no-sandbox', // Disable sandbox for testing environment
                '--disable-gpu', // Disable GPU for testing stability
                '--verbose' // Enable verbose logging to debug the issue
            ]
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
