// Copyright 2024. The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

/// Unit tests verifying that process-scoping logic never kills externally
/// launched processes.
///
/// These tests do NOT spawn real processes; they exercise the decision logic
/// that guards when a kill is issued.
#[cfg(test)]
mod scoping_tests {
    use std::collections::HashSet;

    /// Simulates the owned-PID check: only kill if the candidate PID is in
    /// the set we previously wrote to our pid file.
    fn should_kill_pid(candidate: u32, owned: &HashSet<u32>) -> bool {
        owned.contains(&candidate)
    }

    #[test]
    fn owned_pid_is_killed() {
        let mut owned = HashSet::new();
        owned.insert(1234_u32);
        assert!(should_kill_pid(1234, &owned),
            "TU-owned PID must be eligible for cleanup");
    }

    #[test]
    fn external_pid_is_not_killed() {
        let owned: HashSet<u32> = HashSet::new(); // TU never wrote this PID
        assert!(!should_kill_pid(5678, &owned),
            "Externally launched process must NEVER be killed by TU shutdown");
    }

    #[test]
    fn empty_owned_set_kills_nothing() {
        let owned: HashSet<u32> = HashSet::new();
        for pid in [1u32, 100, 9999, u32::MAX] {
            assert!(!should_kill_pid(pid, &owned),
                "With no owned PIDs, nothing should be killed (pid={})", pid);
        }
    }

    #[test]
    fn multiple_owned_pids_correct() {
        let owned: HashSet<u32> = [10, 20, 30].iter().cloned().collect();
        assert!(should_kill_pid(10, &owned));
        assert!(should_kill_pid(20, &owned));
        assert!(should_kill_pid(30, &owned));
        assert!(!should_kill_pid(99, &owned),
            "PID 99 is not owned — must not be killed");
    }

    /// Simulates the binary-path guard in kill_previous_instances: when the
    /// pid file is corrupt we fall back to name-based lookup, but only kill
    /// if the found executable path lives under our own binary directory.
    fn should_kill_by_path(found_exe: &str, our_binary_dir: &str) -> bool {
        found_exe.starts_with(our_binary_dir)
    }

    #[test]
    fn path_match_allows_kill() {
        assert!(should_kill_by_path(
            "/home/user/.local/tari/xmrig",
            "/home/user/.local/tari",
        ), "Matching binary dir must allow kill");
    }

    #[test]
    fn path_mismatch_prevents_kill() {
        assert!(!should_kill_by_path(
            "/usr/local/bin/xmrig",
            "/home/user/.local/tari",
        ), "Independently installed xmrig must be preserved");
    }

    #[test]
    fn path_mismatch_user_mining_setup() {
        assert!(!should_kill_by_path(
            "/home/alice/mining/xmrig",
            "/home/alice/.tari/universe",
        ), "User's own mining setup must not be touched");
    }
}
