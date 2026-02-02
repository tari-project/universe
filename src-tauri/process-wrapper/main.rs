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

//! Process wrapper sidecar for orphan prevention.
//!
//! Usage: process-wrapper <parent_pid> <binary> [binary_args...]
//!
//! Monitors the parent PID and terminates the child process if the parent dies.
//! Also handles SIGTERM/SIGINT signals by propagating them to the child.
//!
//! On Unix: Creates a new process group and uses it for signal propagation.
//! On Windows: Uses taskkill with /T for tree termination.

use std::env;
use std::process::{exit, Child, Command};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

const POLL_INTERVAL_SECS: u64 = 2;
const GRACEFUL_SHUTDOWN_SECS: u64 = 2;

static CHILD_PID: AtomicU32 = AtomicU32::new(0);
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

    CHILD_PID.store(child.id(), Ordering::SeqCst);

    setup_signal_handlers();

    let should_terminate = Arc::new(AtomicBool::new(false));
    let should_terminate_clone = Arc::clone(&should_terminate);

    thread::spawn(move || loop {
        thread::sleep(Duration::from_secs(POLL_INTERVAL_SECS));

        if SHOULD_TERMINATE.load(Ordering::SeqCst) {
            should_terminate_clone.store(true, Ordering::SeqCst);
            break;
        }

        if !is_parent_alive(parent_pid) {
            should_terminate_clone.store(true, Ordering::SeqCst);
            break;
        }
    });

    loop {
        if should_terminate.load(Ordering::SeqCst) || SHOULD_TERMINATE.load(Ordering::SeqCst) {
            terminate_child(&mut child);
            exit(0);
        }

        match child.try_wait() {
            Ok(Some(status)) => {
                exit(status.code().unwrap_or(0));
            }
            Ok(None) => {
                thread::sleep(Duration::from_millis(100));
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

#[cfg(unix)]
fn setup_signal_handlers() {
    unsafe {
        libc::signal(libc::SIGTERM, handle_signal as usize);
        libc::signal(libc::SIGINT, handle_signal as usize);
        libc::signal(libc::SIGHUP, handle_signal as usize);
    }
}

#[cfg(unix)]
extern "C" fn handle_signal(_sig: i32) {
    SHOULD_TERMINATE.store(true, Ordering::SeqCst);

    let child_pid = CHILD_PID.load(Ordering::SeqCst);
    if child_pid != 0 {
        unsafe {
            libc::kill(-(child_pid as i32), libc::SIGTERM);
        }

        thread::sleep(Duration::from_secs(GRACEFUL_SHUTDOWN_SECS));

        unsafe {
            libc::kill(-(child_pid as i32), libc::SIGKILL);
        }
    }

    exit(0);
}

#[cfg(unix)]
fn is_parent_alive(pid: u32) -> bool {
    unsafe { libc::kill(pid as i32, 0) == 0 }
}

#[cfg(unix)]
fn terminate_child(child: &mut Child) {
    let child_pid = child.id() as i32;

    unsafe {
        libc::kill(-child_pid, libc::SIGTERM);
    }

    thread::sleep(Duration::from_secs(GRACEFUL_SHUTDOWN_SECS));

    match child.try_wait() {
        Ok(Some(_)) => return,
        _ => {}
    }

    unsafe {
        libc::kill(-child_pid, libc::SIGKILL);
    }

    let _ = child.wait();
}

#[cfg(windows)]
fn setup_signal_handlers() {
    #[link(name = "kernel32")]
    extern "system" {
        fn SetConsoleCtrlHandler(
            HandlerRoutine: Option<extern "system" fn(u32) -> i32>,
            Add: i32,
        ) -> i32;
    }

    extern "system" fn console_handler(_ctrl_type: u32) -> i32 {
        SHOULD_TERMINATE.store(true, Ordering::SeqCst);

        let child_pid = CHILD_PID.load(Ordering::SeqCst);
        if child_pid != 0 {
            let _ = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &child_pid.to_string()])
                .output();
        }

        exit(0);
    }

    unsafe {
        SetConsoleCtrlHandler(Some(console_handler), 1);
    }
}

#[cfg(windows)]
fn is_parent_alive(pid: u32) -> bool {
    #[link(name = "kernel32")]
    extern "system" {
        fn OpenProcess(
            dwDesiredAccess: u32,
            bInheritHandle: i32,
            dwProcessId: u32,
        ) -> *mut std::ffi::c_void;
        fn CloseHandle(hObject: *mut std::ffi::c_void) -> i32;
        fn GetExitCodeProcess(hProcess: *mut std::ffi::c_void, lpExitCode: *mut u32) -> i32;
    }

    const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;
    const STILL_ACTIVE: u32 = 259;

    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return false;
        }

        let mut exit_code: u32 = 0;
        let result = GetExitCodeProcess(handle, &mut exit_code);
        CloseHandle(handle);

        result != 0 && exit_code == STILL_ACTIVE
    }
}

#[cfg(windows)]
fn terminate_child(child: &mut Child) {
    let child_pid = child.id();

    let _ = Command::new("taskkill")
        .args(["/F", "/T", "/PID", &child_pid.to_string()])
        .output();

    let _ = child.wait();
}

#[cfg(unix)]
mod libc {
    pub type SignalHandler = usize;

    #[link(name = "c")]
    extern "C" {
        pub fn kill(pid: i32, sig: i32) -> i32;
        pub fn signal(sig: i32, handler: SignalHandler) -> SignalHandler;
        pub fn setpgid(pid: i32, pgid: i32) -> i32;
    }

    pub const SIGTERM: i32 = 15;
    pub const SIGKILL: i32 = 9;
    pub const SIGINT: i32 = 2;
    pub const SIGHUP: i32 = 1;
}
