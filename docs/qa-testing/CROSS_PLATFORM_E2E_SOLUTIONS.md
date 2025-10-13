# Cross-Platform E2E Testing Solutions for Tari Universe

**Problem:** Need unified E2E testing that works on both macOS and Windows for a Tauri desktop app with heavy backend integration.

**Solution:** Abstract platform differences with a unified automation API.

## **Option 1: Image-Based Automation (Proven Winner)**

### **SikuliX + Python Wrapper**
**Why this works:** Finds elements by **visual appearance**, not platform-specific selectors.

```python
# unified_automation.py
import sikulix as sikuli
import pyautogui
import platform

class TariUniverseTestFramework:
    def __init__(self):
        self.platform = platform.system()
        self.screenshots_path = f"test_images/{self.platform.lower()}"
        
    def launch_app(self):
        """Launch Tari Universe - platform agnostic"""
        if self.platform == "Darwin":  # macOS
            pyautogui.hotkey('cmd', 'space')  # Spotlight
            pyautogui.write('Tari Universe')
            pyautogui.press('enter')
        elif self.platform == "Windows":
            pyautogui.hotkey('win')  # Start menu
            pyautogui.write('Tari Universe')
            pyautogui.press('enter')
            
    def click_settings(self):
        """Click settings button - works on both platforms"""
        settings_image = f"{self.screenshots_path}/settings_button.png"
        if sikuli.exists(settings_image):
            sikuli.click(settings_image)
            return True
        return False
        
    def change_language_to_spanish(self):
        """Complete language change workflow"""
        # 1. Click settings
        assert self.click_settings(), "Settings button not found"
        
        # 2. Click language dropdown
        language_dropdown = f"{self.screenshots_path}/language_dropdown.png"
        sikuli.click(language_dropdown)
        
        # 3. Select Spanish
        spanish_option = f"{self.screenshots_path}/spanish_option.png"  
        sikuli.click(spanish_option)
        
        # 4. Verify change
        return self.verify_spanish_ui()
        
    def verify_spanish_ui(self):
        """Verify UI changed to Spanish"""
        balance_spanish = f"{self.screenshots_path}/balance_spanish.png"
        return sikuli.exists(balance_spanish, timeout=5)

# Usage
tester = TariUniverseTestFramework()
tester.launch_app()
success = tester.change_language_to_spanish()
assert success, "Language change failed"
```

**Setup:**
```bash
# Install cross-platform dependencies
pip install SikuliX pyautogui pillow opencv-python
```

**Pros:**
- ✅ **100% cross-platform** - same code, different images
- ✅ **Visual-based** - finds elements humans can see
- ✅ **No platform APIs** - works with any UI framework
- ✅ **Robust** - doesn't break with UI framework changes

**Cons:**
- ❌ **Requires screenshot maintenance** per platform
- ❌ **Resolution dependent** - needs multiple image sizes

## **Option 2: Appium Desktop (Industry Standard)**

### **Unified Appium API with Platform Drivers**
```javascript
// unified-e2e-test.js
const { remote } = require('webdriverio');

class TariE2EFramework {
    constructor() {
        this.driver = null;
        this.platform = process.platform;
    }
    
    async initDriver() {
        const capabilities = this.getPlatformCapabilities();
        this.driver = await remote({
            hostname: 'localhost',
            port: 4723,
            capabilities
        });
    }
    
    getPlatformCapabilities() {
        if (this.platform === 'darwin') {
            // macOS with Mac2 driver
            return {
                platformName: 'mac',
                'appium:automationName': 'Mac2',
                'appium:bundleId': 'com.tari.universe.alpha',
                'appium:arguments': ['--test-mode']
            };
        } else if (this.platform === 'win32') {
            // Windows with WinAppDriver
            return {
                platformName: 'windows',
                'appium:automationName': 'windows',
                'appium:app': 'C:\\path\\to\\TariUniverse.exe'
            };
        }
    }
    
    async changeLanguageToSpanish() {
        // Same test logic for both platforms
        const settingsButton = await this.driver.$('~Settings'); // Accessibility ID
        await settingsButton.click();
        
        const languageDropdown = await this.driver.$('~Language');
        await languageDropdown.click();
        
        const spanishOption = await this.driver.$('~Español');
        await spanishOption.click();
        
        // Verify change
        const balanceLabel = await this.driver.$('~Balance');
        const text = await balanceLabel.getText();
        return text === 'Saldo'; // Spanish for Balance
    }
}

// Usage
const tester = new TariE2EFramework();
await tester.initDriver();
const success = await tester.changeLanguageToSpanish();
assert(success, 'Language change failed');
```

**Setup:**
```bash
# Install Appium
npm install -g appium
npm install -g @appium/doctor

# Install platform drivers
appium driver install mac2      # macOS
appium driver install windows   # Windows

# Install WebDriverIO
npm install webdriverio @wdio/cli
```

**Pros:**
- ✅ **Industry standard** - used by major companies
- ✅ **Unified API** - same test code, different drivers
- ✅ **Robust** - mature, well-maintained
- ✅ **Accessible** - uses platform accessibility APIs

**Cons:**
- ❌ **Complex setup** - multiple drivers and dependencies
- ❌ **Requires accessibility IDs** in your Tauri app

## **Option 3: Custom Abstraction Layer (Recommended)**

