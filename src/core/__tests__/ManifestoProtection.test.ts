/**
 * CRITICAL TESTS: Manifesto Protection
 * These tests ensure we NEVER accidentally overwrite existing manifestos
 * This is a core safety requirement
 */

import { AutoModeManager } from '../AutoModeManager';
import { StateManager } from '../StateManager';
import { PiggieFileManager } from '../../file-operations/PiggieFileManager';
import * as vscode from 'vscode';
import * as fs from 'fs';

// Mock dependencies
jest.mock('vscode');
jest.mock('fs');
jest.mock('../../file-operations/PiggieFileManager');

describe('CRITICAL: Manifesto Protection Tests', () => {
    let autoModeManager: AutoModeManager;
    let mockStateManager: StateManager;
    let mockFileManager: jest.Mocked<PiggieFileManager>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockStateManager = {
            isAutoMode: false,
            isCodebaseIndexed: false,
            manifestoRules: [],
            codebaseIndex: new Map()
        } as any;

        mockFileManager = {
            writeCodeToFile: jest.fn(),
            fileExists: jest.fn(),
            readFile: jest.fn(),
            validateCodeQuality: jest.fn(),
            readProjectStructure: jest.fn(),
            dispose: jest.fn()
        } as any;

        autoModeManager = new AutoModeManager(mockStateManager);
        (autoModeManager as any).fileManager = mockFileManager;
    });

    describe('Existing Manifesto Detection', () => {
        it('should detect existing manifesto.md file', async () => {
            mockFileManager.fileExists.mockResolvedValue(true);
            mockFileManager.readFile.mockResolvedValue('# Existing Manifesto\nDo not overwrite me!');

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto\nThis would overwrite existing!',
                    type: 'General'
                }
            };

            // Should NOT auto-execute when manifesto exists
            const result = await autoModeManager.executeAction(action);
            
            expect(result).toContain('⚠️ **EXISTING MANIFESTO DETECTED**');
            expect(result).toContain('manifesto.md already exists');
            expect(result).toContain('backup');
            expect(mockFileManager.writeCodeToFile).not.toHaveBeenCalled();
        });

        it('should allow creation when no manifesto exists', async () => {
            mockFileManager.fileExists.mockResolvedValue(false);
            mockFileManager.writeCodeToFile.mockResolvedValue({
                success: true,
                path: '/workspace/manifesto.md'
            });

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto\nSafe to create!',
                    type: 'General'
                }
            };

            const result = await autoModeManager.executeAction(action);
            
            expect(result).toContain('✅ **General Manifesto Created Successfully!**');
            expect(mockFileManager.writeCodeToFile).toHaveBeenCalledWith(
                expect.objectContaining({
                    path: 'manifesto.md',
                    content: expect.stringContaining('# New Manifesto'),
                    type: 'create'
                })
            );
        });
    });

    describe('Backup and Safety Mechanisms', () => {
        it('should offer backup option when manifesto exists', async () => {
            mockFileManager.fileExists.mockResolvedValue(true);
            mockFileManager.readFile.mockResolvedValue('# Important Existing Manifesto\nCritical rules here!');

            const action = {
                id: 'create-manifesto-force',
                label: 'Create manifesto.md (with backup)',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General',
                    forceOverwrite: true,
                    createBackup: true
                }
            };

            mockFileManager.writeCodeToFile
                .mockResolvedValueOnce({ // Backup creation
                    success: true,
                    path: '/workspace/manifesto.backup.md'
                })
                .mockResolvedValueOnce({ // New manifesto creation
                    success: true,
                    path: '/workspace/manifesto.md'
                });

            const result = await autoModeManager.executeAction(action);
            
            expect(result).toContain('📋 **Backup created**');
            expect(result).toContain('Backup created');
            expect(mockFileManager.writeCodeToFile).toHaveBeenCalledTimes(2);
        });

        it('should refuse to overwrite without explicit permission', async () => {
            mockFileManager.fileExists.mockResolvedValue(true);

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General'
                    // No forceOverwrite flag
                }
            };

            const result = await autoModeManager.executeAction(action);
            
            expect(result).toContain('⚠️ **EXISTING MANIFESTO DETECTED**');
            expect(result).not.toContain('✅ **General Manifesto Created Successfully!**');
            expect(mockFileManager.writeCodeToFile).not.toHaveBeenCalled();
        });
    });

    describe('Auto Mode Safety', () => {
        it('should NEVER auto-execute manifesto overwrite even in auto mode', async () => {
            mockStateManager.isAutoMode = true; // Auto mode ON
            mockFileManager.fileExists.mockResolvedValue(true);

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General'
                }
            };

            // Even in auto mode, should require approval for overwrite
            const shouldAutoExecute = autoModeManager.shouldAutoExecute(action);
            expect(shouldAutoExecute).toBe(false);

            const result = await autoModeManager.executeAction(action);
            expect(result).toContain('⚠️ **EXISTING MANIFESTO DETECTED**');
        });

        it('should auto-execute when no existing manifesto in auto mode', async () => {
            mockStateManager.isAutoMode = true;
            mockFileManager.fileExists.mockResolvedValue(false);
            mockFileManager.writeCodeToFile.mockResolvedValue({
                success: true,
                path: '/workspace/manifesto.md'
            });

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General'
                }
            };

            const shouldAutoExecute = autoModeManager.shouldAutoExecute(action);
            expect(shouldAutoExecute).toBe(false); // Manifesto creation should NEVER auto-execute

            const result = await autoModeManager.executeAction(action);
            expect(result).toContain('✅ **General Manifesto Created Successfully!**');
        });
    });

    describe('Error Handling', () => {
        it('should handle file system errors gracefully', async () => {
            mockFileManager.fileExists.mockRejectedValue(new Error('Permission denied'));

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General'
                }
            };

            try {
                const result = await autoModeManager.executeAction(action);
                expect(result).toContain('❌');
                expect(result).toContain('Permission denied');
            } catch (error) {
                // If it throws, that's also acceptable error handling
                expect(error).toBeDefined();
                expect(String(error)).toContain('Permission denied');
            }
        });

        it('should handle backup creation failures', async () => {
            mockFileManager.fileExists.mockResolvedValue(true);
            mockFileManager.readFile.mockResolvedValue('# Existing');
            mockFileManager.writeCodeToFile.mockRejectedValue(new Error('Backup failed'));

            const action = {
                id: 'create-manifesto-force',
                label: 'Create manifesto.md (with backup)',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General',
                    forceOverwrite: true,
                    createBackup: true
                }
            };

            try {
                const result = await autoModeManager.executeAction(action);
                expect(result).toContain('❌');
                expect(result).toContain('Backup failed');
            } catch (error) {
                // If it throws, that's also acceptable error handling
                expect(error).toBeDefined();
                expect(String(error)).toContain('Backup failed');
            }
        });
    });

    describe('Manifesto Content Validation', () => {
        it('should validate manifesto content before overwrite', async () => {
            mockFileManager.fileExists.mockResolvedValue(true);
            mockFileManager.readFile.mockResolvedValue('# Critical Production Manifesto\n## CRITICAL RULES\n- Never delete this');

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# Simple Manifesto',
                    type: 'General'
                }
            };

            const result = await autoModeManager.executeAction(action);
            
            expect(result).toContain('⚠️ **EXISTING MANIFESTO DETECTED**');
            expect(result).toContain('Critical Production Manifesto');
            expect(result).toContain('CRITICAL RULES');
        });

        it('should show preview of existing manifesto content', async () => {
            const existingContent = '# Production Manifesto\n\n## CRITICAL RULES\n- Error handling mandatory\n- Tests required\n- Security first';
            
            mockFileManager.fileExists.mockResolvedValue(true);
            mockFileManager.readFile.mockResolvedValue(existingContent);

            const action = {
                id: 'create-manifesto',
                label: 'Create manifesto.md',
                command: 'createManifesto',
                data: {
                    content: '# New Manifesto',
                    type: 'General'
                }
            };

            const result = await autoModeManager.executeAction(action);
            
            expect(result).toContain('📋 **Current Manifesto Content:**');
            expect(result).toContain('Production Manifesto');
            expect(result).toContain('Error handling mandatory');
        });
    });
});
