# Testing Patterns and Best Practices

This document provides patterns, examples, and best practices for testing the Tari Universe backend.

## Table of Contents

- [Pattern: Testing State Machines](#pattern-testing-state-machines)
- [Pattern: Testing Async Code](#pattern-testing-async-code)
- [Pattern: Testing Error Paths](#pattern-testing-error-paths)
- [Pattern: Testing with Temporary Files](#pattern-testing-with-temporary-files)
- [Pattern: Testing Enums and Display Traits](#pattern-testing-enums-and-display-traits)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Coverage Guidelines](#coverage-guidelines)

---

## Pattern: Testing State Machines

Many components have state machine behavior. Test each transition explicitly.

### Example: Health Status Transitions

```rust
use crate::process_adapter::HealthStatus;
use crate::testing::mocks::process_mocks::{MockProcessInstance, MockStatusMonitor};

/// Test the state machine for health check outcomes
#[tokio::test]
async fn health_check_state_machine() {
    // Setup
    let mut mock_process = MockProcessInstance::new();
    let mock_monitor = MockStatusMonitor::new();
    let tracker = TaskTracker::new();
    
    mock_process.start(tracker.clone()).await.unwrap();
    
    // Test: Healthy -> warning_count resets
    mock_monitor.set_health_status(HealthStatus::Healthy);
    let mut warning_count = 5;
    // ... call do_health_check
    assert_eq!(warning_count, 0, "Healthy status should reset warning count");
    
    // Test: Warning -> warning_count increments
    mock_monitor.set_health_status(HealthStatus::Warning);
    // ... call do_health_check
    assert_eq!(warning_count, 1, "Warning should increment count");
    
    // Test: Unhealthy -> triggers restart (after startup period)
    mock_monitor.set_health_status(HealthStatus::Unhealthy);
    // ... verify restart occurred
}
```

### Key Points

1. **Test each state individually** - Don't combine multiple transitions
2. **Test boundary conditions** - e.g., warning count at 10 vs 11
3. **Test invalid state transitions** - What happens with unexpected input?

---

## Pattern: Testing Async Code

Use `tokio::test` macro and be mindful of timeouts.

### Basic Async Test

```rust
#[tokio::test]
async fn test_async_operation() {
    let result = some_async_function().await;
    assert!(result.is_ok());
}
```

### With Timeout Protection

```rust
use tokio::time::{timeout, Duration};

#[tokio::test]
async fn test_with_timeout() {
    let result = timeout(
        Duration::from_secs(5),
        potentially_slow_operation()
    ).await;
    
    assert!(result.is_ok(), "Operation timed out");
    assert!(result.unwrap().is_ok());
}
```

### Testing Shutdown Signals

```rust
use tari_shutdown::Shutdown;

#[tokio::test]
async fn test_respects_shutdown() {
    let mut shutdown = Shutdown::new();
    let signal = shutdown.to_signal();
    
    // Trigger shutdown
    shutdown.trigger();
    
    // Verify operation respects shutdown
    assert!(signal.is_triggered());
}
```

---

## Pattern: Testing Error Paths

Test both success and failure paths explicitly.

### Using Result Matching

```rust
use crate::event_scheduler::{CronSchedule, SchedulerError};

#[test]
fn valid_input_succeeds() {
    let result = CronSchedule::new("0 22 * * *", "0 6 * * *");
    assert!(result.is_ok());
}

#[test]
fn invalid_input_returns_specific_error() {
    let result = CronSchedule::new("invalid", "0 6 * * *");
    
    assert!(matches!(
        result,
        Err(SchedulerError::InvalidCronPattern(pattern)) if pattern == "invalid"
    ));
}
```

### Testing Multiple Error Cases

```rust
use test_case::test_case;

#[test_case("" => matches Err(SchedulerError::InvalidCronPattern(_)) ; "empty string")]
#[test_case("invalid" => matches Err(SchedulerError::InvalidCronPattern(_)) ; "invalid pattern")]
#[test_case("60 0 * * *" => matches Err(SchedulerError::InvalidCronPattern(_)) ; "invalid minute")]
#[test_case("0 25 * * *" => matches Err(SchedulerError::InvalidCronPattern(_)) ; "invalid hour")]
fn test_cron_validation(input: &str) -> Result<CronSchedule, SchedulerError> {
    CronSchedule::new(input, "0 6 * * *")
}
```

---

## Pattern: Testing with Temporary Files

Use `TestContext` for file-based tests.

### File Operations

```rust
use crate::testing::test_utils::TestContext;
use std::fs;

#[test]
fn test_config_file_operations() {
    let ctx = TestContext::new();
    
    // Write test data
    let config_path = ctx.config_dir.join("test.json");
    fs::write(&config_path, r#"{"key": "value"}"#).unwrap();
    
    // Test reading
    let content = fs::read_to_string(&config_path).unwrap();
    assert!(content.contains("value"));
    
    // Files are automatically cleaned up when ctx drops
}
```

### Isolated Config Testing

```rust
#[tokio::test]
async fn test_config_isolation() {
    let ctx = TestContext::new();
    
    // Each test gets its own directory
    let config_file = ctx.config_dir.join("config.json");
    
    // No interference with other tests
    assert!(!config_file.exists());
}
```

---

## Pattern: Testing Enums and Display Traits

Ensure enum variants are correctly formatted and serialized.

### Display Trait Testing

```rust
use crate::setup::setup_manager::SetupPhase;

#[test]
fn setup_phase_display() {
    assert_eq!(format!("{}", SetupPhase::Core), "Core");
    assert_eq!(format!("{}", SetupPhase::CpuMining), "CPU Mining");
    assert_eq!(format!("{}", SetupPhase::GpuMining), "GPU Mining");
    assert_eq!(format!("{}", SetupPhase::Node), "Node");
    assert_eq!(format!("{}", SetupPhase::Wallet), "Wallet");
}
```

### Serialization Round-Trip

```rust
#[test]
fn enum_serialization_roundtrip() {
    let original = NodeType::RemoteUntilLocal;
    
    let json = serde_json::to_string(&original).unwrap();
    let restored: NodeType = serde_json::from_str(&json).unwrap();
    
    assert_eq!(original, restored);
}
```

### Exhaustive Enum Testing

```rust
#[test]
fn all_variants_covered() {
    let all_phases = SetupPhase::all();
    
    assert_eq!(all_phases.len(), 5);
    assert!(all_phases.contains(&SetupPhase::Core));
    assert!(all_phases.contains(&SetupPhase::CpuMining));
    assert!(all_phases.contains(&SetupPhase::GpuMining));
    assert!(all_phases.contains(&SetupPhase::Node));
    assert!(all_phases.contains(&SetupPhase::Wallet));
}
```

---

## Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```rust
// BAD: Tests internal state directly
#[test]
fn bad_test() {
    let manager = SomeManager::new();
    assert_eq!(manager.internal_counter, 0);  // Don't test private fields
}

// GOOD: Tests observable behavior
#[test]
fn good_test() {
    let manager = SomeManager::new();
    assert!(manager.is_ready());  // Test public API
}
```

### ❌ Flaky Time-Dependent Tests

```rust
// BAD: Depends on wall clock
#[tokio::test]
async fn bad_timing_test() {
    let start = Instant::now();
    some_operation().await;
    assert!(start.elapsed() < Duration::from_millis(100));  // Flaky!
}

// GOOD: Use timeouts and mocks
#[tokio::test]
async fn good_timing_test() {
    let result = timeout(Duration::from_secs(5), some_operation()).await;
    assert!(result.is_ok());
}
```

### ❌ Testing Multiple Concerns

```rust
// BAD: Tests too many things
#[test]
fn bad_test() {
    let schedule = CronSchedule::new("0 22 * * *", "0 6 * * *").unwrap();
    let next = schedule.find_next_start_time(Local::now());
    assert!(next.is_some());
    let wait = schedule.find_next_start_wait_time(Local::now());
    assert!(wait.is_some());
    // ... and more
}

// GOOD: One assertion per test (or closely related assertions)
#[test]
fn cron_schedule_parses_valid_pattern() {
    let result = CronSchedule::new("0 22 * * *", "0 6 * * *");
    assert!(result.is_ok());
}

#[test]
fn cron_schedule_finds_next_start() {
    let schedule = CronSchedule::new("0 22 * * *", "0 6 * * *").unwrap();
    let next = schedule.find_next_start_time(Local::now());
    assert!(next.is_some());
}
```

### ❌ Ignoring Async Context

```rust
// BAD: Mixing sync and async incorrectly
#[test]  // Missing tokio::test!
fn bad_async_test() {
    let result = tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(async_function());  // Clunky
}

// GOOD: Use tokio::test
#[tokio::test]
async fn good_async_test() {
    let result = async_function().await;
    assert!(result.is_ok());
}
```

---

## Coverage Guidelines

### What to Test

| Priority | What | Why |
|----------|------|-----|
| HIGH | State machines | Complex branching logic |
| HIGH | Error handling | Prevent silent failures |
| HIGH | Validation logic | Input boundary conditions |
| MEDIUM | Serialization | Data persistence correctness |
| MEDIUM | Display traits | User-facing strings |
| LOW | Simple getters | Usually obvious correctness |

### What NOT to Test

- Private implementation details
- External library behavior (e.g., tokio, serde)
- Generated code
- Simple pass-through functions

### Minimum Coverage Targets

| Component | Target | Notes |
|-----------|--------|-------|
| Business logic | 80% | Core algorithms, state machines |
| Error paths | 100% | All error types should be tested |
| Public API | 90% | All public functions |
| Critical paths | 100% | Wallet, credentials, process management |

---

## Quick Reference

### Test Macros

```rust
#[test]                           // Synchronous test
#[tokio::test]                    // Async test
#[test_case(...)]                 // Parameterized test
#[should_panic(expected = "...")]  // Expected panic
#[ignore]                         // Skip test (with reason)
#[serial]                         // Run sequentially
```

### Common Assertions

```rust
assert!(condition);
assert_eq!(left, right);
assert_ne!(left, right);
assert!(matches!(value, Pattern));
assert!(result.is_ok());
assert!(result.is_err());
```

### Test Organization

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    // Test helpers
    fn setup() -> TestFixture { ... }
    
    // Grouped by functionality
    mod parsing {
        #[test] fn valid_input() { ... }
        #[test] fn invalid_input() { ... }
    }
    
    mod state_machine {
        #[test] fn transition_a_to_b() { ... }
        #[test] fn transition_b_to_c() { ... }
    }
}
```
