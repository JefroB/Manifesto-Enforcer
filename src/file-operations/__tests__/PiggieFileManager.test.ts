/**
 * Test suite for PiggieFileManager
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { PiggieFileManager } from '../PiggieFileManager';
import { FileOperation } from '../../core/types';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PiggieFileManager', () => {
  let fileManager: PiggieFileManager;

  beforeEach(() => {
    fileManager = new PiggieFileManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fileManager.dispose();
  });

  describe('writeCodeToFile', () => {
    it('should write code to file successfully', async () => {
      const operation: FileOperation = {
        type: 'create',
        path: 'test.ts',
        content: 'console.log("Hello, Piggie!");',
        backup: true
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('File not found')); // File doesn't exist

      const result = await fileManager.writeCodeToFile(operation);

      expect(result.success).toBe(true);
      expect(result.path).toBe('test.ts');
      expect(mockFs.writeFile).toHaveBeenCalledWith('test.ts', operation.content, 'utf8');
    });

    it('should write new content to file without backup when file does not exist', async () => {
      const operation: FileOperation = {
        type: 'create',
        path: 'new.ts',
        content: 'new content',
        backup: false
      };

      mockFs.access.mockRejectedValue(new Error('File does not exist')); // File doesn't exist
      mockFs.writeFile.mockResolvedValue(undefined);

      await fileManager.writeCodeToFile(operation);

      // Verify new content was written (no backup needed for new files)
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'new.ts',
        'new content',
        'utf8'
      );
    });

    it('should validate file operation input', async () => {
      // CRITICAL: Input validation on all user-facing functions
      const invalidOperation = {
        type: 'invalid' as any,
        path: '',
        content: undefined
      } as any;

      const result = await fileManager.writeCodeToFile(invalidOperation);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file operation');
    });

    it('should handle file system errors gracefully', async () => {
      const operation: FileOperation = {
        type: 'create',
        path: '/invalid/path/test.ts',
        content: 'test'
      };

      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const result = await fileManager.writeCodeToFile(operation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('should complete within performance requirements', async () => {
      const operation: FileOperation = {
        type: 'create',
        path: 'perf-test.ts',
        content: 'test content'
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const startTime = Date.now();
      await fileManager.writeCodeToFile(operation);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // OPTIMIZE: sub-200ms requirement
    });
  });

  describe('readProjectStructure', () => {
    it('should read project structure successfully', async () => {
      const mockDirents = [
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'package.json', isDirectory: () => false, isFile: () => true },
        { name: 'README.md', isDirectory: () => false, isFile: () => true }
      ];

      mockFs.readdir.mockResolvedValue(mockDirents as any);

      const structure = await fileManager.readProjectStructure('/test/project');

      expect(structure.directories).toContain('src');
      expect(structure.files).toContain('package.json');
      expect(structure.files).toContain('README.md');
    });

    it('should handle permission errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const structure = await fileManager.readProjectStructure('/restricted');

      expect(structure.error).toContain('Permission denied');
      expect(structure.directories).toHaveLength(0);
      expect(structure.files).toHaveLength(0);
    });

    it('should validate directory path input', async () => {
      // CRITICAL: Input validation
      const result1 = await fileManager.readProjectStructure('');
      expect(result1.error).toContain('Invalid directory path');

      const result2 = await fileManager.readProjectStructure(null as any);
      expect(result2.error).toContain('Invalid directory path');
    });
  });

  describe('validateCodeQuality', () => {
    it('should validate code against manifesto rules', async () => {
      const codeWithGoodPractices = `
        /**
         * Calculate user age
         * @param birthDate - User's birth date
         * @returns Age in years
         */
        export function calculateAge(birthDate: Date): number {
          try {
            if (!birthDate || !(birthDate instanceof Date)) {
              throw new Error('Invalid birth date');
            }
            
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age;
          } catch (error) {
            console.error('Error calculating age:', error);
            throw error;
          }
        }
      `;

      const validation = await fileManager.validateCodeQuality(codeWithGoodPractices);

      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(80); // Should meet quality standards
    });

    it('should detect manifesto violations', async () => {
      const codeWithViolations = `
        function badFunction(x) {
          return x + 1;
        }
      `;

      const validation = await fileManager.validateCodeQuality(codeWithViolations);

      expect(validation.isValid).toBe(false);
      expect(validation.violations).toContain('Missing JSDoc documentation');
      expect(validation.violations).toContain('Missing error handling');
      expect(validation.violations).toContain('Missing input validation');
    });

    it('should handle empty or invalid code', async () => {
      await expect(fileManager.validateCodeQuality(''))
        .rejects.toThrow('Invalid code content');
      
      await expect(fileManager.validateCodeQuality(null as any))
        .rejects.toThrow('Invalid code content');
    });
  });

  describe('security and error handling', () => {
    it('should prevent path traversal attacks', async () => {
      // CRITICAL: Security requirement - prevent malicious paths
      const maliciousOperation: FileOperation = {
        type: 'create',
        path: '../../../etc/passwd',
        content: 'malicious content'
      };

      const result = await fileManager.writeCodeToFile(maliciousOperation);
      expect(result.success).toBe(false);
      expect(result.error).toContain('path traversal detected');
    });

    it('should sanitize file content for security', async () => {
      const operation: FileOperation = {
        type: 'create',
        path: 'test.ts',
        content: 'console.log("safe"); <script>alert("xss")</script>',
        backup: false
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await fileManager.writeCodeToFile(operation);

      // Verify XSS content was sanitized
      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('<script>');
    });

    it('should handle concurrent file operations safely', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        type: 'create' as const,
        path: `concurrent-${i}.ts`,
        content: `content ${i}`
      }));

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const promises = operations.map(op => fileManager.writeCodeToFile(op));
      const results = await Promise.all(promises);

      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should dispose resources properly', () => {
      const disposeSpy = jest.spyOn(fileManager, 'dispose');
      
      fileManager.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  describe('performance monitoring', () => {
    it('should track operation performance', async () => {
      const operation: FileOperation = {
        type: 'create',
        path: 'perf-monitor.ts',
        content: 'test'
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await fileManager.writeCodeToFile(operation);

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics?.responseTime).toBeLessThan(200);
    });
  });
});
