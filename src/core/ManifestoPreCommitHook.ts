/**
 * MANDATORY: Pre-commit hook that enforces manifesto compliance
 * CRITICAL: Blocks commits with failing tests or manifesto violations
 * REQUIRED: Validates all requirements before allowing commits
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * REQUIRED: Test execution results
 */
export interface TestResults {
    passed: number;
    failed: number;
    total: number;
    duration: number;
}

/**
 * REQUIRED: Code coverage results
 */
export interface CoverageResults {
    passed: boolean;
    percentage: number;
    threshold: number;
}

/**
 * CRITICAL: Pre-commit hook that prevents manifesto violations
 */
export class ManifestoPreCommitHook {
    private readonly COVERAGE_THRESHOLD = 80; // MANDATORY: 80% coverage requirement
    private readonly TEST_TIMEOUT = 30000; // OPTIMIZE: 30 second timeout

    /**
     * CRITICAL: Main validation method - blocks commits if any check fails
     */
    async validateBeforeCommit(): Promise<boolean> {
        try {
            // MANDATORY: Validate workspace exists
            await this.validateWorkspace();

            // REQUIRED: Run all validation checks
            await this.runAllTests();
            await this.checkCodeCoverage();
            await this.validateLinting();
            await this.checkGitStatus();

            return true;

        } catch (error) {
            // MANDATORY: Proper error handling
            console.error('Pre-commit validation failed:', error);
            throw error;
        }
    }

    /**
     * MANDATORY: Execute all tests and validate results
     */
    async runAllTests(): Promise<TestResults> {
        try {
            const workspaceRoot = this.getWorkspaceRoot();

            // REQUIRED: Execute test command with timeout
            const { stdout, stderr } = await Promise.race([
                execAsync('npm test', { cwd: workspaceRoot }),
                this.createTimeoutPromise()
            ]);

            // REQUIRED: Parse test results
            const results = this.parseTestResults(stdout);

            // CRITICAL: Fail if any tests failed
            if (results.failed > 0) {
                throw new Error(`MANIFESTO VIOLATION: Cannot commit with ${results.failed} failing tests`);
            }

            return results;

        } catch (error) {
            if (error instanceof Error && error.message.includes('MANIFESTO VIOLATION')) {
                throw error;
            }
            // MANDATORY: Comprehensive error handling
            console.error('ManifestoPreCommitHook: Test execution error:', error);
            throw new Error('MANIFESTO VIOLATION: Test execution failed');
        }
    }

    /**
     * MANDATORY: Check code coverage meets requirements
     */
    async checkCodeCoverage(): Promise<CoverageResults> {
        try {
            const workspaceRoot = this.getWorkspaceRoot();
            
            // REQUIRED: Execute coverage command
            const { stdout } = await execAsync('npm run test:coverage', { cwd: workspaceRoot });

            // REQUIRED: Parse coverage results
            const coverage = this.parseCoverageResults(stdout);

            // CRITICAL: Fail if coverage below threshold
            if (coverage.percentage < this.COVERAGE_THRESHOLD) {
                throw new Error(`MANIFESTO VIOLATION: Code coverage ${coverage.percentage}% below required ${this.COVERAGE_THRESHOLD}%`);
            }

            return {
                passed: true,
                percentage: coverage.percentage,
                threshold: this.COVERAGE_THRESHOLD
            };

        } catch (error) {
            if (error instanceof Error && error.message.includes('MANIFESTO VIOLATION')) {
                throw error;
            }
            throw new Error('MANIFESTO VIOLATION: Coverage check failed');
        }
    }

    /**
     * MANDATORY: Validate linting passes
     */
    private async validateLinting(): Promise<void> {
        try {
            const workspaceRoot = this.getWorkspaceRoot();
            
            // REQUIRED: Execute lint command
            await execAsync('npm run lint', { cwd: workspaceRoot });

        } catch (error) {
            throw new Error('MANIFESTO VIOLATION: Linting failed with errors');
        }
    }

    /**
     * REQUIRED: Check for uncommitted changes
     */
    private async checkGitStatus(): Promise<void> {
        try {
            const workspaceRoot = this.getWorkspaceRoot();
            
            // REQUIRED: Check git status
            const { stdout } = await execAsync('git status --porcelain', { cwd: workspaceRoot });

            // CRITICAL: Fail if uncommitted changes exist
            if (stdout.trim().length > 0) {
                throw new Error('MANIFESTO VIOLATION: Uncommitted changes detected');
            }

        } catch (error) {
            if (error instanceof Error && error.message.includes('MANIFESTO VIOLATION')) {
                throw error;
            }
            // Git status check is optional if not in git repo
        }
    }

    /**
     * MANDATORY: Validate workspace exists
     */
    private async validateWorkspace(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('MANIFESTO VIOLATION: No workspace folder found');
        }
    }

    /**
     * REQUIRED: Get workspace root path
     */
    private getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('MANIFESTO VIOLATION: No workspace folder found');
        }

        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * REQUIRED: Parse test results from command output
     */
    private parseTestResults(output: string): TestResults {
        // REQUIRED: Parse Jest output format
        const testMatch = output.match(/Tests:\s*(\d+)\s*passed,\s*(\d+)\s*failed/);
        const totalMatch = output.match(/Tests:\s*\d+\s*passed,\s*\d+\s*failed,\s*(\d+)\s*total/);
        
        if (testMatch) {
            const passed = parseInt(testMatch[1], 10);
            const failed = parseInt(testMatch[2], 10);
            const total = totalMatch ? parseInt(totalMatch[1], 10) : passed + failed;
            
            return {
                passed,
                failed,
                total,
                duration: 0 // Would be parsed from output if available
            };
        }

        // REQUIRED: Fallback parsing
        return {
            passed: 0,
            failed: 0,
            total: 0,
            duration: 0
        };
    }

    /**
     * REQUIRED: Parse coverage results from command output
     */
    private parseCoverageResults(output: string): { percentage: number } {
        // REQUIRED: Parse coverage percentage from output
        const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)/);
        
        if (coverageMatch) {
            return {
                percentage: parseFloat(coverageMatch[1])
            };
        }

        // REQUIRED: Default to 0 if parsing fails
        return { percentage: 0 };
    }

    /**
     * OPTIMIZE: Create timeout promise for test execution
     */
    private createTimeoutPromise(): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('MANIFESTO VIOLATION: Test execution timed out'));
            }, this.TEST_TIMEOUT);
        });
    }
}
