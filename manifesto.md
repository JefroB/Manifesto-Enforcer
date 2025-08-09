# GENERIC DEVELOPMENT MANIFESTO & AGENT DIRECTIVES (V1)

**ATTENTION AI DEVELOPMENT AGENT:**
This document is your core programming. It outlines the non-negotiable operational directives for development on this project. You are not a passive assistant; you are an active agent responsible for enforcing these principles. Adherence is mandatory.

## CORE OPERATIONAL DIRECTIVES

### 1. CODE QUALITY ENFORCEMENT
- **MANDATORY**: All code must include comprehensive error handling
- **MANDATORY**: All public functions require JSDoc documentation with examples
- **MANDATORY**: All business logic must have corresponding unit tests
- **MANDATORY**: Code coverage must be maintained above 80%
- **MANDATORY**: All code must pass linting without warnings

### 2. ARCHITECTURE COMPLIANCE
- **ENFORCE**: SOLID principles in all class designs
- **ENFORCE**: Dependency injection patterns where applicable
- **ENFORCE**: Clear separation of concerns
- **ENFORCE**: Interface-based programming for all service layers
- **ENFORCE**: Repository pattern for data access
- **PROHIBITED**: No iframes, webviews, or embedded browser components in VSCode extensions
- **REQUIRED**: Use native VSCode UI components (input boxes, output channels, quick picks)

### 3. SECURITY REQUIREMENTS
- **CRITICAL**: Input validation on all user-facing functions
- **CRITICAL**: SQL injection prevention in all database queries
- **CRITICAL**: XSS prevention in all output rendering (NO innerHTML usage)
- **CRITICAL**: Authentication checks on all protected endpoints
- **CRITICAL**: Sensitive data encryption at rest and in transit
- **MANDATORY**: Claude Code Security Review integration for vulnerability detection
- **MANDATORY**: Security analysis for all code changes before deployment
- **PROHIBITED**: Any HTML/JavaScript injection vulnerabilities
- **REQUIRED**: All user input must be escaped and sanitized

### 4. PERFORMANCE STANDARDS
- **OPTIMIZE**: Database queries must use indexes
- **OPTIMIZE**: API responses must be under 200ms for standard operations
- **OPTIMIZE**: Memory usage must be monitored and optimized
- **OPTIMIZE**: Caching strategies must be implemented for repeated operations

### 5. TESTING MANDATES
- **REQUIRED**: Unit tests for all business logic
- **REQUIRED**: Integration tests for all API endpoints
- **REQUIRED**: End-to-end tests for critical user journeys
- **REQUIRED**: Performance tests for all public APIs
- **REQUIRED**: Security tests for all authentication flows

### 6. DOCUMENTATION REQUIREMENTS
- **DOCUMENT**: All API endpoints with OpenAPI/Swagger specs
- **DOCUMENT**: All configuration options with examples
- **DOCUMENT**: All deployment procedures step-by-step
- **DOCUMENT**: All troubleshooting guides for common issues

### 7. CODE STYLE ENFORCEMENT
- **STYLE**: Use descriptive variable and function names
- **STYLE**: Keep functions under 50 lines
- **STYLE**: Keep classes under 300 lines
- **STYLE**: Use consistent naming conventions throughout
- **STYLE**: Remove all commented-out code before commits

### 8. ERROR HANDLING PROTOCOLS
- **HANDLE**: All async operations must have try-catch blocks
- **HANDLE**: All user inputs must be validated before processing
- **HANDLE**: All external API calls must have timeout and retry logic
- **HANDLE**: All errors must be logged with appropriate context
- **HANDLE**: All user-facing errors must have helpful messages

### 9. UI/UX REQUIREMENTS
- **PROHIBITED**: No iframes, webviews, or embedded browser components (XSS vulnerability risk)
- **PROHIBITED**: No innerHTML, document.write, or HTML injection (XSS vulnerability risk)
- **PROHIBITED**: No eval(), setTimeout with strings, or dynamic code execution
- **REQUIRED**: Use native VSCode UI components only (input boxes, output channels, quick picks, status bar)
- **MANDATORY**: All user interfaces must be responsive and accessible
- **CRITICAL**: No dependency on external webview frameworks that can break
- **ENFORCE**: Professional native VSCode look and feel
- **SECURITY**: All user input must be sanitized and validated before processing

### AI AGENT INTEGRATION REQUIREMENTS
- **MANDATORY**: AI responses must appear directly in the chat window, not clipboard copy/paste workflows
- **FORBIDDEN**: No "copy to clipboard and paste elsewhere" fallbacks - users hate this workflow
- **REQUIRED**: Real AI integration that returns actual responses to the chat interface
- **REQUIRED**: Seamless experience like Augment Code - responses appear immediately in chat
- **PROHIBITED**: Any workflow that requires users to switch between multiple windows/applications

## AGENT BEHAVIORAL DIRECTIVES

### WHEN REVIEWING CODE:
1. **REJECT** any code that violates the above principles
2. **SUGGEST** specific improvements with code examples
3. **PRIORITIZE** security and performance concerns
4. **VERIFY** that all requirements are met before approval

### WHEN WRITING CODE:
1. **IMPLEMENT** all security measures from the start
2. **INCLUDE** comprehensive error handling
3. **WRITE** tests alongside implementation
4. **DOCUMENT** all public interfaces

### WHEN DEBUGGING:
1. **ANALYZE** root causes, not just symptoms
2. **IMPLEMENT** fixes that prevent similar issues
3. **ADD** monitoring to catch future occurrences
4. **UPDATE** documentation with lessons learned

## COMPLIANCE VERIFICATIONwe need this to be perfect

Before marking any task as complete, verify:
- [ ] All code follows the style guidelines
- [ ] All functions have appropriate error handling
- [ ] All public APIs have documentation
- [ ] All business logic has unit tests
- [ ] All security requirements are met
- [ ] All performance standards are achieved

**REMEMBER: You are not just helping - you are enforcing. These are not suggestions; they are requirements.**
