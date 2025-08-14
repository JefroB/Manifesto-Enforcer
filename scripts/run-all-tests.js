#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`${message}`, colors.cyan + colors.bright);
    log(`${'='.repeat(60)}`, colors.cyan);
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, colors.blue + colors.bright);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

// Ensure reports directory exists
function ensureReportsDir() {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
}

// Run a command and return a promise
function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Run a command and capture output
function runCommandWithOutput(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        const child = spawn(command, args, {
            shell: true,
            ...options
        });

        child.stdout?.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    return {
        coverage: args.includes('--coverage'),
        jestOnly: args.includes('--jest-only'),
        mochaOnly: args.includes('--mocha-only'),
        skipAuggie: args.includes('--skip-auggie') || !args.includes('--with-auggie'),
        verbose: args.includes('--verbose') || args.includes('-v')
    };
}

async function runJestTests(options) {
    logStep('1', 'Running Jest Unit Tests');
    
    const jestArgs = ['--passWithNoTests'];
    
    if (options.coverage) {
        jestArgs.push('--coverage');
        jestArgs.push('--coverageDirectory=reports/jest-coverage');
        jestArgs.push('--coverageReporters=json,lcov,text,html');
    }
    
    if (options.verbose) {
        jestArgs.push('--verbose');
    }

    // Add JSON reporter for combining results
    jestArgs.push('--json');
    jestArgs.push('--outputFile=reports/jest-results.json');

    try {
        await runCommand('npx', ['jest', ...jestArgs]);
        logSuccess('Jest tests completed successfully');
        return true;
    } catch (error) {
        logError(`Jest tests failed: ${error.message}`);
        return false;
    }
}

async function runMochaTests(options) {
    logStep('2', 'Running Mocha Integration Tests');

    try {
        const env = { ...process.env };
        if (options.skipAuggie) {
            env.SKIP_AUGGIE_TESTS = 'true';
        }

        // Use the existing VSCode test runner but capture output
        const testCommand = options.skipAuggie ? 'test:integration:no-auggie' : 'test:integration';
        const result = await runCommandWithOutput('npm', ['run', testCommand], { env });

        // Parse test results from output
        const mochaResults = parseMochaOutput(result.stdout);

        // Save results to file
        const reportsDir = ensureReportsDir();
        const mochaResultsPath = path.join(reportsDir, 'mocha-results.json');
        fs.writeFileSync(mochaResultsPath, JSON.stringify(mochaResults, null, 2));

        if (result.code === 0) {
            logSuccess('Mocha tests completed successfully');
            return true;
        } else {
            logError('Mocha tests failed');
            return false;
        }
    } catch (error) {
        logError(`Mocha tests failed: ${error.message}`);
        return false;
    }
}

function parseMochaOutput(output) {
    // Parse the test output to extract results
    const lines = output.split('\n');
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let duration = 0;

    // Look for the summary line like "82 passing (47s)"
    for (const line of lines) {
        const passingMatch = line.match(/(\d+) passing/);
        if (passingMatch) {
            passedTests = parseInt(passingMatch[1]);
        }

        const failingMatch = line.match(/(\d+) failing/);
        if (failingMatch) {
            failedTests = parseInt(failingMatch[1]);
        }

        const pendingMatch = line.match(/(\d+) pending/);
        if (pendingMatch) {
            skippedTests = parseInt(pendingMatch[1]);
        }

        const durationMatch = line.match(/\((\d+)s\)/);
        if (durationMatch) {
            duration = parseInt(durationMatch[1]) * 1000; // Convert to milliseconds
        }
    }

    totalTests = passedTests + failedTests + skippedTests;

    return {
        stats: {
            tests: totalTests,
            passes: passedTests,
            failures: failedTests,
            pending: skippedTests,
            duration: duration
        },
        tests: [],
        failures: []
    };
}

