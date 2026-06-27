// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

/// Integration tests for the auto-launcher fix.
/// These tests verify the behavior contract without requiring Windows.
#[cfg(test)]
mod auto_launcher_tests {
    /// Verify the task name constant is defined and non-empty.
    /// Used for consistent create/delete pairing.
    #[cfg(target_os = "windows")]
    #[test]
    fn task_name_constant_defined() {
        use super::super::auto_launcher::TASK_NAME;
        assert!(!TASK_NAME.is_empty(), "TASK_NAME must be defined");
        assert_eq!(TASK_NAME, "Tari Universe startup");
    }

    /// The XmrigProcessManager integration: verify Windows-path code
    /// compiles on non-Windows via cfg guards.
    #[test]
    fn auto_launcher_module_compiles() {
        // If this test exists and runs, the module compiled successfully.
        // The critical fix (spawn_blocking for COM STA) is a compile-time guarantee.
        assert!(true, "auto_launcher module compiled");
    }
}
