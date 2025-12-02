# Configuring Playwright MCP Server with Amp in VSCode

## **Method 1: Direct Settings Configuration (Recommended)**

### **Find Your Amp Settings File:**

```bash
# On macOS:
open ~/Library/Application\ Support/Code/User/settings.json

# OR check these locations:
# ~/.config/Code/User/settings.json
# ~/Library/Application Support/Code/User/settings.json
```

### **Add MCP Server Configuration:**

Add this to your VSCode `settings.json`:

```json
{
    "amp.mcpServers": {
        "playwright": {
            "command": "@executeautomation/playwright-mcp-server",
            "args": ["--headless"],
            "env": {},
            "_target": "global"
        }
    },
    "amp.permissions": [{ "tool": "*", "action": "allow" }]
}
```

## **Method 2: VSCode Settings UI**

1. **Open VSCode Settings:** `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. **Search for "amp mcp"** in the settings search
3. **Find "Amp: Mcp Servers"** setting
4. **Click "Edit in settings.json"**
5. **Add the configuration** from Method 1

## **Verify Configuration**

### **Test the MCP Server:**

1. **Restart VSCode** after adding the configuration
2. **Open Amp chat** (usually Cmd+Shift+A or through Command Palette)
3. **Test with a simple command:**
    ```
    Can you use the playwright MCP server to take a screenshot of google.com?
    ```

### **Check Amp's MCP Status:**

1. **Open Command Palette:** `Cmd+Shift+P`
2. **Search for:** "Amp: Show MCP Servers"
3. **Verify playwright server** is listed and connected

## **Troubleshooting**

### **Common Issues:**

**1. "Command not found" error:**

```bash
# Verify playwright MCP server is installed globally
which @executeautomation/playwright-mcp-server
npm list -g @executeautomation/playwright-mcp-server
```

**2. "Permission denied" error:**

```bash
# Check npm global path
npm config get prefix
# Ensure it's in your PATH
echo $PATH
```

**3. MCP Server doesn't show up:**

- Restart VSCode completely
- Check VSCode Developer Console (`Help > Toggle Developer Tools`) for errors
- Verify settings.json syntax is valid JSON

### **Debug Commands:**

```bash
# Test MCP server directly
npx @executeautomation/playwright-mcp-server --help

# Check Amp extension logs
# In VSCode: Help > Toggle Developer Tools > Console
# Look for "amp" or "mcp" related messages
```

## **Testing Your Setup**

Once configured, try these commands in Amp chat:

```
1. "Use playwright to navigate to localhost:1420"
2. "Take a screenshot of the current page"
3. "Find elements with data-testid attributes"
4. "Click on the settings button"
```

If these work, you're ready for Tari Universe E2E testing! 🚀
