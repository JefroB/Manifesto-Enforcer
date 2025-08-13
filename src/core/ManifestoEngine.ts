/**
 * Core Manifesto Engine
 * Following manifesto: comprehensive error handling, input validation, performance optimization
 */

import * as crypto from 'crypto';
import { 
  ManifestoRule, 
  RuleSeverity, 
  RuleCategory, 
  ComplianceResult, 
  RuleViolation,
  PerformanceMetrics 
} from './types';

/**
 * Core engine for manifesto parsing, validation, and rule application
 * Implements all security and performance requirements from manifesto
 */
export class ManifestoEngine {
  private encryptionKey: string;
  private performanceMetrics: PerformanceMetrics[] = [];

  constructor(encryptionKey?: string) {
    // CRITICAL: Sensitive data encryption (manifesto requirement)
    this.encryptionKey = encryptionKey || this.generateEncryptionKey();
  }

  /**
   * Parse manifesto content into structured rules
   * OPTIMIZE: Must complete under 200ms (manifesto requirement)
   */
  async parseManifesto(content: string): Promise<ManifestoRule[]> {
    const startTime = Date.now();
    
    try {
      // MANDATORY: Input validation (manifesto requirement)
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid manifesto content: must be non-empty string');
      }

      const rules: ManifestoRule[] = [];
      const lines = content.split('\n');
      let currentCategory = RuleCategory.GENERAL;
      let currentSeverity = RuleSeverity.RECOMMENDED;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('<!--')) continue;

        // Detect category headers and severity (both ## and ###)
        if (line.startsWith('##')) {
          currentCategory = this.detectCategory(line);
          currentSeverity = this.detectSeverityFromHeader(line);
          continue;
        }

