# External Production Testing Suite for Tari Universe

**Objective:** Build separate AI-powered testing repository that downloads, installs, and tests production Tari Universe builds across multiple environments

**Repository:** `tari-universe-e2e-testing` (separate from main Tari Universe repo)

## **Phase 1: Environment Setup (Day 1)**

### **Install Dependencies**

```bash
# Python environment
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Core AI automation dependencies
pip install openai pillow pyautogui
pip install requests python-dotenv
pip install pytest pytest-html

# Platform-specific helpers (for OS control)
pip install pyobjc-framework-Quartz          # macOS only
pip install pywin32                          # Windows only (when testing)
```

### **External Testing Repository Structure**

```
~/tari-universe-e2e-testing/                    # 🆕 SEPARATE REPO
├── framework/
│   ├── __init__.py
│   ├── ai_automator.py                         # AI-powered automation
│   ├── openrouter_client.py                    # OpenRouter + GPT-4 Vision
│   ├── platform_controller.py                  # Cross-platform OS control
│   ├── app_installer.py                        # Install production apps
│   └── version_manager.py                      # Download/manage app versions
├── test_cases/
│   ├── __init__.py
│   ├── test_language_switching.py              # Language E2E tests
│   ├── test_mining_workflows.py                # Future: Mining tests
│   └── test_wallet_operations.py               # Future: Wallet tests
├── test_data/
│   ├── expected_translations.json
│   ├── supported_versions.json                 # Tari versions to test
│   └── test_scenarios.json
├── installers/                                 # Production app installers
│   ├── macos/
│   │   ├── Tari-Universe-1.6.0.dmg
│   │   └── Tari-Universe-1.6.1.dmg
│   ├── windows/
│   │   ├── Tari-Universe-1.6.0.msi
│   │   └── Tari-Universe-1.6.1.msi
│   └── linux/
│       ├── Tari-Universe-1.6.0.deb
│       └── Tari-Universe-1.6.0.AppImage
├── screenshots/
│   ├── debug/                                  # Debug screenshots
│   ├── test_results/                           # Test execution results
│   └── baselines/                              # Reference screenshots
├── environments/
│   ├── docker-compose.yml                      # Docker Windows setup
│   ├── macos-setup.sh                          # macOS test env setup
│   └── windows-setup.ps1                       # Windows test env setup
├── .env                                        # OpenRouter API key
├── requirements.txt
├── pytest.ini
├── setup.py                                    # Package installation
└── README.md
```

## **Phase 2: AI Vision Framework (Day 2-3)**

### **OpenRouter Client**

```python
# framework/openrouter_client.py
import os
import base64
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "openai/gpt-4o"  # GPT-4 with vision

    def analyze_screenshot(self, screenshot_path, prompt):
        """Send screenshot to AI for analysis"""
        # Convert image to base64
        with Image.open(screenshot_path) as img:
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_b64 = base64.b64encode(buffered.getvalue()).decode()

        payload = {
            "model": self.model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{img_b64}"
                        }
                    }
                ]
            }],
            "max_tokens": 500
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            raise Exception(f"OpenRouter API error: {response.text}")

    def find_element_coordinates(self, screenshot_path, element_description):
        """AI finds element coordinates in screenshot"""
        prompt = f"""
        Look at this Tari Universe desktop application screenshot.
        Find the {element_description} and return ONLY the x,y coordinates where I should click.

        Return format: x,y (example: 150,200)

        If you cannot find the element, return: NOT_FOUND
        """

        response = self.analyze_screenshot(screenshot_path, prompt)
        return self._parse_coordinates(response)

    def verify_language_change(self, screenshot_path, target_language):
        """AI verifies if language actually changed"""
        prompt = f"""
        Look at this Tari Universe app screenshot.
        Check if the UI language has changed to {target_language}.

        Look for key indicators:
        - "Balance" should be "Saldo" in Spanish
        - "Settings" should be "Configuración" in Spanish
        - "Mining Status" should be "Estado de Minería" in Spanish

        Return ONLY: YES or NO
        """

        response = self.analyze_screenshot(screenshot_path, prompt)
        return "YES" in response.upper()

    def _parse_coordinates(self, response):
        """Parse coordinates from AI response"""
        try:
            if "NOT_FOUND" in response:
                return None
            # Extract x,y coordinates
            coords = response.strip().split(',')
            return (int(coords[0]), int(coords[1]))
        except:
            return None
```

