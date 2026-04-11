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
use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_core::ConfigCore;
use crate::setup::setup_manager::{SetupManager, SetupPhase};
use dunce::canonicalize;
use fs_more::directory::{
    BrokenSymlinkBehaviour, CollidingSubDirectoryBehaviour, DestinationDirectoryRule,
    DirectoryMoveAllowedStrategies, DirectoryMoveByCopyOptions, DirectoryMoveOptions,
    SymlinkBehaviour, move_directory,
};
use fs_more::file::CollidingFileBehaviour;
use log::{error, info, warn};
use std::fs;
use std::path::Path;
use tari_common::configuration::Network;
use tauri::ipc::InvokeError;

/// On macOS, checks whether `path` (or any ancestor) sits on a network-mounted
/// filesystem (SMB, AFP, NFS, WebDAV, …) by parsing the output of `mount(8)`.
///
/// Returns `true` when a network mount is detected so the caller can reject the
/// path with a clear error instead of letting the directory-move attempt fail
/// with a cryptic I/O error deep inside the copy-and-delete path.
///
/// The function finds the *longest* matching mount-point prefix of `path` to
/// handle nested mounts correctly (e.g. a local `/Volumes/USB` mounted inside
/// an SMB `/Volumes` would still be classified as local).
#[cfg(target_os = "macos")]
fn is_network_mount(path: &Path) -> bool {
    use std::process::Command;

    // Filesystem type names that macOS `mount` reports for network volumes.
    const NETWORK_FS_TYPES: &[&str] = &["smbfs", "nfs", "afpfs", "webdav", "nfsv3", "nfsv4"];

    let output = match Command::new("mount").output() {
        Ok(o) => o,
        Err(e) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not run `mount` to check filesystem type: {e}");
            return false;
        }
    };

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Each line from `mount` looks like:
    //   //user@server/share on /Volumes/MyNAS (smbfs, nodev, nosuid, …)
    // We parse (mount-point, fs-type) pairs and select the most specific
    // (longest) mount-point that is a prefix of `path`.
    let mut best: Option<(usize, bool)> = None; // (mount_point_len, is_network)

    for line in stdout.lines() {
        let Some(on_pos) = line.find(" on ") else {
            continue;
        };
        let rest = &line[on_pos + 4..];

        // Mount point ends just before the trailing " (<options>)" block.
        // Use rfind so that paths containing spaces or parentheses (e.g.
        // "/Volumes/My Share (2)") are handled correctly — the options block
        // is always the last parenthesised group on the line.
        let mount_point = if let Some(paren) = rest.rfind(" (") {
            rest[..paren].trim()
        } else {
            rest.trim()
        };

        // Filesystem type is the first comma-separated token inside the trailing
        // options block.  Use rfind so paths with parentheses in their name
        // don't confuse us into reading the wrong group.
        let fs_type = rest
            .rfind('(')
            .and_then(|s| {
                rest[s + 1..]
                    .find(|c| c == ',' || c == ')')
                    .map(|e| rest[s + 1..s + 1 + e].trim().to_lowercase())
            })
            .unwrap_or_default();

        let is_net = NETWORK_FS_TYPES.iter().any(|&t| t == fs_type.as_str());

        let mp_path = Path::new(mount_point);
        if path.starts_with(mp_path) {
            let len = mount_point.len();
            let is_longer = best.map_or(true, |(prev_len, _)| len > prev_len);
            if is_longer {
                best = Some((len, is_net));
            }
        }
    }

    best.map_or(false, |(_, is_net)| is_net)
}

/// On non-macOS platforms this check is a no-op and always returns `false`.
#[cfg(not(target_os = "macos"))]
fn is_network_mount(_path: &Path) -> bool {
    false
}

pub async fn update_data_location(to_path: String) -> Result<(), InvokeError> {
    let move_options = DirectoryMoveOptions {
        destination_directory_rule: DestinationDirectoryRule::AllowNonEmpty {
            colliding_file_behaviour: CollidingFileBehaviour::Abort,
            colliding_subdirectory_behaviour: CollidingSubDirectoryBehaviour::Continue,
        },
        allowed_strategies: DirectoryMoveAllowedStrategies::Either {
            copy_and_delete_options: DirectoryMoveByCopyOptions {
                broken_symlink_behaviour: BrokenSymlinkBehaviour::Abort,
                symlink_behaviour: SymlinkBehaviour::Keep,
            },
        },
    };

    let new_dir = canonicalize(to_path).map_err(|e| {
        error!(target: LOG_TARGET_APP_LOGIC, "New node directory does not exist: {e}");
        InvokeError::from(e.to_string())
    })?;

    // Reject network-mounted paths (SMB/NFS/AFP/WebDAV on macOS) before
    // attempting the directory move.  The copy-and-delete strategy used by
    // `move_directory` fails on remote volumes with confusing errors; it is
    // cleaner to surface a human-readable message at this point instead.
    if is_network_mount(&new_dir) {
        let msg = "The selected directory is on a network-mounted volume \
                   (e.g. SMB/NAS). Network-mounted paths are not supported \
                   as a node data location because the filesystem does not \
                   support the operations required by the Tari node. \
                   Please choose a path on a local drive.";
        error!(target: LOG_TARGET_APP_LOGIC, "{msg}");
        return Err(InvokeError::from(msg));
    }

    let previous = ConfigCore::update_node_data_directory(new_dir.clone())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET_APP_LOGIC, "Could not update node data location: {e}");
            InvokeError::from(e.to_string())
        })?;

    let Some(previous) = previous else {
        return Ok(());
    };

    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
        .await;

    let network = Network::get_current().to_string().to_lowercase();
    let source_dir = previous.join("node").join(&network);
    let destination_dir = new_dir.join("node").join(&network);

    if let Some(parent) = destination_dir.parent() {
        fs::create_dir_all(parent).map_err(|e| InvokeError::from(e.to_string()))?;
    }

    let dest_existed = destination_dir.exists();

    match move_directory(source_dir, destination_dir.clone(), move_options) {
        Ok(res) => {
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Successfully moved items - Total bytes: {}, Directories: {:?}",
                res.total_bytes_moved,
                res.directories_moved
            );
        }
        Err(e) => {
            error!(
                target: LOG_TARGET_APP_LOGIC,
                "Could not move items, reverting config change: {e}"
            );

            if !dest_existed
                && destination_dir.exists()
                && let Err(cleanup_err) = fs::remove_dir_all(&destination_dir)
            {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to clean up destination after failed move: {cleanup_err}"
                );
            }

            ConfigCore::update_node_data_directory(previous)
                .await
                .map_err(|e| InvokeError::from(e.to_string()))?;

            SetupManager::get_instance()
                .resume_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
                .await;

            return Err(InvokeError::from(e.to_string()));
        }
    };

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "[ set_custom_node_directory ] restarting phases"
    );
    SetupManager::get_instance()
        .resume_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
        .await;

    Ok(())
}
