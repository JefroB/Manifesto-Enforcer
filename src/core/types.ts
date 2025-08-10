/**
 * Core types for Manifesto Code Assistant Pro
 * Following manifesto: Use TypeScript types consistently
 */

/**
 * Severity levels for manifesto rules
 */
export enum RuleSeverity {
  CRITICAL = 'CRITICAL',
  MANDATORY = 'MANDATORY', 
  REQUIRED = 'REQUIRED',
  OPTIMIZE = 'OPTIMIZE',
  RECOMMENDED = 'RECOMMENDED'
}

/**
 * Categories for organizing manifesto rules
 */
export enum RuleCategory {
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  CODE_QUALITY = 'CODE_QUALITY',
  TESTING = 'TESTING',
  ARCHITECTURE = 'ARCHITECTURE',
  DOCUMENTATION = 'DOCUMENTATION',
  ERROR_HANDLING = 'ERROR_HANDLING',
  GENERAL = 'GENERAL'
}

/**
 * Individual manifesto rule
 */
export interface ManifestoRule {
  id: string;
  text: string;
  severity: RuleSeverity;
  category: RuleCategory;
  pattern?: RegExp;
  description?: string;
  examples?: string[];
}

/**
 * Result of compliance validation
 */
export interface ComplianceResult {
  isCompliant: boolean;
  violations: RuleViolation[];
  score: number; // 0-100
  performanceMetrics: PerformanceMetrics;
}

/**
 * Individual rule violation
 */
export interface RuleViolation {
  ruleId: string;
  ruleSeverity: RuleSeverity;
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  responseTime: number; // milliseconds
  memoryUsage: number; // bytes
  timestamp: Date;
}

/**
 * AI Agent configuration
 */
export interface AgentConfig {
  id: string;
  name: string;
  provider: AgentProvider;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  isEnabled: boolean;
}

/**
 * Supported AI providers
 */
export enum AgentProvider {
  AUGGIE = 'auggie',
  AMAZON_Q = 'amazon-q',
  CLINE = 'cline',
  COPILOT = 'copilot',
  OPENAI = 'openai',
  LOCAL = 'local'
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  manifestoApplied?: boolean;
  metadata?: Record<string, any>;
}

/**
 * File operation request
 */
export interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'read';
  path: string;
  content?: string;
  encoding?: string;
  backup?: boolean;
}

/**
 * Code generation request
 */
export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  filePath?: string;
  context?: string;
  manifestoRules: ManifestoRule[];
  agentId: string;
}

/**
 * Extension configuration
 */
export interface ExtensionConfig {
  manifestoPath: string;
  defaultAgent: string;
  strictMode: boolean;
  autoWriteCode: boolean;
  performanceMonitoring: boolean;
  encryptionKey?: string;
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
  backupPath?: string;
  performanceMetrics?: PerformanceMetrics;
}

/**
 * Project structure information
 */
export interface ProjectStructure {
  directories: string[];
  files: string[];
  totalSize?: number;
  error?: string;
}

/**
 * Code quality validation result
 */
export interface CodeQualityResult {
  isValid: boolean;
  score: number; // 0-100
  violations: string[];
  suggestions: string[];
  performanceMetrics?: PerformanceMetrics;
}
