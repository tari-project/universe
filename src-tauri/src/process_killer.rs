use log::warn;
use std::process::Command;

const LOG_TARGET: &str = "tari::universe::process_killer";

pub fn kill_process(pid: u32) -> Result<(), anyhow::Error> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output()?;
        if !output.status.success() {
            warn!(target: LOG_TARGET, "Failed to kill process: {:?}", output);
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use nix::sys::signal::{self, Signal};
        use nix::unistd::Pid;

        let pid = Pid::from_raw(pid as i32);
        signal::kill(pid, Signal::SIGTERM);
    }
    Ok(())
}
