// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

#[cfg(test)]
mod hashrate_utils_tests {
    use super::super::hashrate_utils::*;

    #[test]
    fn macos_cpu_always_hs() {
        assert_eq!(hashrate_unit("c29", "macos"), "H/s",
            "macOS must display H/s for c29 - it does not support Cuckoo Cycle mining");
        assert_eq!(hashrate_unit("sha3", "macos"), "H/s");
        assert_eq!(hashrate_unit("rx", "macos"), "H/s");
    }

    #[test]
    fn linux_c29_uses_gs() {
        assert_eq!(hashrate_unit("c29", "linux"), "G/s",
            "Linux c29 mining uses G/s (graphs per second)");
    }

    #[test]
    fn windows_c29_uses_gs() {
        assert_eq!(hashrate_unit("c29", "windows"), "G/s");
    }

    #[test]
    fn non_c29_always_hs() {
        for platform in &["linux", "windows", "macos"] {
            assert_eq!(hashrate_unit("sha3", platform), "H/s");
            assert_eq!(hashrate_unit("randomx", platform), "H/s");
        }
    }

    #[test]
    fn format_macos_shows_hs_not_gs() {
        let result = format_hashrate(1_500_000.0, "c29", "macos");
        assert!(!result.contains("G/s"), "macOS must not show G/s, got: {}", result);
        assert!(result.contains("H/s"), "macOS must show H/s, got: {}", result);
    }

    #[test]
    fn format_suffix_scaling() {
        let giga = format_hashrate(2_000_000_000.0, "sha3", "linux");
        let mega = format_hashrate(3_000_000.0, "sha3", "linux");
        let kilo = format_hashrate(5_000.0, "sha3", "linux");
        let raw  = format_hashrate(500.0, "sha3", "linux");
        assert!(giga.contains("G"));
        assert!(mega.contains("M"));
        assert!(kilo.contains("K"));
        assert!(raw.contains("500"));
    }
}