        // Parse rule lines - bullet points and critical AI directives
        if ((line.startsWith('- ') || line.startsWith('* ')) ||
            (line.startsWith('**ATTENTION AI') || line.startsWith('**REMEMBER:'))) {
          const rule = this.parseRuleLine(line, i, currentCategory, currentSeverity);
          if (rule) {
            rules.push(rule);
          }
        }
      }

      // Record performance metrics for monitoring
      const duration = Date.now() - startTime;
      this.recordPerformanceMetric('parseManifesto', duration);

      return rules;

    } catch (error) {
      // MANDATORY: Comprehensive error handling (manifesto requirement)
      throw new Error(`Failed to parse manifesto: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate code compliance against manifesto rules
   * REQUIRED: Comprehensive validation with detailed feedback
   */
  async validateCompliance(code: string, rules: ManifestoRule[]): Promise<ComplianceResult> {
    const startTime = Date.now();

    try {
      // MANDATORY: Input validation
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid code content: must be non-empty string');
      }

      const violations: RuleViolation[] = [];
      
      for (const rule of rules) {
        const ruleViolations = await this.checkRule(code, rule);
        violations.push(...ruleViolations);
      }

      // Calculate compliance score
      const totalRules = rules.length;
      const violatedRules = new Set(violations.map(v => v.ruleId)).size;
      const score = totalRules > 0 ? Math.round(((totalRules - violatedRules) / totalRules) * 100) : 100;

      const duration = Date.now() - startTime;
      const performanceMetrics: PerformanceMetrics = {
        responseTime: duration,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      };

      return {
        isCompliant: violations.length === 0,
        violations,
        score,
        performanceMetrics
      };

    } catch (error) {
      throw new Error(`Compliance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI prompt with manifesto rules embedded
   * CRITICAL: Must include all security and compliance requirements
   */
  async generatePrompt(userMessage: string, rules: ManifestoRule[]): Promise<string> {
    try {
      // MANDATORY: Input validation
      if (!userMessage || typeof userMessage !== 'string') {
        throw new Error('Invalid user message');
      }

      const manifestoSection = rules.length > 0 ? this.formatRulesForPrompt(rules) : '';
      
      const prompt = `You are a senior software architect and development agent. You MUST strictly follow the development manifesto below. This is non-negotiable and overrides any default behavior.

## MANDATORY DEVELOPMENT MANIFESTO (MUST FOLLOW):
${manifestoSection}

## CRITICAL INSTRUCTIONS:
- Follow EVERY principle in the manifesto above
- Write code directly to project files when requested
- Enforce all coding standards mentioned
- Apply all architecture principles listed
- Follow all testing requirements specified
- Reject any code that violates these principles
- CRITICAL: Implement comprehensive error handling for all operations
- OPTIMIZE: Ensure all operations complete under 200ms when possible
- REQUIRED: Include unit tests for all business logic

## USER REQUEST:
${userMessage}

Respond as a development agent who strictly enforces the manifesto principles above.`;

      return prompt;

    } catch (error) {
      throw new Error(`Prompt generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt sensitive data (CRITICAL manifesto requirement)
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Invalid data for encryption');
      }

      // Use modern crypto API with IV for security
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Prepend IV to encrypted data
      return iv.toString('hex') + ':' + encrypted;

    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data');
      }

      // Extract IV and encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private detectCategory(headerLine: string): RuleCategory {
    const header = headerLine.toLowerCase();
    
    if (header.includes('security')) return RuleCategory.SECURITY;
    if (header.includes('performance')) return RuleCategory.PERFORMANCE;
    if (header.includes('test')) return RuleCategory.TESTING;
    if (header.includes('code') || header.includes('quality')) return RuleCategory.CODE_QUALITY;
    if (header.includes('architecture')) return RuleCategory.ARCHITECTURE;
    if (header.includes('documentation')) return RuleCategory.DOCUMENTATION;
    if (header.includes('error')) return RuleCategory.ERROR_HANDLING;
    
    return RuleCategory.GENERAL;
  }

  private detectSeverityFromHeader(header: string): RuleSeverity {
    const upperHeader = header.toUpperCase();

    if (upperHeader.includes('CRITICAL')) return RuleSeverity.CRITICAL;
    if (upperHeader.includes('MANDATORY')) return RuleSeverity.MANDATORY;
    if (upperHeader.includes('REQUIRED')) return RuleSeverity.REQUIRED;
    if (upperHeader.includes('OPTIMIZE')) return RuleSeverity.OPTIMIZE;

    return RuleSeverity.RECOMMENDED;
  }

  private detectSeverityFromRuleText(ruleText: string): RuleSeverity {
    const upperText = ruleText.toUpperCase();

    // AI directive rules are CRITICAL - they govern how to follow all other rules
    if (upperText.includes('ATTENTION AI') || upperText.includes('REMEMBER:')) return RuleSeverity.CRITICAL;

    if (upperText.includes('**CRITICAL:') || upperText.includes('**PROHIBITED:')) return RuleSeverity.CRITICAL;
    if (upperText.includes('**MANDATORY:')) return RuleSeverity.MANDATORY;
    if (upperText.includes('**REQUIRED:')) return RuleSeverity.REQUIRED;
    if (upperText.includes('**ENFORCE:')) return RuleSeverity.REQUIRED; // ENFORCE should be REQUIRED level
    if (upperText.includes('**OPTIMIZE:')) return RuleSeverity.OPTIMIZE;
    if (upperText.includes('**HANDLE:')) return RuleSeverity.REQUIRED; // HANDLE should be REQUIRED level
    if (upperText.includes('**DOCUMENT:')) return RuleSeverity.REQUIRED; // DOCUMENT should be REQUIRED level
    if (upperText.includes('**STYLE:')) return RuleSeverity.RECOMMENDED; // STYLE should be RECOMMENDED level

    return RuleSeverity.RECOMMENDED;
  }

  private parseRuleLine(line: string, lineNumber: number, category: RuleCategory, headerSeverity?: RuleSeverity): ManifestoRule | null {
    // Remove bullet points only for actual bullet points, preserve AI directives
    let cleanLine = line.trim();

    // Only remove bullet point markers for actual bullet points (- or * followed by space)
    // Do NOT remove ** from AI directives like **ATTENTION AI** or **REMEMBER:**
    if (cleanLine.match(/^[-*]\s/)) {
      cleanLine = cleanLine.replace(/^[-*]\s*/, '').trim();
    }

    if (!cleanLine) return null;

    // Detect severity from rule text first (most specific), then header severity
    let severity = this.detectSeverityFromRuleText(cleanLine);
    if (severity === RuleSeverity.RECOMMENDED && headerSeverity) {
      severity = headerSeverity;
    }

    return {
      id: `rule-${lineNumber}`,
      text: cleanLine,
      severity,
      category
    };
  }

  private async checkRule(code: string, rule: ManifestoRule): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];

    // Check specific rule patterns based on rule text
    const ruleText = rule.text.toLowerCase();

    // Check for console.log violations
    if (ruleText.includes('console.log') && code.includes('console.log')) {
      violations.push({
        ruleId: rule.id,
        ruleSeverity: rule.severity,
        message: `Code violates rule: ${rule.text}`,
        suggestion: `Remove console.log statements from production code`
      });
    }

    // Check for hardcoded credentials
    if (ruleText.includes('hardcoded') && ruleText.includes('credential')) {
      const credentialPattern = /(password|apikey|secret|token)\s*[:=]\s*['"][^'"]+['"]/i;
      if (credentialPattern.test(code)) {
        violations.push({
          ruleId: rule.id,
          ruleSeverity: rule.severity,
          message: `Code violates rule: ${rule.text}`,
          suggestion: `Use environment variables or secure configuration for credentials`
        });
      }
    }

    // Check for missing error handling in async functions
    if (ruleText.includes('error handling') && ruleText.includes('async')) {
      const asyncFunctionPattern = /async\s+function[^{]*{[^}]*}/g;
      const matches = code.match(asyncFunctionPattern);
      if (matches) {
        for (const match of matches) {
          if (!match.includes('try') && !match.includes('catch')) {
            violations.push({
              ruleId: rule.id,
              ruleSeverity: rule.severity,
              message: `Code violates rule: ${rule.text}`,
              suggestion: `Add try-catch blocks to async functions`
            });
          }
        }
      }
    }

    // If rule has a pattern, check it
    if (rule.pattern && !rule.pattern.test(code)) {
      violations.push({
        ruleId: rule.id,
        ruleSeverity: rule.severity,
        message: `Code violates rule: ${rule.text}`,
        suggestion: `Ensure your code follows: ${rule.text}`
      });
    }

    return violations;
  }

  private formatRulesForPrompt(rules: ManifestoRule[]): string {
    return rules
      .map(rule => `- **${rule.severity}**: ${rule.text}`)
      .join('\n');
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private recordPerformanceMetric(operation: string, duration: number): void {
    this.performanceMetrics.push({
      responseTime: duration,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date()
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  /**
   * Dispose resources and clear sensitive data
   * CRITICAL: Validate entire workspace for manifesto compliance
   * REQUIRED: Check all source files for violations
   */
  async validateWorkspace(): Promise<RuleViolation[]> {
    const startTime = Date.now();

    try {
      const violations: RuleViolation[] = [];

      // MANDATORY: Input validation
      const vscode = require('vscode');
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return violations;
      }

      // Find all source files
      const sourceFiles = await vscode.workspace.findFiles(
        '**/*.{ts,js,tsx,jsx,py,java,cpp,c,cs,go,rs,php}',
        '**/node_modules/**'
      );

      // Validate each file
      for (const fileUri of sourceFiles) {
        try {
          const document = await vscode.workspace.openTextDocument(fileUri);
          const fileViolations = await this.validateCode(document.getText(), fileUri.fsPath);
          violations.push(...fileViolations);
        } catch (error) {
          console.error(`Error validating file ${fileUri.fsPath}:`, error);
        }
      }

      // OPTIMIZE: Track performance
      const duration = Date.now() - startTime;
      this.performanceMetrics.push({
        responseTime: duration,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      });

      return violations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Workspace validation failed: ${errorMessage}`);
    }
  }

  /**
   * CRITICAL: Validate code content for manifesto compliance
   * REQUIRED: Check for specific rule violations
   */
  async validateCode(code: string, fileName: string): Promise<RuleViolation[]> {
    const startTime = Date.now();

    try {
      // MANDATORY: Input validation
      if (!code || typeof code !== 'string') {
        return [];
      }

      if (!fileName || typeof fileName !== 'string') {
        fileName = 'unknown';
      }

      const violations: RuleViolation[] = [];
      const lines = code.split('\n');

      // Check for manifesto violations
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // CRITICAL: Check for security violations
        if (line.includes('innerHTML') && !line.includes('// SECURITY:')) {
          violations.push({
            ruleId: 'security-innerHTML',
            ruleSeverity: RuleSeverity.CRITICAL,
            message: 'Use of innerHTML without security comment - potential XSS vulnerability',
            line: lineNumber,
            column: line.indexOf('innerHTML')
          });
        }

        // MANDATORY: Check for missing error handling
        if (line.includes('function ') && !this.hasErrorHandling(lines, i)) {
          violations.push({
            ruleId: 'missing-error-handling',
            ruleSeverity: RuleSeverity.MANDATORY,
            message: 'Function missing try-catch error handling',
            line: lineNumber,
            column: 0
          });
        }

        // REQUIRED: Check for missing JSDoc
        if (line.includes('function ') && !this.hasJSDoc(lines, i)) {
          violations.push({
            ruleId: 'missing-jsdoc',
            ruleSeverity: RuleSeverity.REQUIRED,
            message: 'Function missing JSDoc documentation',
            line: lineNumber,
            column: 0
          });
        }
      }

      // OPTIMIZE: Track performance
      const duration = Date.now() - startTime;
      this.performanceMetrics.push({
        responseTime: duration,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date()
      });

      return violations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Code validation failed: ${errorMessage}`);
    }
  }

  /**
   * HELPER: Check if function has error handling
   */
  private hasErrorHandling(lines: string[], functionLineIndex: number): boolean {
    try {
      // Look for try-catch in the next 20 lines
      const searchEnd = Math.min(functionLineIndex + 20, lines.length);
      for (let i = functionLineIndex; i < searchEnd; i++) {
        if (lines[i].includes('try') && lines[i].includes('{')) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * HELPER: Check if function has JSDoc
   */
  private hasJSDoc(lines: string[], functionLineIndex: number): boolean {
    try {
      // Look for JSDoc in the previous 10 lines
      const searchStart = Math.max(functionLineIndex - 10, 0);
      for (let i = searchStart; i < functionLineIndex; i++) {
        if (lines[i].includes('/**') || lines[i].includes('* @')) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * MANDATORY: Proper resource disposal
   */
  dispose(): void {
    try {
      // Clear performance metrics
      this.performanceMetrics = [];

      // Clear encryption key (security requirement)
      this.encryptionKey = '';

      console.log('ManifestoEngine disposed successfully');
    } catch (error) {
      console.error('Error disposing ManifestoEngine:', error);
    }
  }
}
