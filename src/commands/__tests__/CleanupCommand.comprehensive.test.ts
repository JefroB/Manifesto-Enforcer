/**
 * Comprehensive Tests for CleanupCommand
 * Following manifesto: REQUIRED unit tests for all business logic, MANDATORY error handling
 */

import { CleanupCommand } from '../CleanupCommand';
import { StateManager } from '../../core/StateManager';
import { AgentManager } from '../../agents/AgentManager';

// Mock StateManager
const mockStateManager = {
    getPiggieDirectory: jest.fn(),
    performStrategicCleanup: jest.fn()
} as any;

// Mock AgentManager
const mockAgentManager = {
    sendMessage: jest.fn()
} as any;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('CleanupCommand', () => {
    let command: CleanupCommand;
    let mockConsoleLog: jest.SpyInstance;
    let mockConsoleError: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new CleanupCommand();
        
        // Mock console methods
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Reset StateManager mocks
        mockStateManager.getPiggieDirectory.mockReturnValue('/test/piggie');
        mockStateManager.performStrategicCleanup.mockResolvedValue(undefined);
    });

    afterEach(() => {
        // Restore console methods
        mockConsoleLog.mockRestore();
        mockConsoleError.mockRestore();
    });

    describe('command property', () => {
        it('should have correct command name', () => {
            expect(command.command).toBe('/cleanup');
        });
    });

    describe('canHandle', () => {
        it('should handle cleanup slash command', () => {
            expect(command.canHandle('/cleanup')).toBe(true);
        });

        it('should handle natural language cleanup requests', () => {
            expect(command.canHandle('cleanup')).toBe(true);
            expect(command.canHandle('clean up')).toBe(true);
            expect(command.canHandle('clean repository')).toBe(true);
            expect(command.canHandle('remove piggie files')).toBe(true);
            expect(command.canHandle('clean piggie')).toBe(true);
            expect(command.canHandle('cleanup backups')).toBe(true);
        });

        it('should handle case insensitive input', () => {
            expect(command.canHandle('CLEANUP')).toBe(true);
            expect(command.canHandle('Clean Up')).toBe(true);
            expect(command.canHandle('CLEAN REPOSITORY')).toBe(true);
        });

        it('should handle input with extra whitespace', () => {
            expect(command.canHandle('  cleanup  ')).toBe(true);
            expect(command.canHandle('\tclean up\n')).toBe(true);
        });

        it('should not handle unrelated commands', () => {
            expect(command.canHandle('/help')).toBe(false);
            expect(command.canHandle('create new file')).toBe(false);
            expect(command.canHandle('random text')).toBe(false);
        });
    });

    describe('execute', () => {
        describe('backup-only cleanup', () => {
            it('should perform backup cleanup when backup keyword present', async () => {
                const result = await command.execute('cleanup backup', mockStateManager, mockAgentManager);

                expect(result).toContain('🧹 **Cleanup Complete**');
                expect(result).toContain('✅ Backup files cleaned');
                expect(result).toMatch(/\d+ms/);
                expect(mockStateManager.getPiggieDirectory).toHaveBeenCalled();
            });

            it('should handle backup cleanup with various keywords', async () => {
                const inputs = ['cleanup backups', 'clean backup files', 'remove backup'];
                
                for (const input of inputs) {
                    const result = await command.execute(input, mockStateManager, mockAgentManager);
                    expect(result).toContain('🧹 **Cleanup Complete**');
                    expect(result).toContain('✅ Backup files cleaned');
                }
            });
        });

        describe('deep cleanup', () => {
            it('should perform deep cleanup when deep keyword present', async () => {
                const result = await command.execute('cleanup deep', mockStateManager, mockAgentManager);

                expect(result).toContain('🧹 **Cleanup Complete**');
                expect(result).toContain('✅ Deep cleanup completed');
                expect(result).toMatch(/\d+ms/);
                expect(mockStateManager.performStrategicCleanup).toHaveBeenCalled();
            });

            it('should perform deep cleanup when all keyword present', async () => {
                const result = await command.execute('cleanup all', mockStateManager, mockAgentManager);

                expect(result).toContain('🧹 **Cleanup Complete**');
                expect(result).toContain('✅ Deep cleanup completed');
                expect(mockStateManager.performStrategicCleanup).toHaveBeenCalled();
            });
        });

        describe('standard cleanup', () => {
            it('should perform standard cleanup by default', async () => {
                const result = await command.execute('/cleanup', mockStateManager, mockAgentManager);

                expect(result).toContain('🧹 **Cleanup Complete**');
                expect(result).toContain('✅ Strategic cleanup completed');
                expect(result).toMatch(/\d+ms/);
                expect(mockStateManager.performStrategicCleanup).toHaveBeenCalled();
            });

            it('should perform standard cleanup for generic cleanup request', async () => {
                const result = await command.execute('clean up', mockStateManager, mockAgentManager);

                expect(result).toContain('🧹 **Cleanup Complete**');
                expect(result).toContain('✅ Strategic cleanup completed');
            });
        });

        describe('error handling', () => {
            it('should handle execution errors gracefully', async () => {
                // Mock an error in performStrategicCleanup
                mockStateManager.performStrategicCleanup.mockRejectedValue(new Error('Cleanup failed'));

                const result = await command.execute('/cleanup', mockStateManager, mockAgentManager);

                expect(result).toContain('❌ **Cleanup Failed:**');
                expect(result).toContain('Cleanup failed');
            });

            it('should handle non-Error exceptions', async () => {
                // Mock a non-Error exception
                mockStateManager.performStrategicCleanup.mockRejectedValue('String error');

                const result = await command.execute('/cleanup', mockStateManager, mockAgentManager);

                expect(result).toContain('❌ **Cleanup Failed:** Unknown cleanup error');
            });
        });

        describe('timing and performance', () => {
            it('should include execution duration in response', async () => {
                const result = await command.execute('/cleanup', mockStateManager, mockAgentManager);

                expect(result).toMatch(/\d+ms/);
            });

            it('should complete within reasonable time', async () => {
                const startTime = Date.now();
                await command.execute('/cleanup', mockStateManager, mockAgentManager);
                const duration = Date.now() - startTime;
                
                // Should complete within 1 second for mocked operations
                expect(duration).toBeLessThan(1000);
            });
        });
    });

    describe('cleanupBackups', () => {
        it('should handle successful backup cleanup', async () => {
            await command['cleanupBackups'](mockStateManager);

            expect(mockStateManager.getPiggieDirectory).toHaveBeenCalled();
            expect(mockStateManager.performStrategicCleanup).toHaveBeenCalled();
        });

        it('should handle missing piggie directory gracefully', async () => {
            mockStateManager.getPiggieDirectory.mockReturnValue(null);
            
            await command['cleanupBackups'](mockStateManager);
            
            expect(mockStateManager.getPiggieDirectory).toHaveBeenCalled();
            // Should not throw error
        });

        it('should handle cleanup errors gracefully', async () => {
            mockStateManager.getPiggieDirectory.mockImplementation(() => {
                throw new Error('Directory access failed');
            });

            await expect(command['cleanupBackups'](mockStateManager)).rejects.toThrow('Failed to clean up backup files');

            expect(mockConsoleError).toHaveBeenCalledWith(
                'Backup cleanup failed:',
                expect.any(Error)
            );
        });
    });

    describe('performDeepCleanup', () => {
        it('should perform strategic cleanup', async () => {
            await command['performDeepCleanup'](mockStateManager);

            expect(mockStateManager.performStrategicCleanup).toHaveBeenCalled();
            expect(mockConsoleLog).toHaveBeenCalledWith('🧹 Temporary files cleanup completed');
            expect(mockConsoleLog).toHaveBeenCalledWith('🧹 Log files cleanup completed');
        });

        it('should handle strategic cleanup errors', async () => {
            mockStateManager.performStrategicCleanup.mockRejectedValue(new Error('Strategic cleanup failed'));

            await expect(command['performDeepCleanup'](mockStateManager)).rejects.toThrow('Failed to perform deep cleanup');

            expect(mockConsoleError).toHaveBeenCalledWith(
                'Deep cleanup failed:',
                expect.any(Error)
            );
        });
    });

    describe('cleanupTempFiles', () => {
        it('should complete temp files cleanup', async () => {
            await command['cleanupTempFiles']();
            
            expect(mockConsoleLog).toHaveBeenCalledWith('🧹 Temporary files cleanup completed');
        });

        it('should handle temp cleanup errors gracefully', async () => {
            // Mock console.log to throw an error (simulating file system error)
            mockConsoleLog.mockImplementation(() => {
                throw new Error('File system error');
            });

            await command['cleanupTempFiles']();

            // The error is caught and logged with console.warn, not console.error
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe('cleanupLogFiles', () => {
        it('should complete log files cleanup', async () => {
            await command['cleanupLogFiles']();
            
            expect(mockConsoleLog).toHaveBeenCalledWith('🧹 Log files cleanup completed');
        });

        it('should handle log cleanup errors gracefully', async () => {
            // Mock console.log to throw an error (simulating file system error)
            mockConsoleLog.mockImplementation(() => {
                throw new Error('Log cleanup error');
            });

            await command['cleanupLogFiles']();

            // The error is caught and logged with console.warn, not console.error
            expect(mockConsoleError).not.toHaveBeenCalled();
        });
    });

    describe('integration scenarios', () => {
        it('should handle complete cleanup workflow', async () => {
            const result = await command.execute('deep cleanup all', mockStateManager, mockAgentManager);

            expect(result).toContain('🧹 **Cleanup Complete**');
            expect(result).toContain('✅ Deep cleanup completed');
            expect(mockStateManager.performStrategicCleanup).toHaveBeenCalled();
        });

        it('should handle multiple cleanup types in sequence', async () => {
            // Test backup cleanup
            let result = await command.execute('cleanup backup', mockStateManager, mockAgentManager);
            expect(result).toContain('✅ Backup files cleaned');

            // Test deep cleanup
            result = await command.execute('cleanup deep', mockStateManager, mockAgentManager);
            expect(result).toContain('✅ Deep cleanup completed');

            // Test standard cleanup
            result = await command.execute('cleanup', mockStateManager, mockAgentManager);
            expect(result).toContain('✅ Strategic cleanup completed');
        });
    });
});
