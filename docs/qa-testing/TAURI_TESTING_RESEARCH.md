# Tauri E2E Testing Research & Implementation Guide

**Status:** Complete Research - Ready for Implementation  
**Target:** Language switching E2E testing for Tari Universe  
**Platform Focus:** macOS (primary), Windows/Linux (secondary)

## **Key Findings**

### **❌ Tauri WebDriver Limitations**

- **macOS NOT SUPPORTED** - No WKWebView driver available
- **Windows/Linux Only** - Requires Edge Driver/WebKitWebDriver
- **Complex Setup** - Requires tauri-driver + native WebDriver tools

### **✅ Viable Testing Approaches for macOS**

## **Option 1: System-Level UI Automation (Recommended for MVP)**

### **macOS Accessibility API with Python**

```python
# pip install pyobjc-framework-ApplicationServices pyobjc-framework-Quartz
import Quartz
from ApplicationServices import AXUIElementCreateApplication, AXUIElementCopyElementAtPosition

def find_tari_app():
    """Find Tari Universe app window"""
    apps = Quartz.CGWindowListCopyWindowInfo(
        Quartz.kCGWindowListOptionOnScreenOnly,
        Quartz.kCGNullWindowID
    )
    for app in apps:
        if 'Tari Universe' in app.get('kCGWindowName', ''):
            return app
    return None

def click_settings_button():
    """Click settings button via accessibility"""
    tari_app = find_tari_app()
    if tari_app:
        # Use accessibility API to find and click elements
        ax_app = AXUIElementCreateApplication(tari_app['kCGWindowOwnerPID'])
        # Navigate accessibility tree to find settings button
```

**Pros:**

- ✅ Works on macOS natively
- ✅ Can interact with any UI element
- ✅ Cross-platform with platform-specific implementations

**Cons:**

- ❌ Platform-specific code required
- ❌ More brittle than WebDriver
- ❌ Requires accessibility permissions

### **AppleScript Automation**

```applescript
tell application "Tari Universe (Alpha)"
    activate
    delay 1

    tell application "System Events"
        tell process "Tari Universe (Alpha)"
            -- Click settings button
            click button "Settings" of window 1
            delay 1

            -- Navigate to language settings
            click button "General" of window 1
            delay 1

            -- Change language
            click popup button "Language" of window 1
            click menu item "Español" of menu 1 of popup button "Language" of window 1
        end tell
    end tell
end tell
```

**Pros:**

- ✅ Native macOS integration
- ✅ Simple scripting syntax
- ✅ Good for basic automation

**Cons:**

- ❌ macOS only
- ❌ Limited error handling
- ❌ Fragile element selection

## **Option 2: Tauri WebDriver (Windows/Linux Only)**

### **Setup Requirements**

```bash
# Install tauri-driver
cargo install tauri-driver --locked

# Windows: Install Edge Driver
cargo install --git https://github.com/chippers/msedgedriver-tool
msedgedriver-tool.exe

# Linux: Install WebKitWebDriver
sudo apt install webkit2gtk-driver
```

### **WebdriverIO Configuration**

```javascript
// wdio.conf.js
export const config = {
    host: '127.0.0.1',
    port: 4444,
    capabilities: [
        {
            'tauri:options': {
                application: '../target/debug/tari-universe',
            },
        },
    ],

    beforeSession: () => {
        // Start tauri-driver
        tauriDriver = spawn('tauri-driver', []);
    },

    onPrepare: () => {
        // Build Tauri app in debug mode
        spawnSync('npm', ['run', 'tauri', 'build', '--debug']);
    },
};
```

### **Language Test Example**

