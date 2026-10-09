// Copyright 2026. The Tari Project
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

//! Process wrapper sidecar for orphan prevention.
//!
//! Usage: process-wrapper <parent_pid> <binary> [binary_args...]
//!
//! Monitors the parent PID and terminates the child process if the parent dies.
//! Also handles SIGTERM/SIGINT signals by propagating them to the child.
//!
//! On Unix: Creates a new process group and uses it for signal propagation.
//! On Windows: Uses taskkill with /T for tree termination.
//!
//! Signal Safety: Signal handlers only set atomic flags. All termination logic
//! runs in the main thread to avoid async-signal-safety issues.

use std::env;
use std::process::{exit, Child, Command};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

const POLL_INTERVAL_MS: u64 = 200;
const GRACEFUL_SHUTDOWN_SECS: u64 = 10;

static SHOULD_TERMINATE: AtomicBool = AtomicBool::new(false);

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 3 {
        eprintln!("Usage: {} <parent_pid> <binary> [binary_args...]", args[0]);
        exit(1);
    }

    let parent_pid: u32 = match args[1].parse() {
        Ok(pid) => pid,
        Err(_) => {
            eprintln!("Invalid parent PID: {}", args[1]);
            exit(1);
        }
    };

    let binary = &args[2];
    let binary_args = &args[3..];

    let mut child = match spawn_child(binary, binary_args) {
        Ok(child) => child,
        Err(e) => {
            eprintln!("Failed to spawn child process: {}", e);
            exit(1);
        }
    };

    // On Windows machines with >64 logical cores, widen the child's
    // processor-group affinity so its threads can run on every core
    // (no-op on smaller machines / older Windows).
    #[cfg(windows)]
    widen_child_process_affinity(child.id());

    setup_signal_handlers();

    let mut parent_check_counter: u64 = 0;
    const PARENT_CHECK_INTERVAL: u64 = 10;

    loop {
        if SHOULD_TERMINATE.load(Ordering::SeqCst) {
            terminate_child(&mut child);
            exit(0);
        }

        parent_check_counter += 1;
        if parent_check_counter >= PARENT_CHECK_INTERVAL {
            parent_check_counter = 0;
            if !is_parent_alive(parent_pid) {
                terminate_child(&mut child);
                exit(0);
            }
        }

        match child.try_wait() {
            Ok(Some(status)) => {
                exit(status.code().unwrap_or(0));
            }
            Ok(None) => {
                thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
            }
            Err(e) => {
                eprintln!("Error waiting for child: {}", e);
                terminate_child(&mut child);
                exit(1);
            }
        }
    }
}

#[cfg(unix)]
fn spawn_child(binary: &str, args: &[String]) -> Result<Child, std::io::Error> {
    use std::os::unix::process::CommandExt;

    unsafe {
        Command::new(binary)
            .args(args)
            .pre_exec(|| {
                libc::setpgid(0, 0);
                Ok(())
            })
            .spawn()
    }
}

#[cfg(windows)]
fn spawn_child(binary: &str, args: &[String]) -> Result<Child, std::io::Error> {
    Command::new(binary).args(args).spawn()
}

