# Claude Code Security Review Request

Please perform a comprehensive security analysis of our VSCode extension using Claude Code Security Review methodology.

## Files to Analyze:

### Primary Extension File:
- `manifesto-code-assistant/src/extension.ts` (1,868 lines)

### Core Components:
- `manifesto-code-assistant/src/core/ManifestoEngine.ts`
- `manifesto-code-assistant/src/agents/AgentManager.ts`
- `manifesto-code-assistant/src/ui/PiggieStatusBar.ts`
- `manifesto-code-assistant/src/file-operations/PiggieFileManager.ts`

## Security Concerns to Focus On:

### 1. **Iframe/Webview Security Issues**
We've identified critical security vulnerabilities in logs:
```
An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing.
```

### 2. **Message Timeout Vulnerabilities**
Multiple timeout errors suggesting potential DoS or communication hijacking:
```
MessageTimeout: Request timed out: get-remote-agent-pinned-status-request
MessageTimeout: Request timed out: get-rules-list-request
MessageTimeout: Request timed out: can-show-terminal
```

### 3. **AI Agent Communication Security**
Our extension communicates with multiple AI agents - need to verify:
- Input sanitization
- Output validation
- API key handling
- Message integrity

### 4. **File System Operations**
Extension reads/writes files - check for:
- Path traversal vulnerabilities
- Permission escalation
- Arbitrary file access

### 5. **VSCode Extension Security**
Verify compliance with VSCode security model:
- Proper permission declarations
- Secure command registration
- Safe configuration handling

## Analysis Requirements:

1. **Contextual Understanding** - Understand code semantics and intent
2. **High-Impact Focus** - Exclude low-impact findings
3. **Detailed Explanations** - Why something is vulnerable and how to fix
4. **Severity Ratings** - Critical, High, Medium, Low
5. **Remediation Steps** - Specific code fixes

## Vulnerability Categories to Check:

- **Injection Attacks**: Command injection, path traversal
- **Authentication & Authorization**: Extension permission bypass
- **Data Exposure**: API keys, sensitive data logging
- **Cryptographic Issues**: Weak encryption, key management
- **Input Validation**: User input sanitization
- **Business Logic Flaws**: Race conditions, TOCTOU
- **Configuration Security**: Insecure defaults
- **Supply Chain**: Dependency vulnerabilities
- **Code Execution**: RCE via extension APIs
- **Cross-Site Scripting**: If any web content is rendered

Please provide comprehensive security analysis with specific remediation steps.