```javascript
// language-switch.e2e.js
describe('Language Switching', () => {
    it('should change UI language from English to Spanish', async () => {
        // Find settings button
        const settingsBtn = await $('[data-testid="settings-button"]');
        await settingsBtn.click();

        // Navigate to language settings
        const languageSelect = await $('[data-testid="language-selector"]');
        await languageSelect.click();

        // Select Spanish
        const spanishOption = await $('[data-testid="language-option-es"]');
        await spanishOption.click();

        // Verify text changed
        const balanceLabel = await $('[data-testid="wallet-balance-label"]');
        const text = await balanceLabel.getText();
        expect(text).toContain('Saldo'); // Spanish for "Balance"
    });
});
```

## **Option 3: Component Testing (Fastest to Implement)**

### **React Testing Library + Jest**

```javascript
// LanguageSelector.test.jsx
import { render, fireEvent, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import LanguageSelector from './LanguageSelector';

test('changes language when option selected', () => {
    render(
        <I18nextProvider i18n={i18n}>
            <LanguageSelector />
        </I18nextProvider>
    );

    // Find language dropdown
    const languageSelect = screen.getByTestId('language-selector');

    // Change to Spanish
    fireEvent.change(languageSelect, { target: { value: 'es' } });

    // Verify i18n language changed
    expect(i18n.language).toBe('es');
});
```

**Pros:**

- ✅ Fast to implement
- ✅ Cross-platform
- ✅ Integrated with existing React setup

**Cons:**

- ❌ Doesn't test full Tauri integration
- ❌ Misses IPC command testing
- ❌ Limited to component-level testing

## **Option 4: Hybrid Playwright + System Integration**

### **Custom MCP Server for Tauri**

```javascript
// tauri-automation-mcp-server.js
import { spawn } from 'child_process';
import { MacOSAccessibility } from './macos-accessibility.js';

class TauriMCPServer {
    async navigateToApp(appName) {
        // Use system APIs to focus app
        if (process.platform === 'darwin') {
            return await MacOSAccessibility.focusApp(appName);
        }
        // Windows/Linux implementations
    }

    async clickElement(selector) {
        // Convert web selector to system coordinates
        // Click using system APIs
    }

    async getElementText(selector) {
        // Read text via accessibility APIs
    }
}
```

## **Implementation Recommendation for Tari Universe**

### **Phase 1: MVP Component Testing (Week 1)**

```bash
# Setup component testing
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev jest-environment-jsdom

# Create test file
touch src/components/LanguageSelector.test.jsx
```

### **Phase 2: macOS System Testing (Week 2-3)**

```bash
# Install Python dependencies
pip install pyobjc-framework-ApplicationServices pyautogui pillow

# Create system test runner
mkdir tests/system
touch tests/system/language_test.py
```

### **Phase 3: Cross-Platform WebDriver (Week 4)**

```bash
# Setup for Windows/Linux CI
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework
cargo install tauri-driver --locked
```

## **Language Testing Implementation Plan**

### **Test Structure**

```
tests/
├── component/           # React component tests
│   └── LanguageSelector.test.jsx
├── system/             # System-level automation
│   ├── macos/          # macOS Accessibility API
│   ├── windows/        # Windows UI Automation
│   └── linux/          # Linux accessibility
├── integration/        # Tauri WebDriver tests
│   └── language-switching.e2e.js
└── utils/
    ├── test-data.json  # Expected translations
    └── helpers.js      # Common test utilities
```

### **Test Data Structure**

```json
{
    "translations": {
        "en": {
            "wallet-balance": "Balance",
            "settings": "Settings",
            "mining-status": "Mining Status"
        },
        "es": {
            "wallet-balance": "Saldo",
            "settings": "Configuración",
            "mining-status": "Estado de Minería"
        }
    }
}
```

## **Next Steps**

1. **Start with Component Testing** - Fastest path to working tests
2. **Build macOS System Testing** - Most comprehensive for your platform
3. **Add WebDriver for CI/CD** - Windows/Linux pipeline testing
4. **Integrate with existing QA workflow** - Supplement manual testing

**The component testing approach will give you immediate results, while the system testing provides the comprehensive E2E validation you need for the language switching feature.**
