#[cfg(target_os = "windows")]
const LOG_TARGET: &str = "tari::universe::process_killer";

pub fn kill_process(pid: i32) -> Result<(), anyhow::Error> {
    #[cfg(target_os = "windows")]
    {
        use log::warn;
        use std::process::Command;
        let output = Command::new("taskkill")
            .args(["/F", "/PID", &pid.to_string()])
            .output()?;
        if !output.status.success() {
            warn!(target: LOG_TARGET, "Failed to kill process: {:?}", output);
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use nix::sys::signal::{self, Signal};
        use nix::unistd::Pid;

        let pid = Pid::from_raw(pid);

        let _ = signal::kill(pid, Signal::SIGTERM);
    }
    Ok(())
}