### **Platform Controller**

```python
# framework/platform_controller.py
import platform
import subprocess
import pyautogui
import time

class PlatformController:
    def __init__(self):
        self.platform = platform.system()

        # Configure pyautogui for safety
        pyautogui.PAUSE = 0.5
        pyautogui.FAILSAFE = True

    def launch_tari_universe(self):
        """Launch Tari Universe - cross-platform"""
        if self.platform == "Darwin":  # macOS
            # Try multiple launch methods
            try:
                subprocess.run(['open', '-a', 'Tari Universe (Alpha)'], check=True)
            except subprocess.CalledProcessError:
                # Fallback: Use Spotlight
                pyautogui.hotkey('cmd', 'space')
                time.sleep(1)
                pyautogui.write('Tari Universe')
                pyautogui.press('enter')

        elif self.platform == "Windows":
            try:
                subprocess.run(['start', '', 'Tari Universe'], shell=True, check=True)
            except subprocess.CalledProcessError:
                # Fallback: Use Start menu
                pyautogui.hotkey('win')
                time.sleep(1)
                pyautogui.write('Tari Universe')
                pyautogui.press('enter')

        # Wait for app to load
        time.sleep(5)
        return True

    def click_at_coordinates(self, x, y):
        """Click at specific coordinates with platform adjustments"""
        if self.platform == "Darwin":
            # macOS sometimes needs different click behavior
            pyautogui.click(x, y, duration=0.1)
        else:
            pyautogui.click(x, y)

        time.sleep(0.5)  # Brief pause after click

    def close_app(self):
        """Close Tari Universe gracefully"""
        if self.platform == "Darwin":
            pyautogui.hotkey('cmd', 'q')
        elif self.platform == "Windows":
            pyautogui.hotkey('alt', 'f4')

        time.sleep(2)  # Wait for app to close
```

### **Production App Installer**

````python
# framework/app_installer.py
import os
import subprocess
import platform
import requests
from pathlib import Path

