# 🛡️ Manifesto Enforcer

**A VSCode extension that helps developers adhere to project-specific development manifestos by constructing perfectly formatted prompts for AI assistants.**

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/JefroB/Manifesto-Enforcer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Features

### 🛡️ **Highly Visible Activity Bar Integration**
- **Shield icon** in the left activity bar for easy access
- Dedicated sidebar panels for manifesto management and quick actions
- Smart status bar that shows manifesto status and current mode

### 📋 **Manifesto Management**
- **Create from Template** - Comprehensive generic manifesto with AI agent directives
- **Create Blank Manifesto** - Simple starting point for custom manifestos
- **Set Existing Manifesto** - Point to your existing manifesto file
- **Auto-detection** of manifesto files in your workspace

### 💬 **Dual Workflow Support**

#### **Pure Chat Workflow** (No Code Selection Needed)
- **💬 Start Vibe Chat** - Casual coding conversations
- **🛡️ Start Manifesto Chat** - Chat with manifesto guidance included
- **📖 Send Manifesto to Chat** - Set context for AI assistants

#### **Code Refactoring Workflow** (With Code Selection)
- **⚡ Quick Refactor (Vibe Mode)** - Fast & flexible refactoring
- **⚖️ Strict Refactor (Manifesto Mode)** - Follows manifesto rules
- **🚀 Send Code to Augment** - Direct integration with selected code

### 🔍 **Compliance Checking**
- **Run Compliance Check** - Audit your entire codebase against manifesto standards
- **Detailed Reports** - Comprehensive markdown reports with actionable insights
- **AI Integration** - Send compliance summaries to AI for improvement recommendations

### 🤖 **AI Provider Integration**
Seamless integration with popular AI coding assistants:
- **Augment Code** (Primary integration)
- **Amazon Q**
- **Claude**
- **GitHub Copilot Chat**
- **Manual Paste** (clipboard only)

## 🎯 **Two Modes of Operation**

### 🔒 **Strict Mode**
- Includes full manifesto content in AI prompts
- Enforces development standards
- Perfect for team consistency

### ⚡ **Vibe Mode**
- Casual, flexible coding assistance
- No manifesto constraints
- Great for exploration and rapid prototyping

## 📦 Installation

### From VSIX (Recommended)
1. Download the latest `.vsix` file from [Releases](https://github.com/JefroB/Manifesto-Enforcer/releases)
2. Open VSCode
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file

### From Source
```bash
git clone https://github.com/JefroB/Manifesto-Enforcer.git
cd Manifesto-Enforcer
npm install
npm run compile
vsce package
code --install-extension manifesto-enforcer-0.4.0.vsix
```

## 🚀 Quick Start

1. **Open the Extension**: Click the 🛡️ shield icon in the activity bar
2. **Create a Manifesto**: Choose "📋 Create from Template" for a comprehensive start
3. **Set Your Mode**: Toggle between 🔒 Strict Mode and ⚡ Vibe Mode
4. **Start Coding**: Use the chat features or select code for refactoring

## 📖 Usage Examples

### Creating a Manifesto from Template
The extension includes a comprehensive generic manifesto with:
- **AI Agent Directives** - Clear instructions for AI assistants
- **8 Core Development Directives** - Stability, interface standards, architecture, etc.
- **Mandatory Workflow** - Pre-flight checks, implementation, testing, validation

### Running a Compliance Check
```
1. Click "🔍 Run Compliance Check"
2. Review the generated markdown report
3. Optionally send summary to AI for recommendations
4. Address flagged issues in your codebase
```

### Vibe Chat Example
```
💬 Start Vibe Chat → "help me design a user authentication system"
```

### Manifesto Chat Example
```
🛡️ Start Manifesto Chat → "help me design a user authentication system following our standards"
```

## ⚙️ Configuration

Access settings via `File > Preferences > Settings` and search for "Manifesto":

- **`manifesto.filePath`**: Path to your manifesto file (default: `manifesto.md`)
- **`manifesto.aiProvider`**: Choose your preferred AI provider for auto-opening

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for developers who believe in consistent, high-quality code
- Inspired by the need for better AI-human collaboration in software development
- Special thanks to the VSCode extension development community

---

**Made with ❤️ for developers who take their craft seriously** 🚔👮‍♂️
