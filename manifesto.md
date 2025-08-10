# GENERIC DEVELOPMENT MANIFESTO & AI AGENT DIRECTIVES

**ATTENTION AI DEVELOPMENT AGENT:**
This document contains core development principles for any software project. Follow these directives when generating, reviewing, or modifying code. These are requirements, not suggestions.

## CORE OPERATIONAL DIRECTIVES

### 1. CODE QUALITY ENFORCEMENT
- **MANDATORY:** All code must include comprehensive error handling
- **MANDATORY:** All public functions require documentation with examples
- **MANDATORY:** All business logic must have corresponding unit tests
- **MANDATORY:** Code coverage must be maintained above 80%
- **MANDATORY:** All code must pass linting without warnings

### 2. ARCHITECTURE COMPLIANCE
- **ENFORCE:** SOLID principles in all class designs
- **ENFORCE:** Dependency injection patterns where applicable
- **ENFORCE:** Clear separation of concerns
- **ENFORCE:** Interface-based programming for all service layers
- **ENFORCE:** Repository pattern for data access

### 3. SECURITY REQUIREMENTS
- **CRITICAL:** Input validation on all user-facing functions
- **CRITICAL:** SQL injection prevention in all database queries
- **CRITICAL:** XSS prevention in all output rendering (NO innerHTML usage)
- **CRITICAL:** Authentication checks on all protected endpoints
- **CRITICAL:** Sensitive data encryption at rest and in transit
- **PROHIBITED:** Any HTML/JavaScript injection vulnerabilities
- **REQUIRED:** All user input must be escaped and sanitized

### 4. PERFORMANCE STANDARDS
- **OPTIMIZE:** Database queries must use indexes
- **OPTIMIZE:** API responses must be under 200ms for standard operations
- **OPTIMIZE:** Memory usage must be monitored and optimized
- **OPTIMIZE:** Caching strategies must be implemented for repeated operations

### 5. TESTING MANDATES
- **REQUIRED:** Unit tests for all business logic
- **REQUIRED:** Integration tests for all API endpoints
- **REQUIRED:** End-to-end tests for critical user journeys
- **REQUIRED:** Performance tests for all public APIs
- **REQUIRED:** Security tests for all authentication flows

### 6. DOCUMENTATION REQUIREMENTS
- **DOCUMENT:** All API endpoints with specifications
- **DOCUMENT:** All configuration options with examples
- **DOCUMENT:** All deployment procedures step-by-step
- **DOCUMENT:** All troubleshooting guides for common issues

### 7. CODE STYLE ENFORCEMENT
- **STYLE:** Use descriptive variable and function names
- **STYLE:** Keep functions under 50 lines
- **STYLE:** Keep classes under 300 lines
- **STYLE:** Use consistent naming conventions throughout
- **STYLE:** Remove all commented-out code before commits

### 8. ERROR HANDLING PROTOCOLS
- **HANDLE:** All async operations must have try-catch blocks
- **HANDLE:** All user inputs must be validated before processing
- **HANDLE:** All external API calls must have timeout and retry logic
- **HANDLE:** All errors must be logged with appropriate context
- **HANDLE:** All user-facing errors must have helpful messages

## AGENT BEHAVIORAL DIRECTIVES

### WHEN REVIEWING CODE:
- **REJECT** any code that violates the above principles
- **SUGGEST** specific improvements with code examples
- **PRIORITIZE** security and performance concerns
- **VERIFY** that all requirements are met before approval

### WHEN WRITING CODE:
- **IMPLEMENT** all security measures from the start
- **INCLUDE** comprehensive error handling
- **WRITE** tests alongside implementation
- **DOCUMENT** all public interfaces

### WHEN DEBUGGING:
- **ANALYZE** root causes, not just symptoms
- **IMPLEMENT** fixes that prevent similar issues
- **ADD** monitoring to catch future occurrences
- **UPDATE** documentation with lessons learned

## COMPLIANCE VERIFICATION

Before marking any task as complete, verify:
- [ ] All code follows the style guidelines
- [ ] All functions have appropriate error handling
- [ ] All public APIs have documentation
- [ ] All business logic has unit tests
- [ ] All security requirements are met
- [ ] All performance standards are achieved

---

**REMEMBER: You are not just helping - you are enforcing. These are not suggestions; they are requirements.**
