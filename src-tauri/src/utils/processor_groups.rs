// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

//! Windows processor-group helpers for machines with more than 64 logical cores.
//!
//! Windows splits such machines into "processor groups" of at most 64 logical
//! processors each, and a process that is not group-aware is confined to a
//! single group. Two consequences matter for CPU mining:
//!
//! 1. `std::thread::available_parallelism()` only observes the calling
//!    process's own group, so it undercounts the machine (e.g. reports 64 on
//!    a 128-thread box). [`logical_processor_count`] enumerates every group
//!    instead.
//! 2. A freshly spawned child process (e.g. xmrig) is likewise confined to
//!    one group, so even launching it with `--threads=128` would leave half
//!    the machine idle. [`widen_child_process_affinity`] opts the child into
//!    every active group right after it is spawned, letting the OS schedule
//!    its threads across all of them.
//!
//! Both functions are no-ops (or fall back to previous behavior) on machines
//! with a single processor group, so there is no behavior change on <=64-core
//! machines, and nothing here affects other platforms.

use log::{info, warn};
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress};
use windows_sys::Win32::System::SystemInformation::GROUP_AFFINITY;
use windows_sys::Win32::System::Threading::{
    GetActiveProcessorCount, GetActiveProcessorGroupCount, OpenProcess, PROCESS_SET_INFORMATION,
};

use crate::LOG_TARGET_APP_LOGIC;

/// Maximum number of processor groups a single process affinity can cover.
const MAXIMUM_PROC_GROUPS: u16 = 16;

/// Total number of active logical processors across **all** Windows processor
/// groups.
///
/// Falls back to `std::thread::available_parallelism()` if the topology
/// cannot be enumerated, preserving the previous behavior.
pub fn logical_processor_count() -> u32 {
    // SAFETY: GetActiveProcessorGroupCount takes no arguments and has no
    // failure mode beyond returning 0.
    let group_count = unsafe { GetActiveProcessorGroupCount() };
    if group_count == 0 {
        warn!(target: LOG_TARGET_APP_LOGIC, "Could not determine Windows processor group count; falling back to available_parallelism()");
        return fallback_parallelism();
    }

    let mut total: u32 = 0;
    for group in 0..group_count {
        // SAFETY: group is always < group_count as just queried.
        let count = unsafe { GetActiveProcessorCount(group) };
        total = total.saturating_add(count);
    }

    if total == 0 {
        warn!(target: LOG_TARGET_APP_LOGIC, "Windows processor group enumeration yielded 0 logical processors; falling back to available_parallelism()");
        return fallback_parallelism();
    }

    info!(target: LOG_TARGET_APP_LOGIC, "Detected {total} logical processors across {group_count} processor group(s)");
    total
}

fn fallback_parallelism() -> u32 {
    match std::thread::available_parallelism() {
        Ok(n) => u32::try_from(n.get()).unwrap_or(1),
        Err(_) => 1,
    }
}

/// Widens the processor-group affinity of an already-running process (given
/// by PID) to every active processor group, so the OS may schedule its
/// threads on all logical cores of the machine.
///
/// This must be called as soon as possible after the child is spawned: the
/// child's worker threads are assigned to groups round-robin as they are
/// created, so widening before the miner initializes its backend lets them
/// spread across every group.
///
/// Uses `SetProcessGroupAffinity`, which only exists on Windows 11 / Server
/// 2022+. It is resolved dynamically with `GetProcAddress` so the binary
/// keeps running on older Windows, where this function logs and does nothing
/// (previous behavior preserved). It is also a no-op on single-group
/// machines.
///
/// Failures are logged as warnings and never propagated: mining must not
/// break just because affinity widening failed.
pub fn widen_child_process_affinity(pid: u32) {
    // SAFETY: all Win32 calls below follow their documented contracts; see
    // inline notes. No Rust references cross the FFI boundary.
    unsafe {
        let group_count = GetActiveProcessorGroupCount().min(MAXIMUM_PROC_GROUPS);
        if group_count <= 1 {
            return; // single group: nothing to widen
        }

        let set_process_group_affinity = match load_set_process_group_affinity() {
            Some(f) => f,
            None => {
                info!(target: LOG_TARGET_APP_LOGIC, "SetProcessGroupAffinity is unavailable (requires Windows 11 / Server 2022+); child process keeps its default single-group affinity");
                return;
            }
        };

        // One GROUP_AFFINITY per group, each covering the whole group.
        // Mask bits beyond a group's actual processors are inert: Windows
        // intersects the requested mask with the group's active processors.
        let affinities: Vec<GROUP_AFFINITY> = (0..group_count)
            .map(|group| GROUP_AFFINITY {
                Mask: usize::MAX,
                Group: group,
                Reserved: [0; 3],
            })
            .collect();

        let process: HANDLE = OpenProcess(PROCESS_SET_INFORMATION, 0, pid);
        if process == 0 {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not open child process (pid {pid}) to widen processor-group affinity");
            return;
        }

        let mut groups_used = group_count;
        let ok = set_process_group_affinity(process, affinities.as_ptr(), &mut groups_used);
        CloseHandle(process);

        if ok == 0 {
            warn!(target: LOG_TARGET_APP_LOGIC, "SetProcessGroupAffinity failed for pid {pid}; child process remains on its default processor group");
        } else {
            info!(target: LOG_TARGET_APP_LOGIC, "Widened processor-group affinity of pid {pid} to {groups_used} group(s)");
        }
    }
}

/// `SetProcessGroupAffinity` as declared by the OS:
/// `BOOL SetProcessGroupAffinity(HANDLE hProcess, const GROUP_AFFINITY *GroupAffinity, PUSHORT GroupCount)`
type SetProcessGroupAffinityFn =
    unsafe extern "system" fn(HANDLE, *const GROUP_AFFINITY, *mut u16) -> i32;

/// Dynamically resolves `SetProcessGroupAffinity` from kernel32. Returns
/// `None` on Windows versions that predate the API (Windows 11 / Server
/// 2022+), keeping the binary loadable and runnable there.
fn load_set_process_group_affinity() -> Option<SetProcessGroupAffinityFn> {
    // SAFETY: GetModuleHandleW/GetProcAddress with valid NUL-terminated
    // strings; the module is never unloaded while we hold the pointer.
    unsafe {
        let module_name: Vec<u16> = "kernel32.dll\0".encode_utf16().collect();
        let kernel32 = GetModuleHandleW(module_name.as_ptr());
        if kernel32 == 0 {
            return None;
        }
        let address = GetProcAddress(kernel32, b"SetProcessGroupAffinity\0".as_ptr());
        match address {
            // FARPROC is Option<extern "system" fn() -> isize>; a non-null
            // function pointer transmuted to the real signature.
            Some(f) => Some(std::mem::transmute::<
                unsafe extern "system" fn() -> isize,
                SetProcessGroupAffinityFn,
            >(f)),
            None => None,
        }
    }
}
