// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

#[cfg(test)]
mod xmrig_manager_tests {
    use super::super::xmrig_process_manager::XmrigProcessManager;

    #[test]
    fn new_manager_owns_nothing() {
        let mgr = XmrigProcessManager::new();
        assert!(!mgr.is_owned(1234), "Fresh manager must not own any pid");
        assert!(!mgr.is_owned(0), "Fresh manager must not own pid 0");
    }

    #[test]
    fn register_and_verify_ownership() {
        let mgr = XmrigProcessManager::new();
        mgr.owned_pids.lock().unwrap().insert(5678);
        assert!(mgr.is_owned(5678), "Registered pid must be owned");
        assert!(!mgr.is_owned(9999), "External pid must never be owned");
    }

    #[test]
    fn deregister_removes_ownership() {
        let mgr = XmrigProcessManager::new();
        mgr.owned_pids.lock().unwrap().insert(1111);
        assert!(mgr.is_owned(1111));
        mgr.deregister(1111);
        assert!(!mgr.is_owned(1111), "Deregistered pid must not be owned");
    }

    #[test]
    fn multiple_pids_tracked_independently() {
        let mgr = XmrigProcessManager::new();
        for pid in [100u32, 200, 300] {
            mgr.owned_pids.lock().unwrap().insert(pid);
        }
        assert!(mgr.is_owned(100));
        assert!(mgr.is_owned(200));
        assert!(mgr.is_owned(300));
        assert!(!mgr.is_owned(400), "Unregistered pid must not be owned");
        mgr.deregister(200);
        assert!(!mgr.is_owned(200));
        assert!(mgr.is_owned(100), "Other pids unaffected by deregister");
    }

    #[test]
    fn shutdown_owned_is_safe_when_empty() {
        // shutdown_owned on empty manager must not panic
        let mgr = XmrigProcessManager::new();
        mgr.shutdown_owned(); // must not panic
    }

    #[test]
    fn external_pid_never_owned_even_after_shutdown() {
        let mgr = XmrigProcessManager::new();
        mgr.owned_pids.lock().unwrap().insert(1000);
        // External pid 9999 was never registered
        assert!(!mgr.is_owned(9999),
            "External xmrig process must NEVER be owned by TU manager");
    }
}
