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
//! Usage: process-wrapper <parent_pid> <network> <binary> [binary_args...]
//!
//! Monitors the parent PID and terminates the child process if the parent dies.
//! Also handles SIGTERM/SIGINT signals by propagating them to the child.
//!
//! On Unix: Creates a new process group and uses it for signal propagation.
//! On Windows: Uses taskkill with /T for tree termination.
//!
//! Signal Safety: Signal handlers only set atomic flags. All termination logic
//! runs in the main thread to avoid async-signal-safety issues.

#[path = "../../src-tauri/src/executable_integrity.rs"]
mod executable_integrity;
#[cfg(test)]
#[path = "../../src-tauri/src/private_directory.rs"]
mod private_directory;

use std::env;
use std::process::{Child, Command, exit};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

const POLL_INTERVAL_MS: u64 = 200;
const GRACEFUL_SHUTDOWN_SECS: u64 = 10;

static SHOULD_TERMINATE: AtomicBool = AtomicBool::new(false);

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 4 {
        eprintln!(
            "Usage: {} <parent_pid> <network> <binary> [binary_args...]",
            args[0]
        );
        exit(1);
    }

    let parent_pid: u32 = match args[1].parse() {
        Ok(pid) => pid,
        Err(_) => {
            eprintln!("Invalid parent PID: {}", args[1]);
            exit(1);
        }
    };

    let network = &args[2];
    let binary = &args[3];
    let binary_args = &args[4..];

    let mut child = match spawn_child(binary, binary_args, network) {
        Ok(child) => child,
        Err(e) => {
            eprintln!("Failed to spawn child process: {}", e);
            exit(1);
        }
    };

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
fn spawn_child(binary: &str, args: &[String], network: &str) -> Result<Child, std::io::Error> {
    use std::os::unix::process::CommandExt;

    executable_integrity::verify_launch_path(std::path::Path::new(binary), network)?;

    #[cfg(target_os = "linux")]
    let wrapper_pid = std::process::id() as libc::pid_t;
    unsafe {
        Command::new(binary)
            .args(args)
            .pre_exec(move || {
                libc::setpgid(0, 0);
                #[cfg(target_os = "linux")]
                die_with_wrapper(wrapper_pid)?;
                Ok(())
            })
            .spawn()
    }
}

/// Have the kernel SIGKILL the child when the wrapper dies, even by SIGKILL,
/// which the wrapper cannot handle. Without it a killed wrapper leaves its
/// child running where the app can no longer find or stop it: the PID file
/// names the wrapper. SIGKILL, not SIGTERM: the graceful path is the wrapper's
/// own SIGTERM-then-SIGKILL, and if the wrapper is gone (e.g. the app killed it
/// mid-shutdown) a child stuck on SIGTERM would survive a second one.
/// Runs in the forked child before exec.
#[cfg(target_os = "linux")]
fn die_with_wrapper(wrapper_pid: libc::pid_t) -> std::io::Result<()> {
    if unsafe { libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGKILL) } == -1 {
        return Err(std::io::Error::last_os_error());
    }
    // The wrapper may have died before the signal was armed.
    if unsafe { libc::getppid() } != wrapper_pid {
        return Err(std::io::Error::from_raw_os_error(libc::ESRCH));
    }
    Ok(())
}

#[cfg(windows)]
fn spawn_child(binary: &str, args: &[String], network: &str) -> Result<Child, std::io::Error> {
    executable_integrity::verify_launch_path(std::path::Path::new(binary), network)?;
    Command::new(binary).args(args).spawn()
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
    use windows_sys::Win32::System::Console::{CTRL_C_EVENT, SetConsoleCtrlHandler};

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

#[cfg(all(test, unix))]
mod tests {
    #[test]
    fn test_spawn_child_unpinned_executable_blocks_before_execution() {
        let result = super::spawn_child("/bin/true", &[], "mainnet");
        assert!(
            result.is_err(),
            "wrapper must fail closed for an unpinned child"
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn child_is_terminated_when_its_spawner_dies() {
        use std::os::unix::process::{CommandExt, ExitStatusExt};
        use std::time::{Duration, Instant};

        let pid = std::process::id() as libc::pid_t;
        // The death signal follows the spawning thread, so a thread that
        // exits stands in for a killed wrapper.
        let mut child = std::thread::spawn(move || unsafe {
            std::process::Command::new("sleep")
                .arg("30")
                .pre_exec(move || super::die_with_wrapper(pid))
                .spawn()
                .unwrap()
        })
        .join()
        .unwrap();

        let deadline = Instant::now() + Duration::from_secs(5);
        let status = loop {
            if let Some(status) = child.try_wait().unwrap() {
                break status;
            }
            if Instant::now() > deadline {
                let _ = child.kill();
                panic!("child outlived its spawner");
            }
            std::thread::sleep(Duration::from_millis(50));
        };
        assert_eq!(status.signal(), Some(libc::SIGKILL));
    }
}