class ProductionAppInstaller:
    def __init__(self):
        self.platform = platform.system()
        self.installers_dir = Path("installers")

    def download_latest_release(self, version="latest"):
        """Download production Tari Universe installer"""
        if version == "latest":
            # Get latest release from GitHub API
            response = requests.get("https://api.github.com/repos/tari-project/universe/releases/latest")
            release_data = response.json()
            version = release_data["tag_name"]

        # Platform-specific download URLs
        download_urls = {
            "Darwin": f"https://github.com/tari-project/universe/releases/download/{version}/Tari-Universe-{version}.dmg",
            "Windows": f"https://github.com/tari-project/universe/releases/download/{version}/Tari-Universe-{version}.msi",
            "Linux": f"https://github.com/tari-project/universe/releases/download/{version}/Tari-Universe-{version}.deb"
        }

        url = download_urls.get(self.platform)
        if not url:
            raise Exception(f"No installer available for {self.platform}")

        # Download installer
        installer_path = self.installers_dir / self.platform.lower() / f"Tari-Universe-{version}{self._get_installer_extension()}"
        installer_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"📥 Downloading {url}...")
        response = requests.get(url, stream=True)
        with open(installer_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return installer_path

    def install_production_app(self, installer_path):
        """Install production Tari Universe from installer"""
        if self.platform == "Darwin":
            # Mount DMG and copy app
            subprocess.run(['hdiutil', 'attach', str(installer_path)])
            subprocess.run(['cp', '-R', '/Volumes/Tari Universe/Tari Universe.app', '/Applications/'])
            subprocess.run(['hdiutil', 'detach', '/Volumes/Tari Universe'])

        elif self.platform == "Windows":
            # Run MSI installer silently
            subprocess.run(['msiexec', '/i', str(installer_path), '/quiet'], check=True)

        elif self.platform == "Linux":
            # Install DEB package
            subprocess.run(['sudo', 'dpkg', '-i', str(installer_path)], check=True)

    def uninstall_app(self):
        """Clean uninstall of Tari Universe"""
        if self.platform == "Darwin":
            subprocess.run(['rm', '-rf', '/Applications/Tari Universe.app'])
        elif self.platform == "Windows":
            # Uninstall via Windows uninstaller
            subprocess.run(['wmic', 'product', 'where', 'name="Tari Universe"', 'call', 'uninstall'], shell=True)

    def _get_installer_extension(self):
        extensions = {"Darwin": ".dmg", "Windows": ".msi", "Linux": ".deb"}
        return extensions.get(self.platform, "")

### **AI-Powered Automation Framework**
```python
# framework/ai_automator.py
import time
import pyautogui
import os
from .openrouter_client import OpenRouterClient
from .platform_controller import PlatformController

class TariUniverseAIAutomator:
    def __init__(self):
        self.ai_client = OpenRouterClient()
        self.platform_controller = PlatformController()
        self.screenshot_counter = 0

    def take_debug_screenshot(self, step_name=""):
        """Take screenshot for debugging/logging"""
        self.screenshot_counter += 1
        timestamp = int(time.time())
        filename = f"debug_{self.screenshot_counter:03d}_{step_name}_{timestamp}.png"

        screenshot = pyautogui.screenshot()
        save_path = os.path.join("screenshots/debug", filename)
        screenshot.save(save_path)
        return save_path

    def ai_click_element(self, element_description):
        """Use AI to find and click an element"""
        # Take screenshot
        screenshot_path = self.take_debug_screenshot(f"finding_{element_description}")

        # Ask AI to find element
        coords = self.ai_client.find_element_coordinates(screenshot_path, element_description)

        if coords:
            print(f"AI found {element_description} at {coords}")
            self.platform_controller.click_at_coordinates(coords[0], coords[1])
            return True
        else:
            print(f"AI could not find {element_description}")
            return False

    def setup_production_testing(self, version="latest"):
        """Download and install production Tari Universe for testing"""
        from .app_installer import ProductionAppInstaller

        installer = ProductionAppInstaller()

        # Download production installer
        installer_path = installer.download_latest_release(version)
        print(f"📥 Downloaded installer: {installer_path}")

        # Clean previous installation
        installer.uninstall_app()

        # Install production app (like a user would)
        installer.install_production_app(installer_path)
        print("✅ Production Tari Universe installed")

        return True

    def launch_production_app(self):
        """Launch the installed production Tari Universe"""
        print("🚀 Launching production Tari Universe...")

        if self.platform_controller.platform == "Darwin":
            # Launch from Applications folder
            subprocess.run(['open', '-a', '/Applications/Tari Universe.app'])
        elif self.platform_controller.platform == "Windows":
            # Launch from Start Menu / Program Files
            subprocess.run(['start', '', 'Tari Universe'], shell=True)

        # Wait for production app to fully load and stabilize
        time.sleep(10)  # Production apps take longer to start

        return self.wait_for_production_app_ready()

    def wait_for_production_app_ready(self):
        """AI verifies production app is fully loaded"""
        screenshot_path = self.take_debug_screenshot("production_app_startup")

        ready_prompt = """
        Look at this Tari Universe production app screenshot.
        Is the application fully loaded with all mining components ready?

        Signs of a ready PRODUCTION app:
        - Main window visible with mining dashboard
        - Wallet balance displayed (may be 0.00)
        - Mining status visible (probably "Not Mining")
        - No loading spinners, setup wizards, or "Connecting..." messages
        - All UI elements rendered completely

        Return ONLY: READY or NOT_READY
        """

        analysis = self.ai_client.analyze_screenshot(screenshot_path, ready_prompt)

        if "READY" in analysis.upper():
            print("✅ Production app ready!")
            return True
        else:
            print("⏳ Production app still loading, waiting...")
            time.sleep(5)
            return self.wait_for_production_app_ready()  # Retry

    def change_language_to_spanish(self):
        """AI-powered language change workflow"""
        steps = [
            ("settings button", "Click the gear/settings icon"),
            ("general settings", "Click on General or Language settings tab"),
            ("language dropdown", "Click the language selection dropdown"),
            ("spanish option", "Click on 'Español' or 'Spanish' option")
        ]

        for element, description in steps:
            print(f"🔍 {description}")
            if not self.ai_click_element(element):
                raise Exception(f"Failed to find/click: {element}")
            time.sleep(1)  # Wait between steps

        # Verify language changed
        return self.verify_spanish_language()

    def verify_spanish_language(self):
        """AI verifies the language actually changed to Spanish"""
        print("🔍 Verifying language changed to Spanish...")
        screenshot_path = self.take_debug_screenshot("language_verification")

        return self.ai_client.verify_language_change(screenshot_path, "Spanish")

    def cleanup(self):
        """Clean shutdown"""
        print("🛑 Closing Tari Universe...")
        self.platform_controller.close_app()
````

## **Phase 3: Test Implementation (Day 3-4)**

### **AI-Powered Language Switching Test**

```python
# test_cases/test_language_switching.py
import pytest
import time
import os
from framework.ai_automator import TariUniverseAIAutomator

class TestLanguageSwitching:
    def setup_method(self):
        """Setup before each test"""
        self.automator = TariUniverseAIAutomator()

        # Ensure screenshot directories exist
        os.makedirs("screenshots/debug", exist_ok=True)
        os.makedirs("screenshots/test_results", exist_ok=True)

    def teardown_method(self):
        """Cleanup after each test"""
        self.automator.cleanup()

    def test_production_english_to_spanish_language_change(self):
        """AI-powered test: Production app English to Spanish language change"""
        # Setup: Download and install production app
        print("🏗️ Setting up production app for testing...")
        assert self.automator.setup_production_testing(version="latest"), "Failed to setup production app"

        # Launch production app and wait for AI to confirm it's ready
        assert self.automator.launch_production_app(), "Production app failed to launch"

        # Take baseline screenshot (English UI)
        baseline_screenshot = self.automator.take_debug_screenshot("production_english_baseline")
        print(f"📸 Production baseline screenshot: {baseline_screenshot}")

        # Execute AI-powered language change on PRODUCTION app
        print("🤖 Starting AI-powered language change on production build...")
        success = self.automator.change_language_to_spanish()

        # Take final screenshot (should be Spanish UI)
        final_screenshot = self.automator.take_debug_screenshot("production_spanish_result")
        print(f"📸 Production result screenshot: {final_screenshot}")

        # AI verification on production app
        assert success, "AI could not verify language change to Spanish in production app"
        print("✅ AI confirmed: Production app language successfully changed to Spanish!")

    def test_ai_language_elements_detection(self):
        """Test AI's ability to detect specific UI elements"""
        assert self.automator.launch_and_wait_for_ready()

        # Test AI can find common elements
        elements_to_find = [
            "wallet balance display",
            "mining status indicator",
            "settings button",
            "start mining button"
        ]

        found_elements = []
        for element in elements_to_find:
            screenshot_path = self.automator.take_debug_screenshot(f"finding_{element}")
            coords = self.automator.ai_client.find_element_coordinates(screenshot_path, element)
            if coords:
                found_elements.append(element)
                print(f"✅ AI found: {element} at {coords}")
            else:
                print(f"❌ AI missed: {element}")

        # At least 75% of elements should be found
        success_rate = len(found_elements) / len(elements_to_find)
        assert success_rate >= 0.75, f"AI element detection rate too low: {success_rate:.2%}"

    @pytest.mark.parametrize("target_language,display_name", [
        ("Spanish", "Español"),
        ("French", "Français"),
        ("German", "Deutsch")
    ])
    def test_ai_multiple_languages(self, target_language, display_name):
        """AI tests multiple language switching"""
        assert self.automator.launch_and_wait_for_ready()

        # AI navigates to language settings
        assert self.automator.ai_click_element("settings button")
        assert self.automator.ai_click_element("language dropdown")
        assert self.automator.ai_click_element(f"{display_name} language option")

        # AI verifies change
        screenshot_path = self.automator.take_debug_screenshot(f"{target_language}_verification")
        verified = self.automator.ai_client.verify_language_change(screenshot_path, target_language)

        assert verified, f"AI could not verify language change to {target_language}"
        print(f"✅ AI confirmed: Language changed to {target_language}")
```

## **Phase 4: Environment Configuration (Day 4)**

### **OpenRouter API Setup**

```bash
# Create .env file
echo "OPENROUTER_API_KEY=your_openrouter_key_here" > .env

# Test API connection
python -c "
from framework.openrouter_client import OpenRouterClient
client = OpenRouterClient()
print('✅ OpenRouter connection successful')
"
```

### **AI Prompt Templates**

```python
# prompts/element_finding.txt
ELEMENT_FINDING_PROMPT = """
You are helping test a Tari Universe desktop application.
Look at this screenshot and find the {element_description}.

Tari Universe is a cryptocurrency mining app with these common elements:
- Settings gear icon (usually top-right)
- Wallet balance area (shows XTM amount)
- Mining status (shows if mining is active)
- Language dropdown (in settings)

Return the exact pixel coordinates where I should click as: x,y
If you cannot find the element clearly, return: NOT_FOUND

Be precise - clicking the wrong place will break the test.
"""

# prompts/validation.txt
LANGUAGE_VALIDATION_PROMPT = """
You are verifying a language change in the Tari Universe mining app.
Look at this screenshot and determine if the UI language is {target_language}.

Key text to check:
- Balance/Wallet area: Should show "{target_language}" text
- Settings: Should be translated to {target_language}
- Mining status: Should be in {target_language}
- Button labels: Should be in {target_language}

Common translations to look for:
- Spanish: "Saldo" (Balance), "Configuración" (Settings), "Estado de Minería" (Mining Status)
- French: "Solde" (Balance), "Paramètres" (Settings), "Statut de Minage" (Mining Status)

Return ONLY: YES or NO
"""
```

## **Phase 5: Complete Implementation**

### **AI Test Runner**

```python
# run_ai_language_tests.py
import pytest
import sys
import os
import platform
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()

    # Verify OpenRouter API key
    if not os.getenv('OPENROUTER_API_KEY'):
        print("❌ Error: OPENROUTER_API_KEY not found in .env file")
        return 1

    print(f"🤖 Starting AI-Powered Tari Universe E2E Language Tests")
    print(f"Platform: {platform.system()}")
    print(f"AI Model: GPT-4 Vision via OpenRouter")

    # Ensure screenshot directories exist
    os.makedirs("screenshots/debug", exist_ok=True)
    os.makedirs("screenshots/test_results", exist_ok=True)

    # Ensure Tari Universe is not running
    print("🛑 Ensuring clean test environment...")
    if platform.system() == "Darwin":
        os.system("pkill -f 'Tari Universe'")
    elif platform.system() == "Windows":
        os.system("taskkill /f /im 'Tari Universe.exe' 2>nul")

    # Run AI-powered tests
    test_args = [
        'test_cases/',
        '-v',                                    # Verbose output
        '--html=test_results/ai_report.html',    # HTML report
        '--capture=no',                          # Show print statements
        '--tb=short',                           # Short traceback format
        '-m', 'not slow',                       # Skip slow tests by default
        '--durations=10'                        # Show 10 slowest tests
    ]

    print("🏃‍♂️ Running AI-powered language tests...")
    result = pytest.main(test_args)

    if result == 0:
        print("✅ All AI tests passed!")
        print("📊 Check test_results/ai_report.html for detailed results")
        print("📸 Debug screenshots available in screenshots/debug/")
    else:
        print("❌ Some AI tests failed. Check test_results/ai_report.html")
        print("🐛 Debug screenshots available for failure analysis")

    return result

if __name__ == "__main__":
    sys.exit(main())
```

### **Configuration**

```ini
# pytest.ini
[tool:pytest]
testpaths = test_cases
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    language: language switching tests
    smoke: quick smoke tests
    regression: regression test suite
    slow: slow-running tests

# Timeout for individual tests
timeout = 300

# Test output
addopts =
    --strict-markers
    --strict-config
    --disable-warnings
```

```txt
# requirements.txt
openai==1.54.4
pyautogui==0.9.54
pillow==10.4.0
requests==2.32.3
python-dotenv==1.0.1
pytest==8.3.3
pytest-html==4.1.1
pytest-timeout==2.3.1
pyobjc-framework-Quartz==10.3.1; sys_platform == "darwin"
pywin32==306; sys_platform == "win32"
```

## **Phase 6: CI/CD Integration**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/language-e2e-tests.yml
name: Language E2E Tests

on:
    push:
        paths: ['src/i18n/**', 'public/locales/**']
    pull_request:
        paths: ['src/i18n/**', 'public/locales/**']

jobs:
    e2e-macos:
        runs-on: macos-latest

        steps:
            - uses: actions/checkout@v4

            - name: Setup Python
              uses: actions/setup-python@v4
              with:
                  python-version: '3.11'

            - name: Install dependencies
              run: |
                  pip install -r tests/requirements.txt

            - name: Setup Tari Universe
              run: |
                  npm install
                  npm run tauri build

            - name: Run E2E Language Tests
              run: |
                  cd tests/
                  python run_language_tests.py

            - name: Upload test results
              if: always()
              uses: actions/upload-artifact@v4
              with:
                  name: macos-test-results
                  path: tests/test_results/

    e2e-windows:
        runs-on: windows-latest
        # Similar setup for Windows
```

## **Phase 7: Usage & Maintenance**

### **Quick Start Commands**

```bash
# Initial setup (one time)
cd tests/
pip install -r requirements.txt
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Run AI-powered language tests
python run_ai_language_tests.py

# Run specific test with AI
pytest test_cases/test_language_switching.py::test_ai_english_to_spanish_language_change -v

# Debug mode - save all AI interactions
OPENROUTER_DEBUG=true python run_ai_language_tests.py
```

### **Test Data Management**

```json
// test_data/expected_translations.json
{
    "languages": {
        "en": {
            "balance": "Balance",
            "settings": "Settings",
            "mining_status": "Mining Status",
            "start_mining": "Start Mining"
        },
        "es": {
            "balance": "Saldo",
            "settings": "Configuración",
            "mining_status": "Estado de Minería",
            "start_mining": "Comenzar Minería"
        }
    },
    "test_scenarios": [
        { "from": "en", "to": "es", "verify_elements": ["balance", "settings"] },
        { "from": "es", "to": "en", "verify_elements": ["balance", "mining_status"] },
        { "from": "en", "to": "fr", "verify_elements": ["balance"] }
    ]
}
```

## **Success Metrics**

### **MVP Acceptance Criteria**

- ✅ **Launch Tari Universe** automatically on Mac and Windows
- ✅ **Change language** via UI interaction (English → Spanish)
- ✅ **Verify UI text** actually changed to Spanish
- ✅ **Generate test report** with screenshots
- ✅ **Run in CI/CD** pipeline
- ✅ **Cross-platform** - same test code, different images

### **Performance Targets**

- **Test execution:** < 2 minutes per language
- **Success rate:** > 95% on clean environments
- **Image recognition:** > 90% accuracy
- **Platform coverage:** macOS + Windows

## **Multi-Environment Testing Strategy**

### **Phase 1: External Testing Repo Setup (Day 1-3)**

**Target:** Separate testing repository for production app testing

```bash
# Create external testing repository
mkdir ~/tari-universe-e2e-testing
cd ~/tari-universe-e2e-testing

# Initialize as separate Git repo
git init
git remote add origin https://github.com/your-org/tari-universe-e2e-testing

# Create testing structure
mkdir -p {framework,test_cases,test_data,installers/{macos,windows,linux},screenshots/{debug,test_results,baselines},environments}

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download production installers for testing
python setup_production_installers.py --version latest

# Test against installed production app
python run_production_tests.py --platform macos --version 1.6.1
```

### **Phase 2: Windows Laptop Testing (Day 4)**

**Target:** Your Windows laptop - validate cross-platform

```powershell
# Setup on Windows
cd C:\path\to\tari\universe
mkdir tests\e2e -force
python -m venv tests\e2e\venv
tests\e2e\venv\Scripts\activate
pip install -r tests\e2e\requirements.txt

# Test on Windows
cd tests\e2e
python run_ai_language_tests.py
```

### **Phase 3: Docker Windows Cloud Testing (Day 5)**

**Target:** [dockur/windows](https://github.com/dockur/windows) - automated cloud validation

#### **Docker Windows Setup**

```yaml
# docker-compose.yml
version: '3.8'
services:
    windows-testing:
        image: dockurr/windows
        container_name: tari-windows-test
        environment:
            VERSION: 'win11'
            RAM_SIZE: '8G'
            CPU_CORES: '4'
            DISK_SIZE: '50G'
        ports:
            - '8006:8006' # Web interface
            - '3389:3389' # RDP
        volumes:
            - ./tests:/tests
            - ./dist:/tari-dist
        cap_add:
            - NET_ADMIN
        devices:
            - /dev/kvm
        stop_grace_period: 2m
```

#### **Automated Windows Testing Script**

```bash
#!/bin/bash
# scripts/test-windows-docker.sh

echo "🐳 Starting Docker Windows environment..."
docker-compose up -d windows-testing

echo "⏳ Waiting for Windows to boot..."
sleep 120  # Wait for Windows to fully start

echo "📦 Installing Tari Universe in Docker Windows..."
# Copy Tari Universe installer to container
docker cp dist/Tari-Universe-Setup.exe tari-windows-test:/Windows/Temp/

# Connect and install via RDP automation
python scripts/windows_docker_installer.py

echo "🤖 Running AI language tests in Docker Windows..."
docker exec tari-windows-test powershell -Command "
    cd C:\tests\e2e
    python run_ai_language_tests.py
"

echo "📊 Collecting test results..."
docker cp tari-windows-test:/tests/e2e/test_results ./docker-test-results/
```

#### **Windows Docker Test Automation**

```python
# scripts/windows_docker_installer.py
import pyautogui
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

class DockerWindowsSetup:
    def __init__(self):
        # Connect to Docker Windows via web interface
        self.driver = webdriver.Chrome()
        self.driver.get("http://localhost:8006")

    def install_tari_universe(self):
        """Install Tari Universe in Docker Windows"""
        # Navigate Windows desktop via web interface
        # Click on installer
        # Go through installation wizard
        # Launch Tari Universe

    def setup_test_environment(self):
        """Prepare Windows environment for testing"""
        # Install Python
        # Install test dependencies
        # Copy test framework
        # Set up OpenRouter API key
```

## **Cross-Platform Validation Matrix**

### **Testing Environments**

| Environment         | Platform        | Testing Method | Validation           |
| ------------------- | --------------- | -------------- | -------------------- |
| **Development Mac** | macOS 15.x      | AI + PyAutoGUI | ✅ Primary dev/debug |
| **Windows Laptop**  | Windows 11      | AI + PyAutoGUI | ✅ Physical device   |
| **Docker Windows**  | Win11 Container | AI + Web RDP   | ✅ CI/CD automation  |

### **Test Scenarios Per Environment**

```python
# Cross-platform test matrix
PLATFORMS = [
    {"name": "macOS", "app_name": "Tari Universe (Alpha)"},
    {"name": "Windows", "app_name": "Tari Universe"},
    {"name": "Docker-Windows", "app_name": "Tari Universe"}
]

LANGUAGES = [
    {"code": "es", "display": "Español", "verify_text": "Saldo"},
    {"code": "fr", "display": "Français", "verify_text": "Solde"},
    {"code": "de", "display": "Deutsch", "verify_text": "Guthaben"}
]

for platform in PLATFORMS:
    for language in LANGUAGES:
        test_language_change(platform, language)
```

## **CI/CD Integration with All Environments**

### **GitHub Actions Multi-Platform**

```yaml
# .github/workflows/multi-platform-ai-e2e.yml
name: Multi-Platform AI E2E Tests

on:
    push:
        paths: ['src/i18n/**', 'public/locales/**']

jobs:
    test-macos:
        runs-on: macos-latest
        steps:
            - uses: actions/checkout@v4
            - name: Run AI E2E Tests (macOS)
              run: |
                  cd tests/e2e
                  python run_ai_language_tests.py
              env:
                  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

    test-windows-laptop:
        runs-on: windows-latest
        steps:
            - uses: actions/checkout@v4
            - name: Run AI E2E Tests (Windows)
              run: |
                  cd tests/e2e
                  python run_ai_language_tests.py
              env:
                  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

    test-docker-windows:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - name: Setup Docker Windows
              run: |
                  docker-compose up -d windows-testing
                  sleep 120
            - name: Run AI E2E Tests (Docker Windows)
              run: ./scripts/test-windows-docker.sh
              env:
                  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

## **Timeline: 5-7 Days Total**

- **Day 1:** macOS AI framework setup + basic test
- **Day 2-3:** Perfect macOS implementation + debugging
- **Day 4:** Windows laptop testing + platform adjustments
- **Day 5:** Docker Windows setup + automation
- **Day 6-7:** CI integration + comprehensive validation

## **Success Metrics Across All Platforms**

### **MVP Acceptance Criteria**

- ✅ **Launch Tari Universe** automatically on Mac, Windows, Docker Windows
- ✅ **AI finds UI elements** with >90% accuracy on all platforms
- ✅ **Change language** English → Spanish via AI navigation
- ✅ **AI verifies language** actually changed by reading text
- ✅ **Generate reports** with screenshots from all environments
- ✅ **Cross-platform** - same Python code, platform-agnostic AI

**This gives you bulletproof validation:** If it passes on all three environments, you know the language switching works universally! 🎯

Ready to start with Day 1 macOS setup?