async function generateCombinedReport(jestSuccess, mochaSuccess) {
    logStep('3', 'Generating Combined Test Report');

    const reportsDir = ensureReportsDir();
    const jestResultsPath = path.join(reportsDir, 'jest-results.json');
    const mochaResultsPath = path.join(reportsDir, 'mocha-results.json');
    const combinedReportPath = path.join(reportsDir, 'combined-report.json');

    let jestResults = null;
    let mochaResults = null;

    // Read Jest results (even if Jest failed, we still want the results)
    if (fs.existsSync(jestResultsPath)) {
        try {
            jestResults = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
        } catch (error) {
            logWarning(`Could not read Jest results: ${error.message}`);
        }
    }
    
    // Read Mocha results
    if (mochaSuccess && fs.existsSync(mochaResultsPath)) {
        try {
            mochaResults = JSON.parse(fs.readFileSync(mochaResultsPath, 'utf8'));
        } catch (error) {
            logWarning(`Could not read Mocha results: ${error.message}`);
        }
    }
    
    // Create combined report
    const combinedReport = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            duration: 0
        },
        jest: jestResults ? {
            success: jestSuccess,
            numTotalTests: jestResults.numTotalTests || 0,
            numPassedTests: jestResults.numPassedTests || 0,
            numFailedTests: jestResults.numFailedTests || 0,
            numPendingTests: jestResults.numPendingTests || 0,
            testResults: jestResults.testResults || []
        } : null,
        mocha: mochaResults ? {
            success: mochaSuccess,
            stats: mochaResults.stats || {},
            tests: mochaResults.tests || [],
            failures: mochaResults.failures || []
        } : null
    };
    
    // Calculate summary
    if (jestResults) {
        combinedReport.summary.totalTests += jestResults.numTotalTests || 0;
        combinedReport.summary.passedTests += jestResults.numPassedTests || 0;
        combinedReport.summary.failedTests += jestResults.numFailedTests || 0;
        combinedReport.summary.skippedTests += jestResults.numPendingTests || 0;
    }
    
    if (mochaResults && mochaResults.stats) {
        combinedReport.summary.totalTests += mochaResults.stats.tests || 0;
        combinedReport.summary.passedTests += mochaResults.stats.passes || 0;
        combinedReport.summary.failedTests += mochaResults.stats.failures || 0;
        combinedReport.summary.skippedTests += mochaResults.stats.pending || 0;
        combinedReport.summary.duration += mochaResults.stats.duration || 0;
    }
    
    // Write combined report
    fs.writeFileSync(combinedReportPath, JSON.stringify(combinedReport, null, 2));
    
    return combinedReport;
}

function displaySummary(report, jestSuccess, mochaSuccess) {
    logHeader('TEST EXECUTION SUMMARY');
    
    const { summary } = report;
    
    log(`📊 Total Tests: ${summary.totalTests}`, colors.blue);
    log(`✅ Passed: ${summary.passedTests}`, colors.green);
    log(`❌ Failed: ${summary.failedTests}`, summary.failedTests > 0 ? colors.red : colors.green);
    log(`⏭️  Skipped: ${summary.skippedTests}`, colors.yellow);
    
    if (summary.duration > 0) {
        log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`, colors.cyan);
    }
    
    log('\n📋 Test Suite Results:', colors.bright);
    log(`  Jest (Unit Tests): ${jestSuccess ? '✅ PASSED' : '❌ FAILED'}`, jestSuccess ? colors.green : colors.red);
    log(`  Mocha (Integration): ${mochaSuccess ? '✅ PASSED' : '❌ FAILED'}`, mochaSuccess ? colors.green : colors.red);
    
    const overallSuccess = jestSuccess && mochaSuccess && summary.failedTests === 0;
    
    logHeader(overallSuccess ? 'ALL TESTS PASSED! 🎉' : 'SOME TESTS FAILED ⚠️');
    
    log(`\n📁 Reports saved to: ${path.join(process.cwd(), 'reports')}`, colors.cyan);
    
    return overallSuccess;
}

async function main() {
    const options = parseArgs();
    
    logHeader('MANIFESTO ENFORCER - COMPREHENSIVE TEST SUITE');
    
    log(`Configuration:`, colors.bright);
    log(`  Coverage: ${options.coverage ? 'Enabled' : 'Disabled'}`);
    log(`  Jest Only: ${options.jestOnly ? 'Yes' : 'No'}`);
    log(`  Mocha Only: ${options.mochaOnly ? 'Yes' : 'No'}`);
    log(`  Skip Auggie Tests: ${options.skipAuggie ? 'Yes' : 'No'}`);
    log(`  Verbose: ${options.verbose ? 'Yes' : 'No'}`);
    
    // Ensure reports directory exists
    ensureReportsDir();
    
    let jestSuccess = true;
    let mochaSuccess = true;
    
    try {
        // Run Jest tests (unless mocha-only)
        if (!options.mochaOnly) {
            jestSuccess = await runJestTests(options);
        }
        
        // Run Mocha tests (unless jest-only)
        if (!options.jestOnly) {
            mochaSuccess = await runMochaTests(options);
        }
        
        // Generate combined report
        const report = await generateCombinedReport(jestSuccess, mochaSuccess);

        // Generate HTML report
        try {
            const { generateHtmlReport } = require('./generate-html-report');
            generateHtmlReport();
        } catch (error) {
            logWarning(`Could not generate HTML report: ${error.message}`);
        }

        // Display summary
        const overallSuccess = displaySummary(report, jestSuccess, mochaSuccess);
        
        // Exit with appropriate code
        process.exit(overallSuccess ? 0 : 1);
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        logError(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, parseArgs };
