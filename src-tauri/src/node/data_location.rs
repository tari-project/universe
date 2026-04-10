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
use std::path::{Path, PathBuf};
use sysinfo::Disks;
use tari_common::configuration::Network;
use tauri::ipc::InvokeError;

/// Filesystem type names that indicate a network / remote volume.
///
/// These values are normalised to lowercase and covers the common remote
/// filesystem names reported by sysinfo across platforms:
/// - macOS:   `smbfs`, `nfs`, `afpfs`, `webdav`, `ftp`
/// - Linux:   `cifs`, `smb3`, `nfs`, `nfs4`, `fuse.sshfs`, `sshfs`, `9p`,
///            `ceph`, `glusterfs`, `beegfs`, `lustre`
/// - Windows: sysinfo reports remote drives with a filesystem string that
///            frequently contains `remote` or the underlying SMB/NFS name.
const NETWORK_FILESYSTEMS: &[&str] = &[
    "smbfs", "cifs", "smb", "smb2", "smb3", "nfs", "nfs3", "nfs4", "afpfs", "webdav", "davfs",
    "ftp", "sshfs", "fuse.sshfs", "9p", "ceph", "glusterfs", "beegfs", "lustre", "remote",
];

/// Returns `Some(fs_name)` if `path` resolves to a location on a network /
/// remote filesystem, or `None` if it's on a local volume (or we can't tell).
///
/// We pick the mount point whose path is the longest prefix of `path`, then
/// check whether its filesystem type is one of the known remote types. This
/// is how GNU `df`, `findmnt`, and similar tools resolve a path to its mount.
pub fn detect_network_filesystem(path: &Path) -> Option<String> {
    // Canonicalise so symlinks and `..` components don't confuse the prefix
    // match. Fall back to the original path if canonicalisation fails — the
    // user-facing caller has already validated existence.
    let canonical: PathBuf = canonicalize(path).unwrap_or_else(|_| path.to_path_buf());

    // On Windows, a UNC path such as `\\server\share\folder` is a network
    // location that is NOT mapped to a drive letter, so `sysinfo::Disks`
    // (which iterates drive-letter mounts) will not report it. Detect the
    // `\\?\UNC\...` (verbatim) and `\\server\share` prefixes directly from
    // the canonical path before falling through to the disk enumeration.
    #[cfg(windows)]
    {
        use std::path::{Component, Prefix};
        if let Some(Component::Prefix(prefix_component)) = canonical.components().next() {
            match prefix_component.kind() {
                Prefix::UNC(_, _) | Prefix::VerbatimUNC(_, _) => {
                    return Some("unc".to_string());
                }
                _ => {}
            }
        }
    }

    let disks = Disks::new_with_refreshed_list();
    let mut best: Option<(usize, String)> = None;

    for disk in disks.list() {
        let mount = disk.mount_point();
        if !canonical.starts_with(mount) {
            continue;
        }
        let mount_len = mount.as_os_str().len();
        let fs_name = disk.file_system().to_string_lossy().to_ascii_lowercase();

        match &best {
            Some((len, _)) if *len >= mount_len => {}
            _ => best = Some((mount_len, fs_name)),
        }
    }

    let (_, fs_name) = best?;
    if NETWORK_FILESYSTEMS
        .iter()
        .any(|known| fs_name == *known || fs_name.contains(known))
    {
        Some(fs_name)
    } else {
        None
    }
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
    match canonicalize(to_path) {
        Ok(new_dir) => {
            // Refuse network-mounted destinations up front. fs_more's
            // move_directory has historically failed with confusing errors
            // on SMB / NFS / AFP mounts (see issue #3178 — macOS with a NAS
            // SMB mount) because those filesystems don't support all the
            // metadata operations (rename-across-volume, fsync on
            // directories, extended attributes) the node LMDB database
            // relies on. Detect this before we shut down the node phase and
            // return a clear, actionable error instead of a cryptic fs_more
            // failure.
            if let Some(fs_name) = detect_network_filesystem(&new_dir) {
                let message = format!(
                    "Selected directory is on a network filesystem ({fs_name}), which is not \
                     supported for the node data location. The node database requires a local \
                     disk (HDD/SSD) because network filesystems such as SMB, NFS, AFP and WebDAV \
                     do not reliably support the operations LMDB needs. Please choose a local \
                     directory instead."
                );
                error!(target: LOG_TARGET_APP_LOGIC, "{message}");
                return Err(InvokeError::from(message));
            }

            match ConfigCore::update_node_data_directory(new_dir.clone()).await {
            Ok(previous) => {
                if let Some(previous) = previous {
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
                            info!(target: LOG_TARGET_APP_LOGIC, "Successfully moved items - Total bytes: {}, Directories: {:?}", res.total_bytes_moved, res.directories_moved);
                        }
                        Err(e) => {
                            error!(target: LOG_TARGET_APP_LOGIC, "Could not move items, reverting config change: {e}");

                            if !dest_existed
                                && destination_dir.exists()
                                && let Err(cleanup_err) = fs::remove_dir_all(&destination_dir)
                            {
                                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to clean up destination after failed move: {cleanup_err}");
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

                    info!(target: LOG_TARGET_APP_LOGIC, "[ set_custom_node_directory ] restarting phases");
                    SetupManager::get_instance()
                        .resume_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
                        .await;
                }
            }
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "Could not update node data location: {e}");
                return Err(InvokeError::from(e.to_string()));
            }
            }
        }
        Err(e) => {
            error!(target: LOG_TARGET_APP_LOGIC, "New node directory does not exist: {e}");
            return Err(InvokeError::from(e.to_string()));
        }
    }
    Ok(())
}
