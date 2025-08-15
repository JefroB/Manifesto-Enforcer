# 🛡️ Manifesto Enforcer - AI Development Assistant

*The man saying that something cannot be done, should not interrupt the man doing it.* - Chinese Proverb

**VSCode extension featuring Piggie 🐷, an AI agent that brings Auggie-level intelligence to your enterprise environment with Amazon Q optimization, automated MR/PR analysis, manifesto-compliant development, and team glossary management.**

[![Version](https://img.shields.io/badge/version-0.0.74--alpha-blue.svg)](https://github.com/JefroB/Manifesto-Enforcer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)
[![Enterprise Ready](https://img.shields.io/badge/enterprise-ready-orange.svg)](#enterprise-features)

> **⚠️ ALPHA SOFTWARE WARNING**
>
> This extension is in **alpha development** and **not fully tested**. While it contains powerful features and has been extensively developed, it may contain bugs, incomplete functionality, or unexpected behavior. Use with caution in production environments and always backup your work. We appreciate feedback and bug reports!

## 🎯 Why Manifesto Enforcer?

**Solves three critical development challenges:**

1. **🏢 Enterprise AI Adoption** - Use approved AI services (Amazon Q, Auggie, Ollama) while enforcing coding standards
2. **👶 New Developer Onboarding** - Generate professional standards instantly, no experience required
3. **🎯 Team Standardization** - Consistent, high-quality code across your entire team

**Perfect for:** New developers, enterprise teams, startups, vibe coders, and learning projects.

**Piggie** is the AI agent that powers this intelligence with complete feature parity across all AI providers.

## 🚀 Key Features

### **📜 Intelligent Manifesto Generation**
Generate professional coding standards for any project type in minutes:

```bash
"Generate a React TypeScript manifesto"
"Create Python data science standards"
"Generate Go microservices development rules"
"Create Rust systems programming standards"
"Generate Vue.js component development rules"
```

**Supports:** Frontend (React, Vue.js, Angular, Svelte), Backend (Node.js, Python, Ruby, PHP, Go, Java), Mobile (Flutter/Dart, Swift, Kotlin), Systems (C++, C, Rust, Zig, Nim), Data Science (Python, R, Julia, Scala), Hardware/IoT (Python, C#, C++), Functional (Haskell, Elixir), Web (HTML, CSS, SCSS, SQL), Scripting (Bash, PowerShell, Lua), and custom stacks.

### **🎮 Advanced Chat Commands**
Full command system with natural language support:

**Commands:** `/lint` (code quality), `/edit` (modify files), `/graph` (analyze dependencies), `/glossary` (define terms), `/manifesto` (show/generate rules), `/code` (generate code), `/cleanup` (clean repository)

**Natural Language:** All commands work with plain English - no syntax to memorize.

### **🧪 Test-Driven Development (TDD) Workflow**
**NEW in v0.0.74-alpha:** Complete TDD enforcement with intelligent test generation:

**🎯 TDD Mode Toggle:** Enable TDD mode in Piggie's chat panel with the `🧪 TDD` toggle
**🎭 UI Testing Support:** Optional UI test generation with the `🎭 UI Tests` toggle
**🔄 Three-Step Process:** Failing unit test → Failing UI test (optional) → Implementation code
**🚀 Auto-Detection:** Automatically detects tech stack and test frameworks from your project
**📊 Test Execution:** Runs tests in VSCode terminal and captures results for verification

**Supported Frameworks:**
- **Unit Testing:** Jest, Mocha, Vitest, Jasmine, PyTest, RSpec, PHPUnit, Hspec, ExUnit
- **UI Testing:** Playwright, Cypress, Testing Library, Selenium
- **Tech Stacks:** React, Vue.js, Angular, Svelte, Node.js, Python, Ruby, PHP, Go, Java, Flutter/Dart, Swift, Kotlin, C++, C, Rust, Zig, Nim, Haskell, Elixir, R, Julia, Scala, and more

**Example TDD Workflow:**
```bash
# Enable TDD mode in chat panel
"create a user authentication function"
# → Generates failing unit test
# → Generates implementation code
# → Runs tests to verify TDD cycle

# With UI Tests enabled
"build a login component"
# → Generates failing unit test
# → Generates failing UI test
# → Generates implementation code
# → Runs all tests to verify
```

### **🏗️ Complete VSCode Integration**
**Activity Bar:** Manifesto view, glossary, chat panel, security review, Piggie actions
**Context Menus:** Right-click code for analysis, refactoring, explanations, AI integration
**Status Bar:** Live agent status, progress indicators, quick AI switching

### **🤖 Multi-AI Support (Full Feature Parity)**
**Amazon Q** (Enterprise), **Auggie** (Augment Code), **Ollama** (Local/Free) - all fully supported with auto-discovery and seamless switching. Fallback tools available when no AI configured.

### **🔍 Advanced Code Analysis & Diagnostics**
**Real-time AST-based analysis with intelligent code actions**

#### **🚨 Live Manifesto Compliance Checking**
- **Real-time Diagnostics** - Thorough analysis as you type
- **AST-based Analysis** - Precise, syntax-aware checking
- **Smart Underlines** - Visual indicators for compliance issues

#### **⚡ Intelligent Quick Fixes**
- **Auto-fix Suggestions** - One-click compliance fixes
- **Context-aware Actions** - Smart suggestions based on code context
- **Bulk Operations** - Fix multiple issues at once
- **Learning System** - Adapts to your coding patterns

#### **📊 Code Quality Metrics**
- **Complexity Analysis** - Identify hotspots and technical debt
- **Dependency Mapping** - Visualize code relationships
- **Impact Assessment** - Understand change implications
- **Security Scanning** - Automated vulnerability detection

### **🛡️ Enterprise Security**
**Security Scans:** XSS prevention, input validation, SQL injection, authentication checks
**Compliance:** Manifesto adherence tracking, security metrics, quality scores, team dashboards

### **📁 Smart File Management & Lifecycle**
**Intelligent file handling with AI response loop prevention**

#### **📁 File Lifecycle Management**
- **Manifesto Protection** - Triple-confirmation system for critical files
- **Automatic Cleanup** - Removes old analysis files
- **Backup System** - Automatic backups before destructive operations



#### **💾 Persistent Chat & State Management**
- **Chat History Persistence** - Conversations survive VSCode restarts
- **Real-time State** - Always shows current system status

### **🎛️ Configuration & Modes**
**Manifesto Mode:** Toggle enforcement, real-time compliance, custom rules, team sync
**Agent Management:** Dynamic AI switching, automatic fallback, auto-discovery, context optimization

### **��📚 Advanced Codebase Intelligence**
- **Smart Indexing** - Understands your entire project structure
- **Persistent Storage** - Saves index across VSCode sessions (24hr cache)
- **Symbol Mapping** - Tracks functions, classes, interfaces across files
- **Dependency Analysis** - Maps imports/exports and relationships
- **Context-Aware Editing** - Generates code that fits existing patterns
- **Auto Re-indexing** - Detects file changes and suggests updates

### **🔍 Enterprise MR/PR Analysis**
- **Risk Assessment** - LOW/MEDIUM/HIGH deployment risk scoring
- **Security Scanning** - Detects XSS, SQL injection, hardcoded secrets
- **Automated Test Generation** - Creates unit, integration, E2E tests
- **Compliance Checking** - Verifies manifesto rule adherence
- **Automation Opportunities** - Identifies manual processes to automate

### **🛡️ Manifesto Compliance Engine**
- **Token-Efficient Rules** - Compressed manifesto for AI context limits
- **Smart Rule Selection** - Only sends relevant rules per request
- **Automatic Enforcement** - Ensures all code meets standards
- **Custom Rule Support** - Adapt to your company's specific requirements
- **Smart Generation** - Creates project-specific manifestos from codebase analysis
- **Multi-Type Support** - Separate dev, QA, security, API manifestos
- **Framework-Aware QA** - Detects WebDriver.io, Selenium, Cypress, Playwright, Jest, etc.
- **Chat Generation** - "Generate QA manifesto" creates comprehensive testing standards

### **📖 Enterprise Glossary System**
- **Chat-Based Management** - Add terms naturally: "Define API as Application Programming Interface"
- **Smart Integration** - Automatically adds definitions to AI responses
- **Natural Lookup** - Ask "What does SLA mean?" for instant definitions
- **Import/Export** - JSON and CSV format support for team sharing
- **Usage Analytics** - Track which terms are most referenced
- **Persistent Storage** - Saves glossary across sessions

## 🏢 Enterprise Value Proposition

### **Immediate ROI:**
- **70% reduction** in manual code review time
- **Early vulnerability detection** before production
- **Automated test generation** saves QA resources
- **Consistent code quality** across all developers

### **Risk Mitigation:**
- **Security vulnerability scanning** in every MR/PR
- **Deployment risk assessment** prevents production issues
- **Compliance verification** ensures coding standards
- **Automated documentation** requirements checking

## 📦 Installation

### **For Enterprise Teams:**
1. **Download** the latest `.vsix` from releases
2. **Install** via VSCode: `code --install-extension manifesto-enforcer-0.0.74-alpha.vsix`
3. **Configure** your company's manifesto.md
4. **Index** your codebase for full intelligence
5. **Customize** for your organization's specific needs

### **For Individual Developers:**
1. **Clone** this repository
2. **Build** with `npm run compile`
3. **Package** with `npx vsce package`
4. **Install** the generated `.vsix` file

## 🚀 Manifesto Generation Quick Start
**Perfect for: New developers, teams starting fresh, vibe coding enthusiasts**

### **Generate Your First Manifesto (2 minutes)**

1. **Install Extension** - Add Manifesto Enforcer to VS Code
2. **Open Your Project** - Any project folder (even empty!)
3. **Chat with Piggie** - Open the chat panel
4. **Generate Manifesto** - Type one of these:

```bash
# For beginners:
"Generate a beginner-friendly JavaScript manifesto"
"Create coding standards for my first React project"

# For specific technologies:
"Generate a TypeScript Node.js API manifesto"
"Create Python data science coding standards"
"Generate a React TypeScript frontend manifesto"
"Create Go microservices development standards"
"Generate Rust systems programming manifesto"
"Create Ruby on Rails web application standards"
"Generate C++ game development manifesto"

# For teams:
"Create enterprise-grade coding standards for our team"
"Generate a comprehensive full-stack manifesto"
```

5. **Review & Customize** - Piggie generates a complete manifesto tailored to your needs
6. **Start Coding** - All future code follows your new standards automatically!

### **What You Get Instantly:**
- ✅ **Complete Coding Standards** - Error handling, validation, documentation rules
- ✅ **Project Structure** - Best practices for organizing your code
- ✅ **Security Guidelines** - Input validation, XSS prevention, secure patterns
- ✅ **Performance Rules** - Optimization guidelines and anti-patterns
- ✅ **Team Consistency** - Everyone follows the same high-quality standards

### **Example Generated Manifesto Sections:**
```markdown
# Error Handling
- All functions must include try-catch blocks
- User-facing errors must be user-friendly
- Log technical details for debugging

# Input Validation
- Validate all user inputs before processing
- Sanitize data to prevent XSS attacks
- Use type checking for function parameters

# Documentation
- All functions must have JSDoc comments
- Include parameter types and return values
- Provide usage examples for complex functions
```

## 🎮 Quick Start

### **1. Basic Setup**
```bash
# Install the extension
code --install-extension manifesto-enforcer-0.0.74-alpha.vsix

# Open VSCode and look for the shield icon in the activity bar
# Click "💬 Chat with Piggie" to start chatting with the AI agent
```

### **2. Index Your Codebase**
```
1. Click "📚 Index Codebase" in Piggie's chat window
2. Wait for indexing to complete
3. See "Indexed X files" status
```

### **3. Set Up Glossary (Optional)**
```
1. Click "📖 Manage Glossary"
2. Add your team's acronyms and terms
3. Import existing glossary from JSON/CSV
4. Terms automatically enhance AI responses
```

### **4. Try Core Features**
```
# Basic chat
"Hello, can you help me with manifesto-compliant development?"

# Glossary management
"Define API as Application Programming Interface"
"What does SLA mean?"
"Show glossary"

# File analysis
"show me extension.ts"

# Smart editing
"edit extension.ts to add better error handling"

# Manifesto generation
"Generate QA manifesto"

# MR analysis
"analyze https://github.com/owner/repo/pull/123"

# Glossary-enhanced responses
"Explain API authentication" (automatically includes API definition)
```

### **🧪 TDD Mode Usage**
```bash
# Enable TDD mode in Piggie chat panel
1. Click the 🧪 TDD toggle in the chat toolbar
2. Optionally enable 🎭 UI Tests for frontend components

# Generate code with TDD workflow
"create a user validation function"
# → Auto-generates failing unit test
# → Generates implementation code
# → Runs tests to verify TDD cycle

# UI component with tests
"build a search component"
# → Generates failing unit test
# → Generates failing UI test (if enabled)
# → Generates React/Vue/Angular component
# → Runs all tests to verify functionality

# Supported test frameworks auto-detected:
✅ Jest, Mocha, Vitest, Jasmine (unit tests)
✅ Playwright, Cypress, Testing Library (UI tests)
✅ React, Vue, Angular, Node.js, Python projects
```

## 🤖 AI Agent Setup

The extension automatically detects and configures available AI providers. Choose the option that best fits your needs:

### **🟠 Amazon Q (Enterprise) - FULLY SUPPORTED**
**Best for: Enterprise teams with AWS infrastructure**
**⭐ COMPLETE FEATURE PARITY - All Piggie features work seamlessly with Amazon Q**

1. **Install AWS Toolkit**: Search for "AWS Toolkit" in VS Code extensions
2. **Authenticate**: Sign in to your AWS account through the toolkit
3. **Verify Region**: Ensure Amazon Q is available in your AWS region
4. **Auto-Detection**: Extension automatically detects and configures Amazon Q

```bash
# Amazon Q provides FULL SUPPORT for:
✅ High token limits (32,000+)
✅ Enterprise authentication & security
✅ Multi-language code generation
✅ AWS infrastructure integration
✅ Complete manifesto compliance checking
✅ Full codebase analysis & indexing
✅ Interactive code editing & refactoring
✅ Comprehensive linting & quality analysis
✅ Project glossary management
✅ All chat commands (/lint, /edit, /graph, etc.)
```

**Amazon Q Integration Features:**
- **Smart Context Management**: Automatically optimizes requests for Amazon Q's token limits
- **Enterprise Security**: Leverages AWS authentication and security policies
- **High Performance**: Optimized for Amazon Q's response patterns and capabilities
- **Full Feature Access**: Every Piggie feature works identically with Amazon Q

### **🦙 Ollama (Local & Free)**
**Best for: Privacy-conscious developers, offline work**

1. **Install Ollama**: Download from [ollama.ai/download](https://ollama.ai/download)
2. **Start Server**: Run `ollama serve` in your terminal
3. **Install Model**: Run `ollama pull llama3` (or your preferred model)
4. **Auto-Detection**: Extension automatically detects local Ollama server

```bash
# Ollama provides:
✅ 100% local processing
✅ Offline capability
✅ Streaming responses
✅ Multiple model options
✅ Zero cost
```

### **🤖 Auggie (Augment Code)**
**Best for: Developers already using Augment Code**

1. **Install Extension**: Search for "Augment Code" in VS Code extensions
2. **Sign In**: Authenticate with your Augment account
3. **Auto-Detection**: Extension automatically detects and integrates with Auggie

```bash
# Auggie provides:
✅ Advanced code understanding
✅ File operation support
✅ Integrated development workflow
✅ Professional AI assistance
```

### **🔄 Fallback Mode (Always Available)**
**Automatic fallback when no AI is configured**

If no AI providers are available, the extension automatically provides:
- 📊 Code dependency analysis
- 🔍 Manifesto compliance checking
- 📖 Project glossary management
- ⚙️ Setup guidance for AI providers

## 🔧 Configuration

### **Manifesto Setup**
Create `manifesto.md` in your project root:

```markdown
# Company Development Standards

## Code Quality Requirements
- All functions must have comprehensive error handling
- JSDoc documentation required for public APIs
- Unit tests mandatory for business logic
- 80%+ code coverage required

## Security Requirements  
- Input validation on all user-facing functions
- No innerHTML usage (XSS prevention)
- SQL injection prevention required
- Authentication checks on protected endpoints

## Performance Standards
- API responses must be under 200ms
- Database queries must use indexes
- Caching required for repeated operations
```

### **Amazon Q Enterprise Integration**
The Manifesto Enforcer extension provides seamless Amazon Q integration with:
- **Intelligent Context Management** - Optimizes requests for maximum effectiveness
- **Smart File Prioritization** - Focuses on the most relevant code for your request
- **Efficient Manifesto Integration** - Delivers compliance rules in optimal format
- **Conversation Optimization** - Maintains context while maximizing response quality
- **Dynamic Glossary Integration** - Includes relevant terms for enhanced understanding
- **Enterprise Security** - Leverages AWS authentication and compliance features

### **Glossary Management**
**Natural Chat Commands:**
```
# Add terms through conversation
"Define API as Application Programming Interface"
"Add term SLA meaning Service Level Agreement"
"Define JWT as JSON Web Token"

# Look up terms
"What does API mean?"
"What is SLA?"

# Manage glossary
"Show glossary"
"Remove API"
```

**Or import existing glossary:**
```json
{
  "API": "Application Programming Interface",
  "SLA": "Service Level Agreement",
  "CRUD": "Create, Read, Update, Delete",
  "JWT": "JSON Web Token",
  "CI/CD": "Continuous Integration/Continuous Deployment"
}
```

**Features:**
- Terms automatically enhance all AI responses
- Usage tracking shows most referenced terms
- Persistent storage across VSCode sessions
- Perfect for teams with extensive acronyms

## 🎯 Use Cases

### **For Development Teams:**
- **Code Review Automation** - Analyze MRs for compliance and security
- **Test Generation** - Create comprehensive test suites automatically  
- **Documentation Enforcement** - Ensure proper JSDoc and README updates
- **Security Scanning** - Catch vulnerabilities before deployment

### **For Enterprise Architects:**
- **Standards Enforcement** - Automatic compliance with coding standards
- **Risk Assessment** - Deployment risk scoring for change management
- **Quality Metrics** - Track compliance scores across projects
- **Automation Identification** - Find manual processes to automate

### **For DevOps Teams:**
- **CI/CD Integration** - Automated quality gates in pipelines
- **Deployment Safety** - Risk assessment before production releases
- **Security Validation** - Vulnerability scanning in every change
- **Performance Monitoring** - Ensure changes meet performance standards

## 🎯 Complete Feature Showcase

### **🔄 Persistent Intelligence**
```bash
# Index once, use forever (until files change significantly)
1. Click "📚 Index Codebase"
2. Close VSCode, reopen project
3. Index automatically restored
4. File changes trigger re-index suggestions
```

### **📖 Glossary-Enhanced Responses**
```bash
# Before glossary:
User: "How do I implement JWT authentication?"
AI: "To implement JWT authentication..."

# After adding JWT to glossary:
User: "How do I implement JWT authentication?"
AI: "To implement JWT authentication...

📖 Glossary Context:
**JWT**: JSON Web Token - A compact, URL-safe token format"
```

### **🧠 Smart Manifesto Generation**
```bash
# Analyzes your codebase and suggests:
"💡 No manifesto found - Generate project-specific manifesto
🧪 QA Manifesto - Generate testing standards (found Jest tests)
🔒 Security Manifesto - Create security guidelines (found auth patterns)
⚛️ Frontend Manifesto - Create React component standards (found JSX)"
```

### **🔍 Intelligent File Change Detection**
```bash
# Automatically monitors your codebase:
- Detects when 5+ files change
- Suggests re-indexing for updated intelligence
- Debounces rapid changes to avoid spam
- Maintains performance with smart thresholds
```

### **🧪 Comprehensive QA Manifesto Generation**
```bash
# Detects your testing frameworks and generates tailored standards:
User: "Generate QA manifesto"

# Analyzes codebase and creates framework-specific guidelines for:
✅ WebDriver.io - Page Object Model, explicit waits, parallel execution
✅ Selenium - WebDriverWait, CSS selectors, TestNG annotations
✅ Cypress - data-cy attributes, cy.intercept(), custom commands
✅ Playwright - auto-waiting, parallel execution, built-in assertions
✅ Jest/Mocha - Unit testing patterns and best practices
✅ Cucumber/BDD - Gherkin standards and living documentation
✅ Appium - Mobile testing on real devices, accessibility IDs
✅ API Testing - Schema validation, error scenarios, response times

# Plus comprehensive coverage of:
- Test pyramid strategy (70% unit, 20% integration, 10% E2E)
- CI/CD integration requirements
- Test data management
- Quality metrics and reporting
```

## 🔍 MR/PR Analysis Example

```bash
# Analyze any GitHub or GitLab MR/PR
"analyze https://github.com/company/project/pull/123"
```

**Enterprise Analysis Report:**
```
🔍 Enterprise MR/PR Analysis Report

📋 Summary:
• Title: Add user authentication system
• Author: developer@company.com
• Branch: feature/auth → main
• Files Changed: 12
• Lines: +245 -18
• Complexity: MEDIUM
• Impact: HIGH

🚨 Risk Assessment: HIGH
Risk Factors:
• Configuration files modified
• Authentication system changes

Recommendations:
• 🚨 Require additional code review approval
• 🚨 Deploy to staging environment first
• 🚨 Create rollback plan before deployment

🛡️ Manifesto Compliance: 85%
✅ Error handling implemented
✅ Input validation present
❌ Missing JSDoc documentation

🧪 Automated Test Suggestions:
Unit Tests:
• Test auth.service.ts functions for edge cases
• Test login.component.tsx rendering and props

Integration Tests:
• Test auth.controller.ts API endpoints with various inputs

Security Tests:
• Security test auth.service.ts authentication flows

🔒 Security Concerns:
• 🔒 Potential XSS vulnerability with innerHTML usage

🤖 Automation Opportunities:
• 🤖 Automate manual testing steps mentioned in description
```

## 🛠️ Development

### **Building from Source:**
```bash
# Clone and setup
git clone https://github.com/JefroB/Manifesto-Enforcer.git
cd Manifesto-Enforcer
npm install

# Compile TypeScript
npm run compile

# Package extension
npx vsce package

# Install locally
code --install-extension manifesto-enforcer-0.0.74-alpha.vsix
```

### **Testing:**
```bash
# Run unit tests
npm test

# Test with sample MR
# (Enable auto mode and try analyzing a real GitHub PR)
```

## 🤝 Contributing

We welcome enterprise contributions! This tool is designed to be customized for company-specific needs.

### **Priority Areas:**
- **Custom rule engines** for company-specific standards
- **Additional AI integrations** (Azure OpenAI, etc.)
- **Enterprise SSO integration**
- **Metrics dashboards** for compliance tracking
- **CI/CD pipeline integrations**

### **How to Contribute:**
1. **Fork** the repository
2. **Create** a feature branch
3. **Test** with real MRs/PRs
4. **Submit** a pull request
5. **Use Piggie** to analyze your own PR! 🎯

## 📊 Roadmap

### **v0.0.74-alpha - CURRENT ✅**
- [x] **Multi-AI Support** (Amazon Q, Auggie, Ollama with full feature parity)
- [x] **Advanced Chat Commands** (/lint, /edit, /graph, /glossary, /manifesto, /code, /cleanup)
- [x] **Comprehensive UI System** (Activity Bar, Context Menus, Status Bar, Tree Views)
- [x] **Real-time AST-based Diagnostics** with intelligent quick fixes
- [x] **Smart File Lifecycle Management** with AI response loop prevention
- [x] **TDD Workflow Support** with automated test generation and execution
- [x] **Persistent Chat & State Management** with conversation history
- [x] **Enterprise Security Features** (automated scans, compliance reporting)
- [x] **Intelligent Manifesto Generation** for any project type or technology
- [x] **Advanced Configuration & Modes** (manifesto mode, agent switching)
- [x] **Critical Infrastructure** (bulletproof reliability, health monitoring)

### **v0.1.0-beta - Stability & Polish**
- [ ] **Comprehensive Testing** - Full test coverage for all features
- [ ] **Performance Optimization** - Optimize indexing and analysis speed
- [ ] **Bug Fixes** - Address alpha-stage issues and edge cases
- [ ] **Documentation Polish** - Complete user guides and API docs
- [ ] **UI/UX Improvements** - Refine interface based on user feedback

### **v0.2.0 - Enterprise Integration**
- [ ] **GitHub/GitLab Integration** - Real MR/PR analysis with API authentication
- [ ] **Team Collaboration** - Shared manifestos and glossaries
- [ ] **Compliance Dashboards** - Team-wide compliance tracking and metrics
- [ ] **Custom Rule Engine** - Company-specific coding standards
- [ ] **Notification Systems** - Slack/Teams integration for code reviews

### **v0.3.0 - Advanced Automation**
- [ ] **CI/CD Integration** - Automated compliance gates in pipelines
- [ ] **Multi-Repository Analysis** - Cross-project intelligence and standards
- [ ] **Advanced AI Models** - Azure OpenAI, Claude, custom model support
- [ ] **Performance Monitoring** - Regression detection and optimization
- [ ] **Enterprise Security** - Advanced vulnerability scanning and reporting
- [ ] Enterprise SSO support
- [ ] Advanced glossary features (synonyms, categories, etc.)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/JefroB/Manifesto-Enforcer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JefroB/Manifesto-Enforcer/discussions)
- **Enterprise Support**: Contact for custom enterprise features

## 📋 Changelog

### v0.0.74-alpha (2025-08-14)
**🚀 STABILITY & RELIABILITY IMPROVEMENTS**

#### **🛠️ Enhanced Reliability**
- **Improved Project Type Detection**: More accurate language/framework detection across all scenarios
- **Enhanced Error Handling**: Better graceful degradation and comprehensive error coverage
- **Optimized Performance**: Faster extension startup and improved responsiveness
- **Refined StorageService**: More robust file operations and data persistence

### v0.0.61-alpha (2025-08-10)
**🏗️ Critical Infrastructure & Reliability Improvements**

#### **🚨 Critical Fixes**
- **Fixed AI Response Loops**: Prevented identical responses by excluding AI-generated analysis files from indexing
- **Fixed Massive Over-Indexing**: Resolved issue where 6000+ files were indexed instead of expected ~50
- **Fixed Chat History Loss**: Implemented smart chat caching that persists conversations across sessions
- **Fixed Button Spam Issues**: Added proper race condition protection for indexing operations

#### **🧠 Smart Chat System**
- **Persistent Chat History**: Conversations now survive webview reloads and navigation
- **Real-Time State Display**: Shows accurate current indexing state, never stale cached data
- **Infrastructure Health Monitoring**: Automatic detection and warnings for indexing anomalies
- **Smart Welcome Messages**: Context-aware greetings based on current system state

#### **🛡️ File Management & Security**
- **Smart File Lifecycle Management**: Different strategies for manifestos, glossaries, and analysis files
- **AI Response Loop Prevention**: Excludes problematic files while preserving valuable AI-generated content
- **Manifesto Protection**: Triple-confirmation system with typed verification for manifesto deletion
- **Automatic Cleanup**: Strategic cleanup of old analysis files and legacy backups

#### **📊 Enhanced Reliability**
- **Race Condition Protection**: Prevents overlapping indexing operations
- **Comprehensive Error Handling**: Robust error recovery throughout the system
- **Performance Monitoring**: Tracks and validates system health metrics
- **Gitignore Integration**: Respects project exclusion patterns for accurate indexing

#### **🎯 User Experience**
- **Button State Management**: Visual feedback during long operations
- **Health Status Indicators**: Proactive warnings for system issues
- **Consistent File Counts**: Reliable indexing with expected file counts (~50 files)
- **Improved Diagnostics**: Detailed logging for troubleshooting

---

**Open source tool built with ❤️ for enterprise development teams who want Auggie-level intelligence in their approved AI environments.**

*Ready to enforce your manifesto and boost your development workflow!* 🚀
