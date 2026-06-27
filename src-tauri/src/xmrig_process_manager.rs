// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

/// Scoped xmrig process manager.
///
/// Tracks only the xmrig processes that Tari Universe spawned,
/// ensuring shutdown only terminates OUR xmrig instances and
/// never touches externally-launched xmrig processes.
use std::{
    collections::HashSet,
    process::Child,
    sync::{Arc, Mutex},
};
use log::{info, warn};

#[derive(Debug, Default)]
pub struct XmrigProcessManager {
    /// PIDs of xmrig processes spawned by THIS Tari Universe instance.
    owned_pids: Arc<Mutex<HashSet<u32>>>,
}

impl XmrigProcessManager {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a newly spawned xmrig process.
    pub fn register(&self, child: &Child) {
        let pid = child.id();
        self.owned_pids.lock().unwrap().insert(pid);
        info!("XmrigProcessManager: registered pid {}", pid);
    }

    /// Deregister a process (e.g. after it exits naturally).
    pub fn deregister(&self, pid: u32) {
        self.owned_pids.lock().unwrap().remove(&pid);
        info!("XmrigProcessManager: deregistered pid {}", pid);
    }

    /// Terminate only the xmrig processes owned by this manager.
    /// External xmrig instances are never touched.
    pub fn shutdown_owned(&self) {
        let pids = self.owned_pids.lock().unwrap().clone();
        info!(
            "XmrigProcessManager: shutting down {} owned process(es): {:?}",
            pids.len(), pids
        );
        for pid in &pids {
            Self::kill_pid(*pid);
        }
    }

    /// Returns true if the given PID is owned by this manager.
    pub fn is_owned(&self, pid: u32) -> bool {
        self.owned_pids.lock().unwrap().contains(&pid)
    }

    #[cfg(unix)]
    fn kill_pid(pid: u32) {
        use nix::{
            sys::signal::{kill, Signal},
            unistd::Pid,
        };
        match kill(Pid::from_raw(pid as i32), Signal::SIGTERM) {
            Ok(_) => info!("Sent SIGTERM to owned xmrig pid {}", pid),
            Err(e) => warn!("Failed to send SIGTERM to pid {}: {}", pid, e),
        }
    }

    #[cfg(windows)]
    fn kill_pid(pid: u32) {
        use windows_sys::Win32::{
            Foundation::CloseHandle,
            System::{
                Diagnostics::ToolHelp::*,
                Threading::{OpenProcess, TerminateProcess, PROCESS_TERMINATE},
            },
        };
        unsafe {
            let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
            if !handle.is_null() {
                TerminateProcess(handle, 1);
                CloseHandle(handle);
                info!("Terminated owned xmrig pid {}", pid);
            } else {
                warn!("Could not open process for owned xmrig pid {}", pid);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_owns_registered_pids() {
        let mgr = XmrigProcessManager::new();
        mgr.owned_pids.lock().unwrap().insert(1234);
        assert!(mgr.is_owned(1234));
        assert!(!mgr.is_owned(9999), "External pid 9999 must not be owned");
    }

    #[test]
    fn deregister_removes_ownership() {
        let mgr = XmrigProcessManager::new();
        mgr.owned_pids.lock().unwrap().insert(1234);
        mgr.deregister(1234);
        assert!(!mgr.is_owned(1234));
    }
}
