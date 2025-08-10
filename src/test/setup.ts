/**
 * Test setup file for Manifesto Code Assistant Pro
 * Following manifesto: comprehensive error handling and testing requirements
 */

// Mock VSCode API for testing
const mockVSCode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createStatusBarItem: jest.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn()
    })),
    registerTreeDataProvider: jest.fn()
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn()
    })),
    workspaceFolders: [],
    onDidChangeConfiguration: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  env: {
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn()
    }
  },
  Uri: {
    file: jest.fn(),
    joinPath: jest.fn()
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  ThemeColor: jest.fn().mockImplementation((id: string) => ({ id }))  // Mock ThemeColor constructor
};

// Mock crypto module for testing
jest.mock('crypto', () => ({
  scryptSync: jest.fn(() => Buffer.from('test-key-32-bytes-long-for-aes256', 'utf8')),
  randomBytes: jest.fn(() => Buffer.from('1234567890123456', 'utf8')), // 16 bytes for IV
  createCipheriv: jest.fn(() => ({
    update: jest.fn(() => 'encrypteddata'),
    final: jest.fn(() => 'final')
  })),
  createDecipheriv: jest.fn(() => ({
    update: jest.fn(() => 'decrypteddata'),
    final: jest.fn(() => 'final')
  }))
}));

// Global mock for vscode module
jest.mock('vscode', () => mockVSCode, { virtual: true });

// Global test utilities - simple assignment
(global as any).mockVSCode = mockVSCode;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Performance monitoring (manifesto requirement: sub-200ms operations)
let testStartTime: number;

beforeEach(() => {
  testStartTime = Date.now();
});

afterEach(() => {
  const testDuration = Date.now() - testStartTime;
  if (testDuration > 200) {
    console.warn(`Test took ${testDuration}ms - exceeds 200ms performance requirement`);
  }
});
