# Backend Testing Infrastructure

This document describes the testing infrastructure for the Tari Universe Rust backend, including architecture, patterns, and guidelines for writing effective tests.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Dual Mocking Strategy](#dual-mocking-strategy)
- [Test Infrastructure Components](#test-infrastructure-components)
- [Writing Tests](#writing-tests)
- [Singleton Handling](#singleton-handling)
- [Running Tests](#running-tests)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Overview

The backend testing infrastructure provides:

- **115+ unit tests** covering critical business logic
- **Mock implementations** for process management and health monitoring
- **Isolated test contexts** using temporary directories
- **Parameterized testing** support via `test-case` crate

### Test Distribution

| Module | Tests | Coverage Focus |
|--------|-------|----------------|
| `process_watcher` | 12 | Health check state machine |
| `event_scheduler` | 29 | Cron parsing, duration validation |
| `setup_manager` | 28 | Phase orchestration, status transitions |
| `node_manager` | 15 | Node type logic, error handling |
| `wallet_manager` | 11 | Progress calculation, transaction matching |
| `internal_wallet` | 6 | Address types, initialization state |
| Infrastructure | 3 | Mocks and utilities |

---

## Architecture

```
src-tauri/src/
├── testing/                    # Test infrastructure
│   ├── mod.rs                  # Module root
│   ├── test_utils.rs           # TestContext, helpers
│   └── mocks/
│       ├── mod.rs
│       └── process_mocks.rs    # MockProcessInstance, MockStatusMonitor
│
├── *_test.rs                   # Test files (co-located with source)
│   ├── process_watcher_test.rs
│   ├── event_scheduler_test.rs
│   ├── internal_wallet_test.rs
│   └── ...
│
└── {module}/
    └── *_test.rs               # Module-specific tests
        ├── node/node_manager_test.rs
        ├── wallet/wallet_manager_test.rs
        └── setup/setup_manager_test.rs
```

---

## Dual Mocking Strategy

The testing infrastructure supports two mocking approaches for different testing needs:

### Unit Tests (Current Implementation)

Uses **mockall-style mocks** with `#[cfg(test)]` for fast, in-process testing:

```
┌─────────────────────────────────────────┐
│           PRODUCTION CODE               │
│                                         │
│   ProcessAdapter ──────► ProcessInstance│
│   StatusMonitor  ──────► HealthStatus   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           UNIT TESTS                    │
│                                         │
│   MockProcessInstance (configurable)    │
│   MockStatusMonitor (configurable)      │
│                                         │
│   ✓ Fast execution                      │
│   ✓ Deterministic                       │
│   ✓ No I/O or external processes        │
└─────────────────────────────────────────┘
```

### E2E Stub Tests (Future Implementation)

Will use **stub implementations** controlled via external configuration:

```
┌─────────────────────────────────────────┐
│           E2E TEST HARNESS              │
│                                         │
│   StubProcessAdapter                    │
│   StubWalletOperations                  │
│                                         │
│   Control via:                          │
│   - JSON config file                    │
│   - Environment variables               │
│   - Feature flag: --features stub-mode  │
└─────────────────────────────────────────┘
```

---

## Test Infrastructure Components

### TestContext

Provides isolated temporary directories for each test:

```rust
use crate::testing::test_utils::TestContext;

#[tokio::test]
async fn my_test() {
    let ctx = TestContext::new();
    
    // Use isolated directories
    let config_file = ctx.config_dir.join("test_config.json");
    let log_file = ctx.log_dir.join("test.log");
    
    // Directories are cleaned up when ctx is dropped
}
```

**Available paths:**
- `ctx.config_dir` - For configuration files
- `ctx.data_dir` - For data/state files
- `ctx.log_dir` - For log files
- `ctx.root()` - Base temporary directory

### MockProcessInstance

Simulates a managed process without spawning real processes:

```rust
use crate::testing::mocks::process_mocks::MockProcessInstance;

#[tokio::test]
async fn test_process_lifecycle() {
    let mut mock = MockProcessInstance::new()
        .with_ping_result(true)
        .with_exit_code(0);
    
    let tracker = TaskTracker::new();
    
    // Start the "process"
    mock.start(tracker).await.unwrap();
    assert!(mock.ping());
    
    // Stop and check exit code
    let exit_code = mock.stop().await.unwrap();
    assert_eq!(exit_code, 0);
}
```

**Configurable behaviors:**
- `ping_result` - Whether `ping()` returns true/false
- `exit_code` - Return value from `stop()`
- `is_running` - Internal running state

### MockStatusMonitor

Simulates health check responses:

```rust
use crate::testing::mocks::process_mocks::MockStatusMonitor;
use crate::process_adapter::HealthStatus;

#[tokio::test]
async fn test_health_transitions() {
    let monitor = MockStatusMonitor::new()
        .with_health_status(HealthStatus::Healthy);
    
    let status = monitor.check_health(
        Duration::from_secs(0),
        Duration::from_secs(5)
    ).await;
    
    assert_eq!(status, HealthStatus::Healthy);
    
    // Change status dynamically
    monitor.set_health_status(HealthStatus::Unhealthy);
}
```

**Configurable behaviors:**
- `health_status` - The status returned by `check_health()`
- `unhealthy_result` - Continue or Stop from `handle_unhealthy()`

---

## Writing Tests

### Test File Location

Tests are co-located with source files using the `*_test.rs` naming convention:

```
src/process_watcher.rs      # Source
src/process_watcher_test.rs # Tests
```

For module subdirectories:

```
src/node/node_manager.rs           # Source
src/node/node_manager_test.rs      # Tests
src/node/mod.rs                    # Add: #[cfg(test)] mod node_manager_test;
```

### Basic Test Structure

```rust
// Copyright header...

//! Unit tests for [module_name]

use super::*;  // Import from parent module
use crate::testing::test_utils::TestContext;

#[test]
fn test_synchronous_function() {
    let result = some_pure_function(42);
    assert_eq!(result, expected_value);
}

#[tokio::test]
async fn test_async_function() {
    let ctx = TestContext::new();
    let result = some_async_function(&ctx.config_dir).await;
    assert!(result.is_ok());
}
```

### Parameterized Tests

Use `test-case` for testing multiple inputs:

```rust
use test_case::test_case;

#[test_case(1, TimeUnit::Hours => Ok(Duration::hours(1)) ; "1 hour valid")]
#[test_case(24, TimeUnit::Hours => Ok(Duration::hours(24)) ; "24 hours valid")]
#[test_case(0, TimeUnit::Hours => Err(_) ; "0 hours invalid")]
#[test_case(25, TimeUnit::Hours => Err(_) ; "25 hours invalid")]
fn test_duration_parsing(value: i64, unit: TimeUnit) -> Result<Duration, SchedulerError> {
    SchedulerEventTiming::parse_duration_unit(value, unit)
}
```

### Testing Panic Behavior

Document expected panics with `#[should_panic]`:

```rust
#[test]
#[should_panic(expected = "InternalWallet is not initialized")]
fn current_panics_before_initialization() {
    // This documents a known panic path that should be converted to Result
    let _ = InternalWallet::current();
}
```

---

## Singleton Handling

Many components use the `LazyLock<RwLock<T>>` singleton pattern, which creates test isolation challenges.

### Current Approach

Use `serial_test` for tests that touch singletons:

```rust
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_requiring_singleton() {
    // This test runs alone, not in parallel
}
```

### Future: Reset Methods

Add reset methods to singletons (not yet implemented for all):

```rust
impl SomeManager {
    #[cfg(test)]
    pub async fn reset_for_testing() {
        if let Ok(mut guard) = INSTANCE.try_write() {
            *guard = Self::new();
        }
    }
}
```

### Singletons in the Codebase

| Singleton | File | Reset Available |
|-----------|------|-----------------|
| `ShutdownManager` | `shutdown_manager.rs` | ❌ |
| `TasksTrackers` | `tasks_tracker.rs` | ❌ |
| `ConfigMining` | `configs/config_mining.rs` | ❌ |
| `ConfigCore` | `configs/config_core.rs` | ❌ |
| `CpuManager` | `mining/cpu/manager.rs` | ❌ |
| `GpuManager` | `mining/gpu/manager.rs` | ❌ |
| `InternalWallet` | `internal_wallet.rs` | ❌ |

---

## Running Tests

### All Tests

```bash
cd src-tauri
cargo test
```

### Specific Test Module

```bash
cargo test process_watcher
cargo test event_scheduler
cargo test node_manager
```

### Single Test

```bash
cargo test test_healthy_status_resets_warning_count
```

### With Output

```bash
cargo test -- --nocapture
```

### Sequential (for singleton tests)

```bash
cargo test -- --test-threads=1
```

---

## Known Limitations

### 1. External Dependencies Not Mocked

Some components require external dependencies that aren't yet mockable:

- `AppHandle` (Tauri) - Requires tauri test utilities
- `CredentialManager` - Needs trait extraction
- `ConfigWallet` - Singleton with no reset
- `PinManager` - Static method calls

### 2. gRPC Clients

gRPC clients (`BaseNodeGrpcClient`, `WalletClient`) are mocked at the trait level, not the protocol level. This means:

- ✅ Business logic is tested
- ❌ gRPC serialization is not tested

### 3. Process Spawning

Tests never spawn real processes. The `launch_child_process` function is never called in tests. If you need to verify process spawning logic, use integration tests.

---

## Future Improvements

### Phase 1: Singleton Reset Infrastructure

Add `#[cfg(test)] reset_for_testing()` to all singletons.

### Phase 2: Trait Extraction

Extract traits for:
- `CredentialManager` → `CredentialStore` trait
- `WalletAdapter` → `WalletOperations` trait
- `TorAdapter` → `TorService` trait

### Phase 3: E2E Stub Mode

Implement stub implementations with feature flag:

```toml
[features]
stub-mode = []
```

```rust
#[cfg(feature = "stub-mode")]
use stubs::StubWalletOperations as WalletOps;

#[cfg(not(feature = "stub-mode"))]
use wallet::WalletAdapter as WalletOps;
```

### Phase 4: Integration Tests

Create `tests/integration/` directory with:
- Mining flow tests
- Wallet flow tests
- Node synchronization tests

---

## Related Documentation

- [TESTING_ISSUES.md](../../src-tauri/src/TESTING_ISSUES.md) - Known issues and TODOs discovered during testing
- [Rust Testing Book](https://doc.rust-lang.org/book/ch11-00-testing.html) - Official Rust testing guide
- [mockall documentation](https://docs.rs/mockall) - Mock library documentation
- [tokio testing](https://tokio.rs/tokio/topics/testing) - Async testing patterns
