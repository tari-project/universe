// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

/// Returns the correct hashrate unit label for the given mining algorithm and platform.
/// macOS does not support Cuckoo Cycle (c29) mining, so CPU hashrate on Mac
/// should always be displayed in H/s (hashes per second), not G/s (graphs per second).
pub fn hashrate_unit(algorithm: &str, platform: &str) -> &'static str {
    match (algorithm, platform) {
        // c29/Cuckoo Cycle uses G/s (graphs per second) — but only on non-Mac
        ("c29", platform) if platform != "macos" => "G/s",
        // All other cases: H/s
        _ => "H/s",
    }
}

/// Format a hashrate value with the correct unit label.
pub fn format_hashrate(value: f64, algorithm: &str, platform: &str) -> String {
    let unit = hashrate_unit(algorithm, platform);
    if value >= 1_000_000_000.0 {
        format!("{:.2} G{}", value / 1_000_000_000.0, unit)
    } else if value >= 1_000_000.0 {
        format!("{:.2} M{}", value / 1_000_000.0, unit)
    } else if value >= 1_000.0 {
        format!("{:.2} K{}", value / 1_000.0, unit)
    } else {
        format!("{:.2} {}", value, unit)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn macos_cpu_uses_hs_not_gs() {
        assert_eq!(hashrate_unit("c29", "macos"), "H/s",
            "macOS should display H/s not G/s for CPU mining");
    }

    #[test]
    fn linux_c29_uses_gs() {
        assert_eq!(hashrate_unit("c29", "linux"), "G/s");
    }

    #[test]
    fn sha3_always_hs() {
        assert_eq!(hashrate_unit("sha3", "macos"), "H/s");
        assert_eq!(hashrate_unit("sha3", "linux"), "H/s");
        assert_eq!(hashrate_unit("sha3", "windows"), "H/s");
    }

    #[test]
    fn format_macos_cpu_hashrate() {
        let formatted = format_hashrate(1_500_000.0, "c29", "macos");
        assert!(formatted.contains("H/s"),
            "macOS hashrate should show H/s, got: {}", formatted);
        assert!(!formatted.contains("G/s"),
            "macOS hashrate must not show G/s, got: {}", formatted);
    }
}
