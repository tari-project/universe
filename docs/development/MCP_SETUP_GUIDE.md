# MCP Server Setup Guide for Tari Universe Development

## **What is MCP?**
Model Context Protocol (MCP) allows AI agents to interact with external tools and services. Your colleague's setup includes powerful automation tools perfect for our E2E testing strategy.

## **Why Doesn't Amp Include GitHub MCP by Default?**

Amp follows a **"curated tools"** philosophy:

### **Amp's Built-In Philosophy:**
- ✅ **Ships with essential coding tools** (file operations, web browsing, mermaid diagrams)
- ❌ **Doesn't include specialized integrations** that not everyone needs
- 🎯 **Focuses on high-performance, high-quality tools** to avoid model degradation

### **Why External MCP Servers Make Sense:**
1. **API Keys Required** - GitHub needs personal access tokens
2. **User Choice** - Not everyone uses GitHub (some use GitLab, Bitbucket, etc.)
3. **Rapid Evolution** - MCP ecosystem changes faster than Amp releases
4. **Security Boundaries** - Each integration needs different permissions
5. **Performance** - Too many tools can reduce model performance

### **Amp's Recommendation:**
> "Use MCP servers that expose a small number of high-level tools with high-quality descriptions. Disable MCP tools you aren't using."

**Translation:** Amp wants you to intentionally choose the integrations you actually need, rather than bloating the system with everything.

## **Setting Up MCP Servers**

### **1. Amp Configuration**

Create/edit your Amp configuration file:

**Location:** `~/.config/amp/settings.json` (or wherever Amp stores its config)

```json
{
  "amp.mcpServers": {
    "playwright": {
      "command": "playwright-mcp-server",
      "args": ["--headless"],
      "env": {},
      "_target": "global"
    },
    "github": {
      "command": "github-mcp-server",
      "args": ["stdio", "--toolsets", "repos,issues,pull_requests"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      },
      "_target": "global"
    },
    "indexer": {
      "command": "mcp-code-indexer",
      "_target": "global"
    }
  },
  "amp.permissions": [
    { "tool": "*", "action": "allow" }
  ]
}
```

### **2. Install Required MCP Servers**

**Your friend's setup commands (verified and optimized):**

```bash
# Create MCP directory
mkdir -p ~/.local/bin

# Download pre-built GitHub MCP server binary (NO COMPILING!)
curl -L https://github.com/github/github-mcp-server/releases/latest/download/github-mcp-server-$(uname -s)-$(uname -m) -o ~/.local/bin/github-mcp-server
chmod +x ~/.local/bin/github-mcp-server

# Install pipx (Python package installer for isolated environments)
brew install pipx

# Install MCP servers via pipx
pipx install mcp-code-indexer
pipx install mcp-clipboardify

# Install Playwright MCP server via npm (PERFECT for our E2E testing!)
npm install -g @executeautomation/playwright-mcp-server

# Optional: Clone MCP examples if you want to explore
# git clone https://github.com/modelcontextprotocol/modelcontextprotocol ~/mcp/examples
```

### **3. VSCode Integration (via MCP Extension)**

Install the MCP extension in VSCode:
1. Search for "MCP" or "Model Context Protocol" in extensions
2. Install the official MCP extension
3. Configure in VSCode settings.json:

```json
{
  "mcp.servers": {
    "playwright": {
      "command": "@executeautomation/playwright-mcp-server", 
      "args": ["--headless"]
    },
    "github": {
      "command": "~/mcp/github-mcp-server/cmd/github-mcp-server/github-mcp-server",
      "args": ["stdio", "--toolsets", "repos,issues,pull_requests"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## **Using MCP for Tari Universe E2E Testing**

### **Playwright MCP Integration**

With the Playwright MCP server, you can now use AI to:

```typescript
// Instead of writing manual Playwright code, you can use MCP
// AI can generate and execute browser automation directly

// Example: Language testing automation
await mcpPlaywright.goto('http://localhost:1420');
await mcpPlaywright.click('[data-testid="settings-button"]');
await mcpPlaywright.selectOption('[data-testid="language-selector"]', 'es');
const spanishText = await mcpPlaywright.textContent('[data-testid="wallet-balance"]');
```

### **GitHub MCP Integration** *(Optional - Not needed for MVP)*

Could be useful for:
- Creating test result issues automatically
- Updating QA reports in the repo
- Managing test case documentation  
- Tracking regression patterns

**But honestly - do we need this for E2E testing? Probably not initially.**

### **Code Indexer MCP**

Helps with:
- Understanding codebase structure for test targeting
- Finding components that need testing
- Analyzing code changes for test impact

## **Testing Your MCP Setup**

### **1. Verify Amp Integration**

In Amp, try using MCP tools:
```
Can you use the playwright MCP server to navigate to localhost:1420 and take a screenshot?
```

### **2. Test Playwright MCP**

```bash
# Test the server directly
playwright-mcp-server --headless
```

## **Benefits for Tari Universe Testing**

### **AI-Driven Test Creation**
```
"Generate a Playwright test that changes language from English to French 
and verifies the mining status text changes appropriately"
```

### **Automated Issue Reporting**
```
"Use GitHub MCP to create an issue for the language translation bug 
found in the Spanish locale testing"
```

### **Dynamic Test Maintenance** 
```
"Use code indexer to find all components with data-testid attributes 
and generate comprehensive UI tests"
```

## **Security Considerations**

- Store API keys in environment variables
- Use least-privilege access for GitHub tokens
- Consider using `_target: "workspace"` instead of `"global"` for project-specific servers

## **Troubleshooting**

### **Common Issues:**

1. **Server not found:** Ensure MCP servers are installed globally
2. **Permission denied:** Check file permissions on MCP server executables
3. **API key issues:** Verify environment variables are set correctly

### **Debugging:**

```bash
# Test MCP server directly
playwright-mcp-server --version
github-mcp-server --help
```

---

**This MCP setup will supercharge our E2E testing capabilities with AI-driven automation!**
