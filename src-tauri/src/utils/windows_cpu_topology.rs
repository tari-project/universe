//! Windows splits logical processors into "processor groups" of at most 64
//! processors each. By default a process - and every thread it creates - is
//! confined to a single processor group. Detection APIs such as
//! `GetSystemInfo` (and therefore `std::thread::available_parallelism`) only
//! ever report the processors in the *current* group, so on machines with
//! more than 64 logical processors CPU mining silently tops out at 64
//! threads no matter what thread count is configured.
//!
//! This module detects the true logical processor count across *all*
//! processor groups and provides a helper to pin newly spawned worker
//! threads to specific groups so mining can actually use every core.
//!
//! Callers spawning CPU mining worker threads should use
//! [`total_logical_processors`] instead of `std::thread::available_parallelism`
//! when computing the maximum usable thread count, and should call
//! [`assign_current_thread_to_group`] at the start of each worker thread,
//! passing the worker's index so threads are distributed round-robin across
//! all available processor groups.

#[cfg(target_os = "windows")]
mod windows_impl {
    use std::os::raw::{c_ulong, c_ushort, c_void};

    type Word = c_ushort;
    type Dword = c_ulong;
    type Handle = *mut c_void;

    const ALL_PROCESSOR_GROUPS: Word = 0xFFFF;

    #[repr(C)]
    struct GroupAffinity {
        mask: usize,
        group: Word,
        reserved: [Word; 3],
    }

    extern "system" {
        fn GetActiveProcessorGroupCount() -> Word;
        fn GetActiveProcessorCount(group_number: Word) -> Dword;
        fn GetCurrentThread() -> Handle;
        fn SetThreadGroupAffinity(
            thread: Handle,
            group_affinity: *const GroupAffinity,
            previous_group_affinity: *mut GroupAffinity,
        ) -> i32;
    }

    /// Total number of logical processors across *all* processor groups.
    ///
    /// This is the fix for the 64-thread cap: `GetActiveProcessorCount` with
    /// `ALL_PROCESSOR_GROUPS` sums every group instead of only the calling
    /// thread's current group.
    pub fn total_logical_processors() -> usize {
        let count = unsafe { GetActiveProcessorCount(ALL_PROCESSOR_GROUPS) };
        if count == 0 {
            std::thread::available_parallelism()
                .map(|n| n.get())
                .unwrap_or(1)
        } else {
            count as usize
        }
    }

    /// Number of active processor groups on this machine (1 on machines with
    /// 64 or fewer logical processors, i.e. everywhere except large servers
    /// and, apparently, some modern high-core-count desktops).
    pub fn processor_group_count() -> usize {
        let count = unsafe { GetActiveProcessorGroupCount() };
        count.max(1) as usize
    }

    /// Pins the *current* thread to a processor group chosen round-robin
    /// from `worker_index`, so a pool of mining worker threads gets spread
    /// across every available group instead of all piling onto group 0
    /// (which is what silently caps usable threads at 64).
    ///
    /// Must be called from within the worker thread itself, before it starts
    /// mining work.
    pub fn assign_current_thread_to_group(worker_index: usize) {
        let group_count = processor_group_count();
        if group_count <= 1 {
            return;
        }
        let target_group = (worker_index % group_count) as Word;
        let affinity = GroupAffinity {
            mask: usize::MAX,
            group: target_group,
            reserved: [0; 3],
        };
        unsafe {
            SetThreadGroupAffinity(GetCurrentThread(), &affinity, std::ptr::null_mut());
        }
    }
}

#[cfg(target_os = "windows")]
pub use windows_impl::{assign_current_thread_to_group, processor_group_count, total_logical_processors};

#[cfg(not(target_os = "windows"))]
pub fn total_logical_processors() -> usize {
    std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1)
}

#[cfg(not(target_os = "windows"))]
pub fn processor_group_count() -> usize {
    1
}

#[cfg(not(target_os = "windows"))]
pub fn assign_current_thread_to_group(_worker_index: usize) {}
