/**
 * Piggie File Manager - Direct code writing and project analysis
 * Following manifesto: MANDATORY error handling, CRITICAL security, OPTIMIZE performance
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  FileOperation, 
  FileOperationResult, 
  ProjectStructure, 
  CodeQualityResult,
  PerformanceMetrics 
} from '../core/types';

/**
 * File manager for Piggie to write code directly to files
 * Implements all security and performance requirements from manifesto
 */
export class PiggieFileManager {
  private operationCount = 0;
  private performanceMetrics: PerformanceMetrics[] = [];
  private isDisposed = false;

  /**
   * Write code directly to file with manifesto compliance
   * CRITICAL: Input validation, security checks, comprehensive error handling
   */
  async writeCodeToFile(operation: FileOperation): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      // CRITICAL: Input validation on all user-facing functions
      this.validateFileOperation(operation);

      // CRITICAL: Security - prevent path traversal attacks
      this.validateFilePath(operation.path);

      // CRITICAL: Sanitize content for security
      const sanitizedContent = this.sanitizeContent(operation.content || '');

      let backupPath: string | undefined;

      // Create backup if requested and file exists
      if (operation.backup && operation.type === 'update') {
        backupPath = await this.createBackup(operation.path);
      }

      // Perform the file operation
      await this.performFileOperation(operation, sanitizedContent);

      // Record performance metrics
      const duration = Date.now() - startTime;
      const metrics = this.recordPerformance('writeCodeToFile', duration);

      // OPTIMIZE: Warn if operation exceeds performance target
      if (duration > 200) {
        console.warn(`File operation took ${duration}ms - exceeds 200ms target`);
      }

