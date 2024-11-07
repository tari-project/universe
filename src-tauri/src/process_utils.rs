use std::path::Path;

pub fn launch_child_process(
    file_path: &Path,
    current_dir: &Path,
    envs: Option<&std::collections::HashMap<String, String>>,
    args: &[String],
) -> Result<tokio::process::Child, anyhow::Error> {
    #[cfg(not(target_os = "windows"))]
    {
        Ok(tokio::process::Command::new(file_path)
            .args(args)
            .current_dir(current_dir)
            .envs(envs.cloned().unwrap_or_default())
            .stdout(std::process::Stdio::null()) // TODO: uncomment, only for testing
            .stderr(std::process::Stdio::null()) // TODO: uncomment, only for testing
            .kill_on_drop(true)
            .spawn()?)
    }
    #[cfg(target_os = "windows")]
    {
        use crate::consts::PROCESS_CREATION_NO_WINDOW;
        Ok(tokio::process::Command::new(file_path)
            .args(args)
            .current_dir(current_dir)
            .envs(envs.cloned().unwrap_or_default())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .spawn()?)
    }
}

// pub async fn launch_and_get_outputs(
//     file_path: &Path,
//     args: Vec<String>,
// ) -> Result<Vec<u8>, anyhow::Error> {
//     #[cfg(not(target_os = "windows"))]
//     {
//         let child = tokio::process::Command::new(file_path)
//             .args(args)
//             .stdout(std::process::Stdio::piped())
//             .kill_on_drop(true)
//             .spawn()?;

//         let output = child.wait_with_output().await?;
//         Ok(output.stdout.as_slice().to_vec())
//     }

//     #[cfg(target_os = "windows")]
//     {
//         use crate::consts::PROCESS_CREATION_NO_WINDOW;
//         let child = tokio::process::Command::new(file_path)
//             .args(args)
//             .stdout(std::process::Stdio::piped())
//             .kill_on_drop(true)
//             .creation_flags(PROCESS_CREATION_NO_WINDOW)
//             .spawn()?;

//         let output = child.wait_with_output().await?;
//         Ok(output.stdout.as_slice().to_vec())
//     }
// }
