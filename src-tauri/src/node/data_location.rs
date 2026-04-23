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
/// Values are matched case-insensitively against the filesystem string
/// reported by sysinfo (see `is_network_fs`). Covers the common remote
/// filesystem names across platforms:
/// - macOS: `smbfs`, `nfs`, `afpfs`, `webdav`
/// - Linux: `cifs`, `smb3`, `nfs`, `nfs4`, `fuse.sshfs`, `sshfs`, `9p`, `ceph`,
///   `glusterfs`, `beegfs`, `lustre`
/// - Windows: sysinfo reports remote drives with a filesystem string that
///   frequently contains `remote` or the underlying SMB/NFS name, but for SMB
///   drive-letter mappings `GetVolumeInformationW` typically returns `NTFS` —
///   so the `cfg(windows)` branch in `detect_network_filesystem` additionally
///   calls `GetDriveTypeW` to catch that case.
///
/// `"ftp"` is intentionally *not* in this list: on modern macOS (post Big
/// Sur) Finder's FTP mount was removed; on Linux, `curlftpfs` reports as
/// `fuse` / `fuse.curlftpfs`; Windows doesn't expose FTP as a drive. There
/// is no current OS where sysinfo's `file_system()` returns `"ftp"`.
const NETWORK_FILESYSTEMS: &[&str] = &[
    "smbfs",
    "cifs",
    "smb",
    "smb2",
    "smb3",
    "nfs",
    "nfs3",
    "nfs4",
    "afpfs",
    "webdav",
    "davfs",
    "sshfs",
    "fuse.sshfs",
    "9p",
    "ceph",
    "glusterfs",
    "beegfs",
    "lustre",
    "remote",
];

/// True if `fs_name` (already lowercased) indicates a network / remote
/// filesystem. Extracted so the match can be unit-tested without touching
/// real disks.
fn is_network_fs(fs_name: &str) -> bool {
    NETWORK_FILESYSTEMS
        .iter()
        .any(|known| fs_name == *known || fs_name.contains(known))
}

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
                // For drive-letter prefixes (e.g. `Z:\`), sysinfo reports
                // `GetVolumeInformationW`'s filesystem string which for an
                // SMB-mapped drive is usually `NTFS` (the share's backing
                // FS) rather than anything matching `NETWORK_FILESYSTEMS`.
                // Check `GetDriveTypeW` directly so we catch `DRIVE_REMOTE`
                // regardless of the volume's reported filesystem.
                Prefix::Disk(letter) | Prefix::VerbatimDisk(letter) => {
                    if is_windows_remote_drive(letter) {
                        return Some("remote".to_string());
                    }
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
    if is_network_fs(&fs_name) {
        Some(fs_name)
    } else {
        None
    }
}

/// Windows helper: returns true if the drive letter maps to a remote
/// (network) volume per `GetDriveTypeW`. `letter` is the ASCII byte for
/// the drive (e.g. `b'Z'`).
#[cfg(windows)]
fn is_windows_remote_drive(letter: u8) -> bool {
    use windows_sys::Win32::Storage::FileSystem::{DRIVE_REMOTE, GetDriveTypeW};
    // Build `"X:\0"` as a UTF-16 null-terminated string.
    let root: [u16; 4] = [u16::from(letter), u16::from(b':'), u16::from(b'\\'), 0];
    // Safety: `root` is a valid null-terminated wide string; the Win32
    // API reads it and returns a small integer code.
    let drive_type = unsafe { GetDriveTypeW(root.as_ptr()) };
    drive_type == DRIVE_REMOTE
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
                            fs::create_dir_all(parent)
                                .map_err(|e| InvokeError::from(e.to_string()))?;
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

#[cfg(test)]
mod tests {
    use super::is_network_fs;

    // Cases brianp called out in code review; extended with a few more so
    // regressions in NETWORK_FILESYSTEMS show up in `cargo test` without
    // needing a real mounted volume.
    #[test]
    fn local_filesystems_are_not_flagged() {
        assert!(!is_network_fs("ntfs"));
        assert!(!is_network_fs("apfs"));
        assert!(!is_network_fs("hfs+"));
        assert!(!is_network_fs("ext4"));
        assert!(!is_network_fs("btrfs"));
        assert!(!is_network_fs("xfs"));
        assert!(!is_network_fs("exfat"));
        assert!(!is_network_fs("zfs"));
    }

    #[test]
    fn smb_family_is_flagged() {
        // Note the matcher is invoked post-lowercase; sysinfo reports e.g.
        // `"SMB3"` on some Linux kernels — callers must lowercase first.
        assert!(is_network_fs("smbfs"));
        assert!(is_network_fs("smb"));
        assert!(is_network_fs("smb2"));
        assert!(is_network_fs("smb3"));
        assert!(is_network_fs("cifs"));
    }

    #[test]
    fn nfs_family_is_flagged() {
        assert!(is_network_fs("nfs"));
        assert!(is_network_fs("nfs3"));
        assert!(is_network_fs("nfs4"));
    }

    #[test]
    fn macos_network_mounts_are_flagged() {
        assert!(is_network_fs("afpfs"));
        assert!(is_network_fs("webdav"));
    }

    #[test]
    fn linux_clustered_mounts_are_flagged() {
        assert!(is_network_fs("ceph"));
        assert!(is_network_fs("glusterfs"));
        assert!(is_network_fs("beegfs"));
        assert!(is_network_fs("lustre"));
        assert!(is_network_fs("9p"));
        assert!(is_network_fs("fuse.sshfs"));
        assert!(is_network_fs("sshfs"));
    }

    #[test]
    fn generic_remote_token_is_flagged() {
        // sysinfo sometimes reports network drives on Windows with a FS
        // string that embeds `remote` — the contains() branch catches that.
        assert!(is_network_fs("remote"));
        assert!(is_network_fs("something-remote"));
    }

    #[test]
    fn ftp_is_deliberately_not_flagged() {
        // Kept as an explicit regression guard. See NETWORK_FILESYSTEMS
        // rustdoc: no current OS reports "ftp" via sysinfo.
        assert!(!is_network_fs("ftp"));
    }
}
