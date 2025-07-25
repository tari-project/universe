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

use std::path::{Component, Path, PathBuf};

use anyhow::anyhow;

const LOG_TARGET: &str = "tari::universe::file_utils";

/// Returns a relative path from one path to another.
pub fn make_relative_path(root: &Path, current: &Path) -> PathBuf {
    let mut result = PathBuf::new();
    let root_components = root.components().collect::<Vec<Component>>();
    let current_components = current.components().collect::<Vec<_>>();
    for i in 0..current_components.len() {
        let current_path_component: Component = current_components[i];
        if i < root_components.len() {
            let other: Component = root_components[i];
            if other != current_path_component {
                break;
            }
        } else {
            result.push(current_path_component)
        }
    }
    result
}

// Returns a String representing the given Path.
pub fn path_as_string(path: &Path) -> String {
    let mut path_str = String::new();
    for component in path.components() {
        if let Component::Normal(os_str) = component {
            if !path_str.is_empty() {
                path_str.push('/');
            }
            path_str.push_str(&os_str.to_string_lossy());
        }
    }
    path_str
}

pub fn convert_to_string(path: PathBuf) -> Result<String, anyhow::Error> {
    path.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| anyhow!("Could not convert path to string"))
}

/// Copies an entire directory with all its nested content recursively
///
/// # Arguments
/// * `source_dir` - Source directory path to copy from
/// * `target_dir` - Target directory path to copy to
///
/// # Returns
/// * `Result<(), anyhow::Error>` - Success or failure
pub fn copy_directory_recursively(
    source_dir: &PathBuf,
    target_dir: &PathBuf,
) -> Result<(), anyhow::Error> {
    // Create the target directory if it doesn't exist
    if !target_dir.exists() {
        std::fs::create_dir_all(target_dir)?;
    }

    // Ensure source directory exists
    if !source_dir.exists() {
        return Err(anyhow::anyhow!(
            "Source directory '{}' does not exist",
            source_dir.display()
        ));
    }

    log::debug!(
        target: LOG_TARGET,
        "Copying directory from '{}' to '{}'",
        source_dir.display(),
        target_dir.display()
    );

    // Iterate through all entries in the source directory
    for entry in std::fs::read_dir(source_dir)? {
        let entry = entry?;
        let path = entry.path();
        let file_name = path.file_name().ok_or_else(|| {
            anyhow::anyhow!("Failed to get file name from path: {}", path.display())
        })?;

        let target_path = target_dir.join(file_name);

        if path.is_dir() {
            // Recursively copy subdirectories
            copy_directory_recursively(&path, &target_path)?;
        } else {
            // Copy files, but don't overwrite existing ones
            if !target_path.exists() {
                log::debug!(
                    target: LOG_TARGET,
                    "Copying file from '{}' to '{}'",
                    path.display(),
                    target_path.display()
                );
                std::fs::copy(&path, &target_path)?;
            }
        }
    }

    Ok(())
}
