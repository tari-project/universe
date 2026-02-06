# Mock Infrastructure Guide

This document provides detailed guidance on using and extending the mock infrastructure for backend testing.

## Table of Contents

- [Overview](#overview)
- [Available Mocks](#available-mocks)
- [MockProcessInstance](#mockprocessinstance)
- [MockStatusMonitor](#mockstatusmonitor)
- [Creating New Mocks](#creating-new-mocks)
- [Mock vs Stub vs Fake](#mock-vs-stub-vs-fake)
- [Future: E2E Stubs](#future-e2e-stubs)

---

## Overview

The mock infrastructure lives in `src-tauri/src/testing/mocks/` and provides test doubles for components that:

- Spawn external processes
- Make network calls
- Interact with system resources
- Have non-deterministic behavior

### Design Principles

1. **Configurable behavior** - Mocks can be configured per-test
2. **Thread-safe** - Use `Arc` and atomic types for shared state
3. **Trait-compatible** - Implement the same traits as production code
4. **No I/O** - Mocks never perform real I/O operations

---

## Available Mocks

| Mock | Replaces | Trait | Location |
|------|----------|-------|----------|
| `MockProcessInstance` | `ProcessInstance` | `ProcessInstanceTrait` | `testing/mocks/process_mocks.rs` |
| `MockStatusMonitor` | Various monitors | `StatusMonitor` | `testing/mocks/process_mocks.rs` |

---

## MockProcessInstance

Simulates a managed external process without spawning anything.

### Structure

```rust
pub struct MockProcessInstance {
    pub ping_result: Arc<AtomicBool>,
    pub exit_code: Arc<AtomicI32>,
    pub shutdown_triggered: Arc<AtomicBool>,
    pub is_running: Arc<AtomicBool>,
}
```

### Builder Pattern

```rust
let mock = MockProcessInstance::new()
    .with_ping_result(true)   // ping() returns true
    .with_exit_code(0);       // stop() returns 0
```

### Dynamic Configuration

```rust
let mock = MockProcessInstance::new();

// Change behavior during test
mock.set_ping_result(false);  // Simulate process death
mock.exit_code.store(1, Ordering::SeqCst);  // Change exit code
```

### Trait Implementation

```rust
#[async_trait]
impl ProcessInstanceTrait for MockProcessInstance {
    fn ping(&self) -> bool {
        // Returns true only if running AND ping_result is true
        self.is_running.load(Ordering::SeqCst) 
            && self.ping_result.load(Ordering::SeqCst)
    }
    
    async fn start(&mut self, _task_tracker: TaskTracker) -> Result<(), anyhow::Error> {
        self.is_running.store(true, Ordering::SeqCst);
        self.shutdown_triggered.store(false, Ordering::SeqCst);
        Ok(())
    }
    
    async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.is_running.store(false, Ordering::SeqCst);
        self.shutdown_triggered.store(true, Ordering::SeqCst);
        Ok(self.exit_code.load(Ordering::SeqCst))
    }
    
    // ... other methods
}
```

### Usage Examples

#### Basic Lifecycle Test

```rust
#[tokio::test]
async fn test_process_lifecycle() {
    let mut mock = MockProcessInstance::new();
    let tracker = TaskTracker::new();
    
    // Process starts
    mock.start(tracker).await.unwrap();
    assert!(mock.ping());
    
    // Process stops
    let code = mock.stop().await.unwrap();
    assert_eq!(code, 0);
    assert!(!mock.ping());
}
```

#### Simulating Process Death

```rust
#[tokio::test]
async fn test_process_dies() {
    let mut mock = MockProcessInstance::new();
    let tracker = TaskTracker::new();
    
    mock.start(tracker).await.unwrap();
    
    // Simulate unexpected death
    mock.set_ping_result(false);
    
    assert!(!mock.ping(), "Process should appear dead");
}
```

#### Testing Error Exit Codes

```rust
#[tokio::test]
async fn test_error_exit_code() {
    let mut mock = MockProcessInstance::new()
        .with_exit_code(42);
    
    let tracker = TaskTracker::new();
    mock.start(tracker).await.unwrap();
    
    let code = mock.stop().await.unwrap();
    assert_eq!(code, 42);
}
```

---

## MockStatusMonitor

Simulates health check responses for process monitoring.

### Structure

```rust
pub struct MockStatusMonitor {
    pub health_status: Arc<RwLock<HealthStatus>>,
    pub unhealthy_result: Arc<RwLock<HandleUnhealthyResult>>,
}
```

### Builder Pattern

```rust
let monitor = MockStatusMonitor::new()
    .with_health_status(HealthStatus::Healthy)
    .with_unhealthy_result(HandleUnhealthyResult::Continue);
```

### Dynamic Configuration

```rust
let monitor = MockStatusMonitor::new();

// Change during test to simulate health degradation
monitor.set_health_status(HealthStatus::Warning);
// ... run health check
monitor.set_health_status(HealthStatus::Unhealthy);
// ... run health check again
```

### Trait Implementation

```rust
#[async_trait]
impl StatusMonitor for MockStatusMonitor {
    async fn check_health(
        &self, 
        _uptime: Duration, 
        _timeout_duration: Duration
    ) -> HealthStatus {
        self.health_status.read().unwrap().clone()
    }
    
    async fn handle_unhealthy(
        &self,
        _duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        Ok(self.unhealthy_result.read().unwrap().clone())
    }
}
```

### Usage Examples

#### Health Status Transitions

```rust
#[tokio::test]
async fn test_health_status_sequence() {
    let monitor = MockStatusMonitor::new();
    
    // Start healthy
    monitor.set_health_status(HealthStatus::Healthy);
    let status = monitor.check_health(Duration::ZERO, Duration::from_secs(5)).await;
    assert_eq!(status, HealthStatus::Healthy);
    
    // Degrade to warning
    monitor.set_health_status(HealthStatus::Warning);
    let status = monitor.check_health(Duration::ZERO, Duration::from_secs(5)).await;
    assert_eq!(status, HealthStatus::Warning);
    
    // Become unhealthy
    monitor.set_health_status(HealthStatus::Unhealthy);
    let status = monitor.check_health(Duration::ZERO, Duration::from_secs(5)).await;
    assert_eq!(status, HealthStatus::Unhealthy);
}
```

#### Testing Unhealthy Handling

```rust
#[tokio::test]
async fn test_unhealthy_stops_process() {
    let monitor = MockStatusMonitor::new()
        .with_health_status(HealthStatus::Unhealthy)
        .with_unhealthy_result(HandleUnhealthyResult::Stop);
    
    let result = monitor.handle_unhealthy(Duration::from_secs(60)).await.unwrap();
    assert_eq!(result, HandleUnhealthyResult::Stop);
}
```

---

## Creating New Mocks

### Step 1: Identify the Trait

Find the trait you need to mock:

```rust
// In production code
#[async_trait]
pub trait WalletOperations {
    async fn get_balance(&self) -> Result<WalletBalance, Error>;
    async fn send_transaction(&self, amount: u64, address: String) -> Result<TxId, Error>;
}
```

### Step 2: Create Mock Structure

```rust
// In testing/mocks/wallet_mocks.rs
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct MockWalletOperations {
    pub balance: Arc<RwLock<WalletBalance>>,
    pub send_result: Arc<RwLock<Result<TxId, String>>>,
}

impl Default for MockWalletOperations {
    fn default() -> Self {
        Self {
            balance: Arc::new(RwLock::new(WalletBalance::default())),
            send_result: Arc::new(RwLock::new(Ok(TxId::default()))),
        }
    }
}
```

### Step 3: Add Builder Methods

```rust
impl MockWalletOperations {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub fn with_balance(self, balance: WalletBalance) -> Self {
        *self.balance.blocking_write() = balance;
        self
    }
    
    pub fn with_send_error(self, error: String) -> Self {
        *self.send_result.blocking_write() = Err(error);
        self
    }
}
```

### Step 4: Implement the Trait

```rust
#[async_trait]
impl WalletOperations for MockWalletOperations {
    async fn get_balance(&self) -> Result<WalletBalance, Error> {
        Ok(self.balance.read().await.clone())
    }
    
    async fn send_transaction(&self, _amount: u64, _address: String) -> Result<TxId, Error> {
        self.send_result.read().await.clone()
            .map_err(|e| anyhow::anyhow!(e))
    }
}
```

### Step 5: Register in mod.rs

```rust
// In testing/mocks/mod.rs
pub mod process_mocks;
pub mod wallet_mocks;  // Add new mock module
```

---

## Mock vs Stub vs Fake

Understanding the differences helps choose the right approach:

### Mock (Current Implementation)

- **Purpose**: Verify interactions and control responses
- **Behavior**: Configurable, records calls, can have expectations
- **Example**: `MockProcessInstance`, `MockStatusMonitor`

```rust
let mock = MockStatusMonitor::new()
    .with_health_status(HealthStatus::Healthy);
// Mock returns configured value
```

### Stub (Future: E2E)

- **Purpose**: Provide canned responses for E2E tests
- **Behavior**: Externally controlled via config file
- **Example**: `StubWalletOperations`

```rust
// Behavior controlled by JSON config
let stub = StubWalletOperations::from_config("stub_config.json");
```

### Fake (Not Implemented)

- **Purpose**: Simplified working implementation
- **Behavior**: Actually performs operations, but simplified
- **Example**: In-memory database instead of real database

```rust
// Would actually store/retrieve data
let fake = FakeDatabase::new();
fake.insert("key", "value");
assert_eq!(fake.get("key"), Some("value"));
```

---

## Future: E2E Stubs

For end-to-end testing, we'll implement externally-controlled stubs.

### Stub Configuration

```json
{
  "wallet": {
    "get_balance": {
      "behavior": "success",
      "value": { "available": 1000000, "pending": 0 }
    },
    "send_transaction": {
      "behavior": "delay",
      "delay_ms": 500,
      "then": { "behavior": "success", "value": "tx_12345" }
    }
  },
  "node": {
    "get_status": {
      "behavior": "error",
      "error": "Connection refused"
    }
  }
}
```

### Stub Implementation

```rust
pub struct StubWalletOperations {
    config_path: PathBuf,
}

impl StubWalletOperations {
    pub fn from_env() -> Self {
        let path = std::env::var("TARI_STUB_CONFIG")
            .unwrap_or_else(|_| "stub_config.json".to_string());
        Self { config_path: PathBuf::from(path) }
    }
    
    fn load_config(&self) -> StubConfig {
        let content = std::fs::read_to_string(&self.config_path).unwrap();
        serde_json::from_str(&content).unwrap()
    }
}

#[async_trait]
impl WalletOperations for StubWalletOperations {
    async fn get_balance(&self) -> Result<WalletBalance, Error> {
        let config = self.load_config();
        match config.wallet.get_balance.behavior {
            Behavior::Success => Ok(config.wallet.get_balance.value),
            Behavior::Error => Err(anyhow::anyhow!(config.wallet.get_balance.error)),
            Behavior::Delay { ms, then } => {
                tokio::time::sleep(Duration::from_millis(ms)).await;
                // Handle 'then'
            }
        }
    }
}
```

### Feature Flag

```toml
# Cargo.toml
[features]
stub-mode = []
```

```rust
// Conditional compilation
#[cfg(feature = "stub-mode")]
use stubs::StubWalletOperations as WalletImpl;

#[cfg(not(feature = "stub-mode"))]
use wallet::WalletAdapter as WalletImpl;
```

### Running E2E Tests

```bash
# Set up stub configuration
export TARI_STUB_CONFIG=/path/to/test_config.json

# Run with stub mode
cargo test --features stub-mode
```