/// Widens the processor-group affinity of an already-running process (given
/// by PID) to every active processor group, so the OS may schedule its
/// threads on all logical cores of machines with >64 cores.
///
/// Windows confines a new process to a single processor group unless it opts
/// in to more. Uses `SetProcessGroupAffinity` (Windows 11 / Server 2022+),
/// resolved dynamically so this binary keeps working on older Windows, where
/// it logs and does nothing. No-op on single-group machines. Failures are
/// logged to stderr and never fatal.
#[cfg(windows)]
fn widen_child_process_affinity(pid: u32) {
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress};
    use windows_sys::Win32::System::SystemInformation::GROUP_AFFINITY;
    use windows_sys::Win32::System::Threading::{
        GetActiveProcessorGroupCount, OpenProcess, PROCESS_SET_INFORMATION,
    };

    type SetProcessGroupAffinityFn =
        unsafe extern "system" fn(HANDLE, *const GROUP_AFFINITY, *mut u16) -> i32;

    // SAFETY: all Win32 calls follow their documented contracts; see inline
    // notes. No Rust references cross the FFI boundary.
    unsafe {
        let group_count = GetActiveProcessorGroupCount().min(16);
        if group_count <= 1 {
            return; // single group: nothing to widen
        }

        // Resolve SetProcessGroupAffinity dynamically: it does not exist
        // before Windows 11 / Server 2022.
        let module_name: Vec<u16> = "kernel32.dll\0".encode_utf16().collect();
        let kernel32 = GetModuleHandleW(module_name.as_ptr());
        let set_affinity: SetProcessGroupAffinityFn = if kernel32.is_null() {
            eprintln!("process-wrapper: SetProcessGroupAffinity unavailable (pre-Windows 11)");
            return;
        } else {
            match GetProcAddress(kernel32, b"SetProcessGroupAffinity\0".as_ptr()) {
                Some(f) => std::mem::transmute::<
                    unsafe extern "system" fn() -> isize,
                    SetProcessGroupAffinityFn,
                >(f),
                None => {
                    eprintln!("process-wrapper: SetProcessGroupAffinity unavailable (pre-Windows 11)");
                    return;
                }
            }
        };

        // One GROUP_AFFINITY per group, each covering the whole group. Mask
        // bits beyond a group's actual processors are inert: Windows
        // intersects the mask with the group's active processors.
        let affinities: Vec<GROUP_AFFINITY> = (0..group_count)
            .map(|group| GROUP_AFFINITY {
                Mask: usize::MAX,
                Group: group,
                Reserved: [0; 3],
            })
            .collect();

        let process: HANDLE = OpenProcess(PROCESS_SET_INFORMATION, 0, pid);
        if process.is_null() {
            eprintln!("process-wrapper: could not open child process (pid {pid}) to widen affinity");
            return;
        }

        let mut groups_used = group_count;
        let ok = set_affinity(process, affinities.as_ptr(), &mut groups_used);
        CloseHandle(process);

        if ok == 0 {
            eprintln!("process-wrapper: SetProcessGroupAffinity failed for pid {pid}");
        }
    }
}

#[cfg(unix)]
fn setup_signal_handlers() {
    unsafe {
        libc::signal(
            libc::SIGTERM,
            handle_signal as *const () as libc::sighandler_t,
        );
        libc::signal(
            libc::SIGINT,
            handle_signal as *const () as libc::sighandler_t,
        );
        libc::signal(
            libc::SIGHUP,
            handle_signal as *const () as libc::sighandler_t,
        );
    }
}

#[cfg(unix)]
extern "C" fn handle_signal(_sig: libc::c_int) {
    SHOULD_TERMINATE.store(true, Ordering::SeqCst);
}

#[cfg(unix)]
fn is_parent_alive(pid: u32) -> bool {
    unsafe { libc::kill(pid.cast_signed(), 0) == 0 }
}

#[cfg(unix)]
fn terminate_child(child: &mut Child) {
    let child_pid = child.id().cast_signed();

    unsafe {
        libc::kill(-child_pid, libc::SIGTERM);
    }

    let deadline = std::time::Instant::now() + Duration::from_secs(GRACEFUL_SHUTDOWN_SECS);
    while std::time::Instant::now() < deadline {
        match child.try_wait() {
            Ok(Some(_)) => return,
            _ => thread::sleep(Duration::from_millis(100)),
        }
    }

    unsafe {
        libc::kill(-child_pid, libc::SIGKILL);
    }

    drop(child.wait());
}

#[cfg(windows)]
fn setup_signal_handlers() {
    use windows_sys::Win32::System::Console::{SetConsoleCtrlHandler, CTRL_C_EVENT};

    unsafe extern "system" fn console_handler(_ctrl_type: u32) -> i32 {
        SHOULD_TERMINATE.store(true, Ordering::SeqCst);
        1
    }

    unsafe {
        SetConsoleCtrlHandler(Some(console_handler), 1);
    }
}

#[cfg(windows)]
fn is_parent_alive(pid: u32) -> bool {
    use windows_sys::Win32::Foundation::{CloseHandle, STILL_ACTIVE};
    use windows_sys::Win32::System::Threading::{
        GetExitCodeProcess, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
    };

    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return false;
        }

        let mut exit_code: u32 = 0;
        let result = GetExitCodeProcess(handle, &mut exit_code);
        CloseHandle(handle);

        result != 0 && exit_code == STILL_ACTIVE as u32
    }
}

#[cfg(windows)]
fn terminate_child(child: &mut Child) {
    let child_pid = child.id();

    let _ = Command::new("taskkill")
        .args(["/F", "/T", "/PID", &child_pid.to_string()])
        .output();

    drop(child.wait());
}
