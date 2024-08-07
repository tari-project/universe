use std::process::Command;

pub fn kill_process(pid: u32) -> Result<(), anyhow::Error> {
    if cfg!(target_os = "windows") {
        let _ = Command::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output()?;
    } else {
        todo!()
    }
    Ok(())
}
