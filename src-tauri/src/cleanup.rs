use std::{
    fs,
    path::{Path, PathBuf},
    env,
};
use tauri::api::path::app_data_dir;

/// Cleans up old binary directories, retaining only the directory corresponding
/// to the current application version.
///
/// Binaries are expected to be stored in version-named subdirectories within
/// the application's data directory (e.g., `app_data_dir/binaries/1.0.0/`).
///
/// This function should be called on application startup or after a successful
/// update to free up disk space.
pub fn cleanup_old_binaries() -> Result<(), String> {
    println!("Starting cleanup of old binary files...");

    let app_data_dir = match app_data_dir() {
        Some(path) => path,
        None => return Err("Failed to get application data directory".into()),
    };

    // Construct the base directory where all versioned binaries are stored.
    // Assuming a structure like: app_data_dir/binaries/
    let binaries_base_dir = app_data_dir.join("binaries");

    if !binaries_base_dir.exists() || !binaries_base_dir.is_dir() {
        println!("Binary base directory does not exist or is not a directory: {:?}", binaries_base_dir);
        return Ok(()); // Nothing to clean up
    }

    // Get the current application version from Cargo.toml at compile time.
    let current_version = env!("CARGO_PKG_VERSION");
    let current_binary_dir_name = current_version; // The folder name is expected to be the version string

    let mut cleaned_up_count = 0;

    for entry in fs::read_dir(&binaries_base_dir)
        .map_err(|e| format!("Failed to read binary base directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            if let Some(dir_name) = path.file_name().and_then(|name| name.to_str()) {
                if dir_name != current_binary_dir_name {
                    println!("Deleting old binary directory: {:?}", path);
                    if let Err(e) = fs::remove_dir_all(&path) {
                        eprintln!("Error deleting directory {:?}: {}", path, e);
                        // Continue cleanup for other directories even if one fails
                    } else {
                        cleaned_up_count += 1;
                    }
                } else {
                    println!("Retaining current binary directory: {:?}", path);
                }
            } else {
                eprintln!("Warning: Could not get directory name for {:?}", path);
            }
        }
    }

    println!("Cleanup completed. Deleted {} old binary directories.", cleaned_up_count);
    Ok(())
}