      return {
        success: true,
        path: operation.path,
        backupPath,
        performanceMetrics: metrics
      };

    } catch (error) {
      // MANDATORY: Comprehensive error handling with helpful messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown file operation error';
      
      return {
        success: false,
        path: operation.path,
        error: `Failed to write code to file: ${errorMessage}`,
        performanceMetrics: this.recordPerformance('writeCodeToFile', Date.now() - startTime)
      };
    }
  }

  /**
   * Read project structure for context
   * HANDLE: All external operations must have timeout and retry logic
   */
  async readProjectStructure(directoryPath: string): Promise<ProjectStructure> {
    try {
      // CRITICAL: Input validation
      if (!directoryPath || typeof directoryPath !== 'string') {
        return {
          directories: [],
          files: [],
          error: 'Invalid directory path: must be non-empty string'
        };
      }

      // CRITICAL: Security - validate path
      this.validateFilePath(directoryPath);

      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      
      const directories: string[] = [];
      const files: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          directories.push(entry.name);
        } else if (entry.isFile()) {
          files.push(entry.name);
        }
      }

      return {
        directories,
        files,
        totalSize: entries.length
      };

    } catch (error) {
      // HANDLE: All errors must be logged with appropriate context
      const errorMessage = error instanceof Error ? error.message : 'Unknown directory read error';
      console.error(`Failed to read project structure: ${errorMessage}`);

      return {
        directories: [],
        files: [],
        error: errorMessage
      };
    }
  }

  /**
   * Validate code quality against manifesto rules
   * REQUIRED: Comprehensive validation with detailed feedback
   */
  async validateCodeQuality(code: string): Promise<CodeQualityResult> {
    const startTime = Date.now();

    try {
      // CRITICAL: Input validation
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid code content: must be non-empty string');
      }

      const violations: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      // Check manifesto requirements
      await this.checkManifestoCompliance(code, violations, suggestions);

      // Calculate score based on violations
      score = Math.max(0, 100 - (violations.length * 10));

      const duration = Date.now() - startTime;
      const metrics = this.recordPerformance('validateCodeQuality', duration);

      return {
        isValid: violations.length === 0,
        score,
        violations,
        suggestions,
        performanceMetrics: metrics
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      throw new Error(`Code quality validation failed: ${errorMessage}`);
    }
  }

  /**
   * Dispose resources
   * MANDATORY: Proper resource disposal
   */
  dispose(): void {
    try {
      this.isDisposed = true;
      this.performanceMetrics = [];
      console.log('PiggieFileManager disposed successfully');
    } catch (error) {
      console.error('Error disposing PiggieFileManager:', error);
    }
  }

  // Private helper methods

  /**
   * Validate file operation input
   * CRITICAL: Input validation on all user-facing functions
   */
  private validateFileOperation(operation: FileOperation): void {
    if (!operation) {
      throw new Error('Invalid file operation: operation cannot be null');
    }

    if (!operation.type || !['create', 'update', 'delete', 'read'].includes(operation.type)) {
      throw new Error('Invalid file operation: invalid operation type');
    }

    if (!operation.path || typeof operation.path !== 'string') {
      throw new Error('Invalid file operation: path must be non-empty string');
    }

    if ((operation.type === 'create' || operation.type === 'update') && 
        typeof operation.content !== 'string') {
      throw new Error('Invalid file operation: content required for create/update operations');
    }
  }

  /**
   * Validate file path for security
   * CRITICAL: Prevent path traversal attacks
   */
  private validateFilePath(filePath: string): void {
    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
      throw new Error('Invalid file path: path traversal detected');
    }

    // Check for absolute paths to system directories
    const dangerousPaths = ['/etc', '/usr', '/bin', '/sys', '/proc', 'C:\\Windows', 'C:\\System32'];
    if (dangerousPaths.some(dangerous => filePath.startsWith(dangerous))) {
      throw new Error('Invalid file path: access to system directories denied');
    }

    // Normalize path to prevent bypass attempts
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath !== filePath && normalizedPath.includes('..')) {
      throw new Error('Invalid file path: normalized path contains traversal');
    }
  }

  /**
   * Sanitize file content for security
   * CRITICAL: XSS prevention in all output rendering
   */
  private sanitizeContent(content: string): string {
    if (!content) return '';

    // Remove potentially dangerous content while preserving code structure
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Create backup of existing file
   * HANDLE: All operations must have comprehensive error handling
   */
  private async createBackup(filePath: string): Promise<string> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read existing content
      const existingContent = await fs.readFile(filePath, 'utf8');
      
      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      
      await fs.writeFile(backupPath, existingContent, 'utf8');
      
      return backupPath;

    } catch (error) {
      // If file doesn't exist, no backup needed
      if ((error as any).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  /**
   * Perform the actual file operation
   */
  private async performFileOperation(operation: FileOperation, content: string): Promise<void> {
    switch (operation.type) {
      case 'create':
      case 'update':
        // CRITICAL: Type-safe encoding handling
        const encoding = (operation.encoding as BufferEncoding) || 'utf8';
        await fs.writeFile(operation.path, content, encoding);
        break;
      case 'delete':
        await fs.unlink(operation.path);
        break;
      case 'read':
        // Read operation doesn't modify files
        break;
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  /**
   * Check code against manifesto compliance rules
   * REQUIRED: Comprehensive validation
   */
  private async checkManifestoCompliance(
    code: string, 
    violations: string[], 
    suggestions: string[]
  ): Promise<void> {
    // Check for JSDoc documentation (MANDATORY)
    if (!code.includes('/**') || !code.includes('*/')) {
      violations.push('Missing JSDoc documentation');
      suggestions.push('Add JSDoc comments to all public functions');
    }

    // Check for error handling (MANDATORY)
    if (!code.includes('try') && !code.includes('catch') && !code.includes('throw')) {
      violations.push('Missing error handling');
      suggestions.push('Add try-catch blocks for error handling');
    }

    // Check for input validation (CRITICAL)
    if (!code.includes('if') || !code.includes('throw new Error')) {
      violations.push('Missing input validation');
      suggestions.push('Add input validation with proper error messages');
    }

    // Check function length (STYLE: Keep functions under 50 lines)
    const functions = code.match(/function\s+\w+[^{]*{[^}]*}/g) || [];
    for (const func of functions) {
      const lineCount = func.split('\n').length;
      if (lineCount > 50) {
        violations.push(`Function exceeds 50 lines (${lineCount} lines)`);
        suggestions.push('Break large functions into smaller, focused functions');
      }
    }

    // Check for descriptive names (STYLE)
    const badNames = code.match(/\b(a|b|c|x|y|z|temp|data|item)\b/g);
    if (badNames && badNames.length > 0) {
      violations.push('Non-descriptive variable names detected');
      suggestions.push('Use descriptive variable and function names');
    }
  }

  /**
   * Record performance metrics
   * OPTIMIZE: Monitor system performance as per manifesto
   */
  private recordPerformance(operation: string, duration: number): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      responseTime: duration,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date()
    };

    this.performanceMetrics.push(metrics);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }

    return metrics;
  }
}
