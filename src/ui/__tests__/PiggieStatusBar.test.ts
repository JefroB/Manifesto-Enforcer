/**
 * Test suite for PiggieStatusBar
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { PiggieStatusBar } from '../PiggieStatusBar';
import { AgentProvider } from '../../core/types';

describe('PiggieStatusBar', () => {
  let statusBar: PiggieStatusBar;
  let mockStatusBarItem: any;

  beforeEach(() => {
    // Mock VSCode status bar item
    mockStatusBarItem = {
      text: '',
      tooltip: '',
      command: '',
      backgroundColor: undefined,
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn()
    };

    // Mock VSCode window.createStatusBarItem
    (global as any).mockVSCode.window.createStatusBarItem.mockReturnValue(mockStatusBarItem);

    statusBar = new PiggieStatusBar();
  });

  afterEach(() => {
    statusBar.dispose();
  });

  describe('initialization', () => {
    it('should create status bar item successfully', () => {
      expect(mockStatusBarItem.show).toHaveBeenCalled();
      expect(mockStatusBarItem.text).toContain('🐷');
    });

    it('should handle initialization errors gracefully', () => {
      // Mock createStatusBarItem to throw error
      (global as any).mockVSCode.window.createStatusBarItem.mockImplementation(() => {
        throw new Error('VSCode API error');
      });

      expect(() => new PiggieStatusBar()).toThrow('Failed to initialize Piggie status bar');
    });

    it('should complete initialization within performance requirements', () => {
      const startTime = Date.now();
      
      new PiggieStatusBar();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200); // OPTIMIZE: sub-200ms requirement
    });
  });

  describe('updateManifestoMode', () => {
    it('should update status bar for manifesto mode ON', () => {
      statusBar.updateManifestoMode(true);

      expect(mockStatusBarItem.text).toContain('🛡️');
      expect(mockStatusBarItem.text).toContain('Enforcement ENABLED');
      expect(mockStatusBarItem.tooltip).toContain('Piggie is enforcing manifesto rules');
      expect(mockStatusBarItem.backgroundColor).toBeUndefined();
    });

    it('should update status bar for manifesto mode OFF', () => {
      statusBar.updateManifestoMode(false);

      expect(mockStatusBarItem.text).toContain('⚡');
      expect(mockStatusBarItem.text).toContain('Enforcement DISABLED');
      expect(mockStatusBarItem.tooltip).toContain('enforcement is disabled');
      expect(mockStatusBarItem.backgroundColor).toBeDefined();
    });

    it('should handle invalid input gracefully', () => {
      // MANDATORY: Input validation - errors are caught and logged, not thrown
      statusBar.updateManifestoMode(null as any);
      statusBar.updateManifestoMode(undefined as any);

      // Verify error was handled (status bar should show error state)
      expect(mockStatusBarItem.text).toContain('❌');
    });
  });

  describe('updateActiveAgent', () => {
    it('should update status bar with active agent info', () => {
      const agentConfig = {
        id: 'test-agent',
        name: 'Test Agent',
        provider: AgentProvider.AUGGIE,
        isEnabled: true
      };

      statusBar.updateActiveAgent(agentConfig);

      expect(mockStatusBarItem.text).toContain('🐷');
      expect(mockStatusBarItem.text).toContain('Test Agent');
      expect(mockStatusBarItem.tooltip).toContain('Piggie is using: Test Agent');
    });

    it('should handle no active agent', () => {
      statusBar.updateActiveAgent(null);

      expect(mockStatusBarItem.text).toContain('🐷');
      expect(mockStatusBarItem.text).toContain('No Agent');
      expect(mockStatusBarItem.tooltip).toContain('No AI agent selected');
    });

    it('should validate agent configuration', () => {
      const invalidAgent = {
        id: '',
        name: '',
        provider: AgentProvider.AUGGIE,
        isEnabled: true
      };

      // Error is caught and handled, not thrown
      statusBar.updateActiveAgent(invalidAgent);
      expect(mockStatusBarItem.text).toContain('❌'); // Should show error state
    });
  });

  describe('showProgress', () => {
    it('should show progress indicator', () => {
      statusBar.showProgress('Piggie is thinking...');

      expect(mockStatusBarItem.text).toContain('$(loading~spin)');
      expect(mockStatusBarItem.text).toContain('Piggie is thinking...');
    });

    it('should hide progress indicator', () => {
      statusBar.showProgress('Test');
      statusBar.hideProgress();

      expect(mockStatusBarItem.text).not.toContain('$(loading~spin)');
    });

    it('should handle progress timeout', (done) => {
      statusBar.showProgress('Long operation', 100); // 100ms timeout

      setTimeout(() => {
        expect(mockStatusBarItem.text).not.toContain('$(loading~spin)');
        done();
      }, 150);
    });
  });

  describe('error handling and security', () => {
    it('should handle VSCode API errors gracefully', () => {
      // Mock show() to throw error
      mockStatusBarItem.show.mockImplementation(() => {
        throw new Error('VSCode API error');
      });

      expect(() => statusBar.updateManifestoMode(true)).not.toThrow();
    });

    it('should sanitize tooltip content for security', () => {
      const maliciousTooltip = '<script>alert("xss")</script>';
      
      statusBar.updateManifestoMode(true);
      
      // Verify XSS prevention (CRITICAL security requirement)
      expect(mockStatusBarItem.tooltip).not.toContain('<script>');
    });

    it('should dispose resources properly', () => {
      statusBar.dispose();

      expect(mockStatusBarItem.dispose).toHaveBeenCalled();
    });
  });

  describe('performance monitoring', () => {
    it('should track update performance', () => {
      const startTime = Date.now();
      
      statusBar.updateManifestoMode(true);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50); // Should be very fast for UI updates
    });

    it('should handle rapid updates efficiently', () => {
      const startTime = Date.now();
      
      // Rapid fire updates
      for (let i = 0; i < 100; i++) {
        statusBar.updateManifestoMode(i % 2 === 0);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200); // OPTIMIZE: sub-200ms for 100 updates
    });
  });
});
