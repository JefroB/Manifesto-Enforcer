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
    showQuickPick: jest.fn(),
    showInputBox: jest.fn(),
    createStatusBarItem: jest.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn()
    })),
    registerTreeDataProvider: jest.fn(() => ({ dispose: jest.fn() })),
    registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
    createWebviewPanel: jest.fn(),
    createTerminal: jest.fn(() => ({
      sendText: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
      name: 'Test Terminal'
    }))
  },
  workspace: {
    getConfiguration: jest.fn((section?: string) => ({
      get: jest.fn((key: string, defaultValue?: any) => {
        // Return sensible defaults for StateManager initialization
        switch (key) {
          case 'manifestoMode': return true;
          case 'defaultMode': return 'chat';
          case 'autoMode': return false;
          case 'fontSize': return 14;
          case 'showEmojis': return true;
          case 'currentAgent': return 'Auggie';
          default: return defaultValue;
        }
      }),
      update: jest.fn().mockResolvedValue(undefined),
      has: jest.fn(() => true),
      inspect: jest.fn()
    })),
    workspaceFolders: [{
      uri: {
        fsPath: '/test/workspace',
        path: '/test/workspace',
        scheme: 'file'
      },
      name: 'test-workspace',
      index: 0
    }],
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    onDidOpenTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    textDocuments: [],
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    }))
  },
  commands: {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
    executeCommand: jest.fn()
  },
  languages: {
    registerCodeActionsProvider: jest.fn(() => ({
      dispose: jest.fn()
    })),
    createDiagnosticCollection: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    }))
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
  TreeItem: class MockTreeItem {
    public label: string;
    public collapsibleState: any;
    public contextValue?: string;
    public tooltip?: string;
    public description?: string;
    public iconPath?: any;
    public command?: any;

    constructor(label: string, collapsibleState?: any) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  ThemeColor: jest.fn(),
  ThemeIcon: jest.fn(),
  EventEmitter: jest.fn(() => ({
    event: jest.fn(),
    fire: jest.fn(),
    dispose: jest.fn()
  })),
  ExtensionContext: jest.fn(),
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  },
  ExtensionMode: {
    Production: 1,
    Development: 2,
    Test: 3
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
    Active: -1,
    Beside: -2
  },
  CodeActionKind: {
    QuickFix: 'quickfix',
    SourceFixAll: 'source.fixAll'
  },
  Disposable: {
    from: jest.fn(() => ({ dispose: jest.fn() }))
  },

  // Mock extensions API for testing agent adapters
  extensions: {
    all: [
      {
        id: 'augment.vscode-augment',
        isActive: true,
        packageJSON: {
          displayName: 'Augment Code',
          version: '1.0.0'
        },
        activate: jest.fn().mockResolvedValue(undefined),
        exports: {}
      }
    ],
    getExtension: jest.fn((id: string) => {
      if (id === 'augment.vscode-augment' || id === 'augment.augment' || id === 'augmentcode.augment') {
        return {
          id: 'augment.vscode-augment',
          isActive: true,
          packageJSON: {
            displayName: 'Augment Code',
            version: '1.0.0'
          },
          activate: jest.fn().mockResolvedValue(undefined),
          exports: {}
        };
      }
      return undefined;
    })
  }
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

// Performance monitoring for test diagnostics
let testStartTime: number;

beforeEach(() => {
  testStartTime = Date.now();
});

afterEach(() => {
  const testDuration = Date.now() - testStartTime;
  if (testDuration > 5000) {
    console.warn(`Test took ${testDuration}ms - unusually long test duration`);
  }
});