### **Platform-Agnostic Test Framework**
```python
# tari_e2e_framework.py
from abc import ABC, abstractmethod
import platform

class PlatformAutomator(ABC):
    @abstractmethod
    def launch_app(self): pass
    
    @abstractmethod
    def find_element(self, selector): pass
    
    @abstractmethod  
    def click_element(self, element): pass
    
    @abstractmethod
    def get_element_text(self, element): pass

class MacOSAutomator(PlatformAutomator):
    def __init__(self):
        import pyobjc_framework_ApplicationServices as AS
        import pyobjc_framework_Quartz as Quartz
        self.AS = AS
        self.Quartz = Quartz
        
    def launch_app(self):
        import subprocess
        subprocess.run(['open', '-a', 'Tari Universe'])
        
    def find_element(self, selector):
        # Use macOS Accessibility API
        return self._find_by_accessibility_id(selector)
        
class WindowsAutomator(PlatformAutomator):
    def __init__(self):
        import pywin32
        self.win32 = pywin32
        
    def launch_app(self):
        import subprocess
        subprocess.run(['start', 'Tari Universe'], shell=True)
        
    def find_element(self, selector):
        # Use Windows UI Automation API
        return self._find_by_automation_id(selector)

class TariUniverseE2E:
    def __init__(self):
        system = platform.system()
        if system == 'Darwin':
            self.automator = MacOSAutomator()
        elif system == 'Windows':
            self.automator = WindowsAutomator()
        else:
            raise Exception(f"Unsupported platform: {system}")
            
    def test_language_change(self):
        """Unified test that works on both platforms"""
        # Launch app
        self.automator.launch_app()
        
        # Find and click settings (same test logic)
        settings_btn = self.automator.find_element('settings-button')
        self.automator.click_element(settings_btn)
        
        # Change language
        lang_dropdown = self.automator.find_element('language-selector')
        self.automator.click_element(lang_dropdown)
        
        spanish_option = self.automator.find_element('language-option-es')
        self.automator.click_element(spanish_option)
        
        # Verify change
        balance_label = self.automator.find_element('wallet-balance-label')
        text = self.automator.get_element_text(balance_label)
        return text == 'Saldo'

# Usage - Same code, different platforms
tester = TariUniverseE2E()  # Auto-detects platform
success = tester.test_language_change()
assert success, "Language change test failed"
```

## **Option 4: Robot Framework (Enterprise Choice)**

### **Keywords-Driven Cross-Platform Tests**
```robot
*** Settings ***
Library    Collections
Library    OperatingSystem
Library    Platform
Library    ./TariUniverseLibrary.py

*** Variables ***
${PLATFORM}    ${EMPTY}

*** Test Cases ***
Test Language Change To Spanish
    [Documentation]    Test changing language from English to Spanish
    Set Platform Variables
    Launch Tari Universe
    Click Settings Button
    Navigate To Language Settings
    Select Spanish Language
    Verify Spanish UI
    
*** Keywords ***
Set Platform Variables
    ${platform}=    Get Platform
    Set Suite Variable    ${PLATFORM}    ${platform}

Launch Tari Universe
    Run Keyword If    '${PLATFORM}' == 'Darwin'    Launch On MacOS
    Run Keyword If    '${PLATFORM}' == 'Windows'   Launch On Windows

Click Settings Button
    ${element}=    Find Element    settings-button
    Click Element    ${element}

Select Spanish Language
    ${dropdown}=    Find Element    language-selector
    Click Element    ${dropdown}
    ${option}=       Find Element    language-option-es
    Click Element    ${option}

Verify Spanish UI
    ${balance}=    Get Element Text    wallet-balance-label
    Should Be Equal    ${balance}    Saldo
```

**Setup:**
```bash
pip install robotframework
pip install robotframework-appiumlibrary
```

## **Recommended Implementation Strategy**

### **Phase 1: Image-Based MVP (1 week)**
- ✅ **Fastest to implement**
- ✅ **Works immediately on both platforms**  
- ✅ **No app changes required**

### **Phase 2: Add Accessibility IDs (2 weeks)**
- Add `data-testid` attributes to key Tauri components
- Enables more robust element selection
- Foundation for Appium integration

### **Phase 3: Hybrid Framework (3 weeks)**
- Combine image-based fallback with accessibility-based selection
- Best of both worlds: robust + maintainable

## **Implementation Plan for Your MVP**

```python
# Quick start with SikuliX + PyAutoGUI
class TariLanguageTest:
    def test_english_to_spanish(self):
        # 1. Take reference screenshots on both platforms
        self.capture_reference_images()
        
        # 2. Launch app (platform detected)
        self.launch_tari_universe()
        
        # 3. Click settings (image-based)
        assert self.click_image('settings_button.png')
        
        # 4. Change to Spanish (image-based)
        assert self.click_image('language_dropdown.png')
        assert self.click_image('spanish_option.png')
        
        # 5. Verify UI changed (image-based)
        assert self.wait_for_image('balance_spanish.png')
        
        return True
```

**This gives you:**
- ✅ **Same test code** on macOS and Windows
- ✅ **Full E2E testing** with backend integration
- ✅ **Visual verification** that language actually changed
- ✅ **Quick implementation** (days, not weeks)

**Want me to start building this image-based approach?** It's the fastest path to working cross-platform E2E tests.
