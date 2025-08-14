#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateHtmlReport() {
    const reportsDir = path.join(process.cwd(), 'reports');
    const combinedReportPath = path.join(reportsDir, 'combined-report.json');
    
    if (!fs.existsSync(combinedReportPath)) {
        console.error('❌ Combined report not found. Run tests first.');
        process.exit(1);
    }
    
    const report = JSON.parse(fs.readFileSync(combinedReportPath, 'utf8'));
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manifesto Enforcer - Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .summary { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #007bff; }
        .duration { color: #6f42c1; }
        .test-suites {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        .test-suite {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .suite-header {
            padding: 20px;
            font-weight: bold;
            font-size: 1.2em;
        }
        .jest-header { background: #e8f5e8; color: #155724; }
        .mocha-header { background: #e2f3ff; color: #004085; }
        .suite-content { padding: 20px; }
        .suite-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .suite-stat {
            text-align: center;
            padding: 10px;
            border-radius: 5px;
            background: #f8f9fa;
        }
        .suite-stat-value {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .suite-stat-label { font-size: 0.8em; color: #666; }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .footer {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            color: #666;
        }
        .timestamp { font-size: 0.9em; }
        @media (max-width: 768px) {
            .summary { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
            .test-suites { grid-template-columns: 1fr; }
            .header h1 { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Manifesto Enforcer</h1>
            <p>Comprehensive Test Report</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value total">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${report.summary.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${report.summary.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value skipped">${report.summary.skippedTests}</div>
                <div class="metric-label">Skipped</div>
            </div>
            ${report.summary.duration > 0 ? `
            <div class="metric">
                <div class="metric-value duration">${(report.summary.duration / 1000).toFixed(2)}s</div>
                <div class="metric-label">Duration</div>
            </div>
            ` : ''}
        </div>
        
        <div class="test-suites">
            ${report.jest ? `
            <div class="test-suite">
                <div class="suite-header jest-header">
                    🧪 Jest (Unit Tests)
                    <span class="status-badge ${report.jest.success ? 'status-passed' : 'status-failed'}">
                        ${report.jest.success ? 'Passed' : 'Failed'}
                    </span>
                </div>
                <div class="suite-content">
                    <div class="suite-stats">
                        <div class="suite-stat">
                            <div class="suite-stat-value total">${report.jest.numTotalTests}</div>
                            <div class="suite-stat-label">Total</div>
                        </div>
                        <div class="suite-stat">
                            <div class="suite-stat-value passed">${report.jest.numPassedTests}</div>
                            <div class="suite-stat-label">Passed</div>
                        </div>
                        <div class="suite-stat">
                            <div class="suite-stat-value failed">${report.jest.numFailedTests}</div>
                            <div class="suite-stat-label">Failed</div>
                        </div>
                        <div class="suite-stat">
                            <div class="suite-stat-value skipped">${report.jest.numPendingTests}</div>
                            <div class="suite-stat-label">Skipped</div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${report.mocha ? `
            <div class="test-suite">
                <div class="suite-header mocha-header">
                    🔧 Mocha (Integration Tests)
                    <span class="status-badge ${report.mocha.success ? 'status-passed' : 'status-failed'}">
                        ${report.mocha.success ? 'Passed' : 'Failed'}
                    </span>
                </div>
                <div class="suite-content">
                    <div class="suite-stats">
                        <div class="suite-stat">
                            <div class="suite-stat-value total">${report.mocha.stats.tests || 0}</div>
                            <div class="suite-stat-label">Total</div>
                        </div>
                        <div class="suite-stat">
                            <div class="suite-stat-value passed">${report.mocha.stats.passes || 0}</div>
                            <div class="suite-stat-label">Passed</div>
                        </div>
                        <div class="suite-stat">
                            <div class="suite-stat-value failed">${report.mocha.stats.failures || 0}</div>
                            <div class="suite-stat-label">Failed</div>
                        </div>
                        <div class="suite-stat">
                            <div class="suite-stat-value skipped">${report.mocha.stats.pending || 0}</div>
                            <div class="suite-stat-label">Skipped</div>
                        </div>
                    </div>
                    ${report.mocha.stats.duration ? `
                    <div style="text-align: center; margin-top: 15px; color: #666;">
                        Duration: ${(report.mocha.stats.duration / 1000).toFixed(2)}s
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <div class="timestamp">
                Generated on ${new Date(report.timestamp).toLocaleString()}
            </div>
        </div>
    </div>
</body>
</html>
    `;
    
    const htmlReportPath = path.join(reportsDir, 'test-report.html');
    fs.writeFileSync(htmlReportPath, html.trim());
    
    console.log(`✅ HTML report generated: ${htmlReportPath}`);
    return htmlReportPath;
}

if (require.main === module) {
    generateHtmlReport();
}

module.exports = { generateHtmlReport };
