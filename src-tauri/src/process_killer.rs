use anyhow::Result;

pub async fn kill_process(pid: i32) -> Result<(), anyhow::Error> {
    #[cfg(target_os = "windows")]
    {
        use crate::consts::PROCESS_CREATION_NO_WINDOW;
        use anyhow::Context;
        let command = format!("taskkill /F /PID {}", pid);

        let mut child = tokio::process::Command::new("cmd")
            .arg("/C")
            .arg(command)
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .spawn()
            .context(format!("Failed to start taskkill for PID {}: {}", pid, pid))?;

        child.wait().await?;
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
