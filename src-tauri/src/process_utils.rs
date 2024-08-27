use std::path::Path;

use crate::consts::PROCESS_CREATION_NO_WINDOW;

pub fn launch_child_process(
    file_path: &Path,
    args: &[String],
) -> Result<tokio::process::Child, anyhow::Error> {
    #[cfg(not(target_os = "windows"))]
    {
        Ok(tokio::process::Command::new(file_path)
            .args(args)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .spawn()?)
    }
    #[cfg(target_os = "windows")]
    {
        Ok(tokio::process::Command::new(file_path)
            .args(args)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .spawn()?)
    }
}
