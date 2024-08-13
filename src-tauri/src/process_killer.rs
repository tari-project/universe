use std::process::Command;

pub fn kill_process(pid: u32) -> Result<(), anyhow::Error> {
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output()?;
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
