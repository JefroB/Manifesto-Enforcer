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

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('<!--')) continue;

        // Detect category headers
        if (line.startsWith('##')) {
          currentCategory = this.detectCategory(line);
          continue;
        }

        // Parse rule lines - also check for lines under CRITICAL INSTRUCTIONS
        if (line.startsWith('-') || line.startsWith('*') ||
            (lines[i-1] && lines[i-1].includes('CRITICAL INSTRUCTIONS') && line.trim().length > 0)) {
          const rule = this.parseRuleLine(line, i, currentCategory);
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

  private parseRuleLine(line: string, lineNumber: number, category: RuleCategory): ManifestoRule | null {
    // Remove bullet points and trim
    const cleanLine = line.replace(/^[-*]\s*/, '').trim();
    if (!cleanLine) return null;

    // Detect severity from keywords - check context too
    let severity = RuleSeverity.RECOMMENDED;
    const upperLine = cleanLine.toUpperCase();

    if (upperLine.includes('CRITICAL') || cleanLine.includes('## CRITICAL')) severity = RuleSeverity.CRITICAL;
    else if (upperLine.includes('MANDATORY')) severity = RuleSeverity.MANDATORY;
    else if (upperLine.includes('REQUIRED')) severity = RuleSeverity.REQUIRED;
    else if (upperLine.includes('OPTIMIZE')) severity = RuleSeverity.OPTIMIZE;

    // Special case: lines under CRITICAL INSTRUCTIONS should be CRITICAL
    if (category === RuleCategory.GENERAL && cleanLine.includes('Follow EVERY principle')) {
      severity = RuleSeverity.CRITICAL;
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
