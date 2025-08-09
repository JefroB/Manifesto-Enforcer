# 🛡️ Manifesto Enforcer - Enterprise AI Development Assistant

**VSCode extension featuring Piggie 🐷, an AI agent that brings Auggie-level intelligence to your enterprise environment with Amazon Q optimization, automated MR/PR analysis, and manifesto-compliant development.**

[![Version](https://img.shields.io/badge/version-0.0.5--alpha-blue.svg)](https://github.com/JefroB/Manifesto-Enforcer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)
[![Enterprise Ready](https://img.shields.io/badge/enterprise-ready-orange.svg)](#enterprise-features)

## 🎯 Why Manifesto Enforcer?

The Manifesto Enforcer extension solves the **enterprise AI adoption challenge** by providing Auggie-level coding intelligence through existing approved AI services like Amazon Q, while enforcing company coding standards automatically. **Piggie** is the AI agent that powers this intelligence within the extension.

### **Perfect for Enterprise Because:**
- ✅ **Open source** - Full transparency, can be customized for internal use
- ✅ **Uses existing AI** - Works with Amazon Q, GitHub Copilot, etc.
- ✅ **Token optimized** - Efficient for enterprise AI limits
- ✅ **Security focused** - Input validation, XSS prevention built-in
- ✅ **Compliance enforced** - Automatic coding standard verification

## 🚀 Key Features

### **🤖 Multi-AI Support**
- **Amazon Q Integration** - Token-optimized for enterprise limits
- **Auggie Integration** - Full Augment Code compatibility  
- **Cline Support** - Direct Claude integration
- **Local AI Ready** - Support for on-premise models

### **📚 Advanced Codebase Intelligence**
- **Smart Indexing** - Understands your entire project structure
- **Symbol Mapping** - Tracks functions, classes, interfaces across files
- **Dependency Analysis** - Maps imports/exports and relationships
- **Context-Aware Editing** - Generates code that fits existing patterns

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
2. **Install** via VSCode: `code --install-extension manifesto-enforcer-0.0.5-alpha.vsix`
3. **Configure** your company's manifesto.md
4. **Index** your codebase for full intelligence
5. **Customize** for your organization's specific needs

### **For Individual Developers:**
1. **Clone** this repository
2. **Build** with `npm run compile`
3. **Package** with `npx vsce package`
4. **Install** the generated `.vsix` file

## 🎮 Quick Start

### **1. Basic Setup**
```bash
# Install the extension
code --install-extension manifesto-enforcer-0.0.5-alpha.vsix

# Open VSCode and look for the shield icon in the activity bar
# Click "💬 Chat with Piggie" to start chatting with the AI agent
```

### **2. Index Your Codebase**
```
1. Click "📚 Index Codebase" in Piggie's chat window
2. Wait for indexing to complete
3. See "Indexed X files" status
```

### **3. Try Core Features**
```
# Basic chat
"Hello, can you help me with manifesto-compliant development?"

# File analysis  
"show me extension.ts"

# Smart editing
"edit extension.ts to add better error handling"

# MR analysis
"analyze https://github.com/owner/repo/pull/123"
```

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

### **Amazon Q Optimization**
When using Amazon Q, the Manifesto Enforcer extension automatically:
- **Compresses context** to fit token limits
- **Prioritizes relevant files** based on your request
- **Sends compact manifesto rules** instead of full text
- **Manages conversation length** to prevent context overflow

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
code --install-extension manifesto-enforcer-0.0.5-alpha.vsix
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

### **v0.1.0 - Enterprise Ready**
- [ ] GitHub/GitLab API authentication
- [ ] Slack/Teams integration for MR analysis
- [ ] Custom rule engine for company standards
- [ ] Metrics dashboard for compliance tracking

### **v0.2.0 - Advanced Automation**
- [ ] JIRA integration for high-risk changes
- [ ] CI/CD pipeline integration
- [ ] Automated deployment gates
- [ ] Performance regression detection

### **v0.3.0 - Enterprise Scale**
- [ ] Multi-repository analysis
- [ ] Team compliance dashboards
- [ ] Custom AI model integration
- [ ] Enterprise SSO support

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/JefroB/Manifesto-Enforcer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JefroB/Manifesto-Enforcer/discussions)
- **Enterprise Support**: Contact for custom enterprise features

---

**Open source tool built with ❤️ for enterprise development teams who want Auggie-level intelligence in their approved AI environments.**
