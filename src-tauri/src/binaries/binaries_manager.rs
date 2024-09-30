use anyhow::{anyhow, Error};
use semver::{Version, VersionReq};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, str::FromStr};
use tari_common::configuration::Network;

use crate::{
    download_utils::{download_file_with_retries, extract, validate_checksum},
    progress_tracker::ProgressTracker,
};

use super::{
    binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo},
    Binaries,
};

use log::{error, info, warn};

pub const LOG_TARGET: &str = "tari::universe::binary_manager";

#[derive(Deserialize, Serialize, Default)]
struct BinaryVersionsJsonContent {
    binaries: HashMap<String, String>,
}
pub struct BinaryManager {
    binary_name: String,

    version_requirements: VersionReq,
    network_prerelease_prefix: Option<String>,
    should_validate_checksum: bool,

    online_versions_list: Vec<VersionDownloadInfo>,
    local_aviailable_versions_list: Vec<Version>,

    used_version: Option<Version>,

    adapter: Box<dyn LatestVersionApiAdapter>,
}

impl BinaryManager {
    pub fn new(
        binary_name: String,
        adapter: Box<dyn LatestVersionApiAdapter>,
        network_prerelease_prefix: Option<String>,
        should_validate_checksum: bool,
    ) -> Self {
        let versions_requirements_data = match Network::get_current_or_user_setting_or_default() {
            Network::NextNet => include_str!("../../binaries_versions_nextnet.json"),
            Network::Esmeralda => include_str!("../../binaries_versions_esmeralda.json"),
            _ => panic!("Unsupported network"),
        };
        let version_requirements = BinaryManager::read_version_requirements(
            binary_name.clone(),
            versions_requirements_data,
        );

        Self {
            binary_name: binary_name.clone(),
            should_validate_checksum,
            network_prerelease_prefix,
            version_requirements,
            online_versions_list: Vec::new(),
            local_aviailable_versions_list: Vec::new(),
            used_version: None,
            adapter,
        }
    }

    fn read_version_requirements(binary_name: String, data_str: &str) -> VersionReq {
        let json_content: BinaryVersionsJsonContent =
            serde_json::from_str(data_str).unwrap_or_default();
        let version_req = json_content.binaries.get(&binary_name);

        match version_req {
            Some(version_req) => {
                info!(target: LOG_TARGET,
                    "Version requirements for {:?}: {:?}",
                    binary_name, version_req
                );
                match VersionReq::from_str(version_req) {
                    Ok(requirements) => requirements,
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error parsing version requirements for binary: {:?}. Error: {:?}", binary_name, e);
                        VersionReq::default()
                    }
                }
            }
            None => {
                warn!("No version requirements found for binary: {:?}. Will try to run with highest version found",binary_name);
                VersionReq::default()
            }
        }
    }

    fn select_highest_local_version(&mut self) -> Option<Version> {
        info!(target: LOG_TARGET,"Selecting highest local version for binary: {:?}", self.binary_name);

        if self.local_aviailable_versions_list.is_empty() {
            warn!(target: LOG_TARGET,"No local versions found for binary: {:?}", self.binary_name);
            return None;
        }

        let selected_local_version = Some(self.local_aviailable_versions_list[0].clone());

        info!(target: LOG_TARGET,"Selected local version: {:?}", selected_local_version);
        selected_local_version.clone()
    }

    fn select_highest_online_version(&mut self) -> Option<Version> {
        info!(target: LOG_TARGET,"Selecting highest online version for binary: {:?}", self.binary_name);

        if self.online_versions_list.is_empty() {
            warn!(target: LOG_TARGET,"No online versions found for binary: {:?}", self.binary_name);
            return None;
        }

        let selected_online_version = Some(self.online_versions_list[0].version.clone());

        info!(target: LOG_TARGET,"Selected online version: {:?}", selected_online_version);
        selected_online_version.clone()
    }

    fn create_in_progress_folder_for_selected_version(
        &self,
        selected_version: Version,
    ) -> Result<PathBuf, Error> {
        info!(target: LOG_TARGET,"Creating in progress folder for version: {:?}", selected_version);

        let binary_folder = match self.adapter.get_binary_folder() {
            Ok(path) => path,
            Err(e) => {
                error!(target: LOG_TARGET,"Error getting binary folder. Error: {:?}", e);
                return Err(e);
            }
        };

        let version_folder = binary_folder.join(selected_version.to_string());
        let in_progress_folder = version_folder.join("in_progress");

        if in_progress_folder.exists() {
            info!(target: LOG_TARGET,"Removing in progress folder: {:?}", in_progress_folder);
            std::fs::remove_dir_all(&in_progress_folder).map_err(| error | {
                error!(target: LOG_TARGET,"Error removing in progress folder: {:?}. Error: {:?}", in_progress_folder, error);
            });
        }

        info!(target: LOG_TARGET,"Creating in progress folder: {:?}", in_progress_folder);
        std::fs::create_dir_all(&in_progress_folder)?;

        Ok(in_progress_folder)
    }

    fn get_asset_for_selected_version(
        &self,
        selected_version: Version,
    ) -> Result<VersionAsset, Error> {
        info!(target: LOG_TARGET,"Getting asset for selected version: {:?}", selected_version);

        let version_info = self
            .online_versions_list
            .iter()
            .find(|v| v.version.eq(&selected_version));

        match version_info {
            Some(version_info) => {
                info!(target: LOG_TARGET,"Found version info for version: {:?}", selected_version);
                match self.adapter.find_version_for_platform(version_info) {
                    Ok(asset) => {
                        info!(target: LOG_TARGET,"Found asset for version: {:?}", selected_version);
                        Ok(asset)
                    }
                    Err(error) => {
                        error!(target: LOG_TARGET,"Error finding asset for version: {:?}. Error: {:?}", selected_version, error);
                        Err(error)
                    }
                }
            }
            None => {
                error!(target: LOG_TARGET,"No version info found for version: {:?}", selected_version);
                Err(anyhow!(
                    "No version info found for version: {:?}",
                    selected_version
                ))
            }
        }
    }

    fn check_if_version_meet_requirements(&self, version: &Version) -> bool {
        info!(target: LOG_TARGET,"Checking if version meets requirements: {:?}", version);
        let is_meet_semver = self.version_requirements.matches(version);

        let did_meet_network_prerelease = match &self.network_prerelease_prefix {
            Some(prefix) => {
                let matches = version.pre.matches(prefix);
                !matches.collect::<Vec<&str>>().is_empty()
            }
            None => true,
        };

        info!(target: LOG_TARGET,"Version meets semver requirements: {:?}", is_meet_semver);
        info!(target: LOG_TARGET,"Version meets network prerelease requirements: {:?}", did_meet_network_prerelease);

        is_meet_semver && did_meet_network_prerelease
    }

    fn check_if_version_exceeds_requirements(&self, version: &Version) -> bool {
        !self
            .online_versions_list
            .iter()
            .any(|v| v.version.gt(version))
    }

    pub fn select_highest_version(&mut self) -> Option<Version> {
        info!(target: LOG_TARGET,"Selecting version for binary: {:?}", self.binary_name);

        let online_selected_version = self.select_highest_online_version();
        let local_selected_version = self.select_highest_local_version();

        info!(target: LOG_TARGET,"Online selected version: {:?}", online_selected_version);
        info!(target: LOG_TARGET,"Local selected version: {:?}", local_selected_version);

        let highest_version = Version::max(
            online_selected_version.unwrap_or(Version::new(0, 0, 0)),
            local_selected_version.unwrap_or(Version::new(0, 0, 0)),
        );

        if highest_version == Version::new(0, 0, 0) {
            warn!(target: LOG_TARGET,"No version selected");
            return None;
        }

        info!(target: LOG_TARGET,"Selected highest version: {:?}", highest_version);

        Some(highest_version.clone())
    }

    pub fn check_if_files_for_version_exist(&self, version: Option<Version>) -> bool {
        info!(target: LOG_TARGET,"Checking if files for selected version exist: {:?}", version);

        match version {
            None => {
                warn!(target: LOG_TARGET,"No version selected");
                return false;
            }
            Some(version) => {
                info!(target: LOG_TARGET,"Selected version: {:?}", version);
                let binary_folder = match self.adapter.get_binary_folder() {
                    Ok(path) => path,
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error getting binary folder. Error: {:?}", e);
                        return false;
                    }
                };

                let version_folder = binary_folder.join(version.to_string());
                let binary_file = version_folder
                    .join(Binaries::from_name(&self.binary_name).binary_file_name(version));
                let binary_file_with_exe = binary_file.with_extension("exe");

                info!(target: LOG_TARGET,"Binary folder path: {:?}", binary_folder);
                info!(target: LOG_TARGET,"Version folder path: {:?}", version_folder);
                info!(target: LOG_TARGET,"Binary file path: {:?}", binary_file);

                let binary_file_exists = binary_file.exists() || binary_file_with_exe.exists();

                info!(target: LOG_TARGET,"Binary file exists: {:?}", binary_file_exists);

                binary_file_exists
            }
        }
    }

    pub async fn check_for_updates(&mut self) {
        info!(target: LOG_TARGET,"Checking for updates for binary: {:?}", self.binary_name);

        let versions_info = self
            .adapter
            .fetch_releases_list()
            .await
            .unwrap_or(Vec::new());

        info!(target: LOG_TARGET,
            "Found {:?} versions for binary: {:?}",
            versions_info.len(),
            self.binary_name
        );

        for version_info in versions_info {
            if self.check_if_version_meet_requirements(&version_info.version) {
                info!(target: LOG_TARGET,"Adding version to online versions list: {:?}", version_info.version);
                self.online_versions_list.push(version_info);
            } else {
                info!(target: LOG_TARGET,"Skipping version: {:?}", version_info.version);
                if self.check_if_version_exceeds_requirements(&version_info.version) {
                    warn!(target: LOG_TARGET,"Version: {:?} is higher then maximum version from requirements", version_info.version);
                }
            }
        }

        self.online_versions_list
            .sort_by(|a, b| a.version.cmp(&b.version));
        self.online_versions_list.reverse();
    }

    pub async fn download_selected_version(
        &self,
        selected_version: Option<Version>,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        info!(target: LOG_TARGET,"Downloading version: {:?}", selected_version);

        match selected_version {
            None => {
                warn!(target: LOG_TARGET,"No version selected");
                return Err(anyhow!("No version selected"));
            }
            Some(version) => {
                let asset = match self.get_asset_for_selected_version(version.clone()) {
                    Ok(asset) => asset,
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error getting asset for version: {:?}. Error: {:?}", version.clone(), e);
                        return Err(anyhow!("Error getting asset for version"));
                    }
                };

                let binary_folder = match self.adapter.get_binary_folder() {
                    Ok(path) => path,
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error getting binary folder. Error: {:?}", e);
                        return Err(anyhow!("Error getting binary folder"));
                    }
                };
                let destination_dir = binary_folder.join(version.clone().to_string());

                // This is a safety check to ensure that the destination directory is empty
                // Its special case for tari repo, where zip will inclue mutliple binaries
                // So when one of them is deleted, and we need to download it again
                // We in fact will download zip with multiple binaries, and when other binaries are present in destination dir
                // extract will fail, so we need to remove all files from destination dir
                if destination_dir.exists() {
                    warn!(target: LOG_TARGET,"Destination dir exists. Removing all files from: {:?}", destination_dir);
                    std::fs::remove_dir_all(&destination_dir).map_err(|error| {
                        error!(target: LOG_TARGET,"Error removing all files from destination dir: {:?}. Error: {:?}", destination_dir, error);
                    });
                    info!(target: LOG_TARGET,"Creating destination dir: {:?}", destination_dir);
                    std::fs::create_dir_all(&destination_dir).map_err(|error| {
                        error!(target: LOG_TARGET,"Error creating destination dir: {:?}. Error: {:?}", destination_dir, error);
                    });
                }

                let in_progress_dir = match self
                    .create_in_progress_folder_for_selected_version(version.clone())
                {
                    Ok(path) => path,
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error creating in progress folder. Error: {:?}", e);
                        return Err(anyhow!("Error creating in progress folder"));
                    }
                };
                let in_progress_file_zip = in_progress_dir.join(asset.clone().name);

                match download_file_with_retries(
                    asset.clone().url.as_str(),
                    &in_progress_file_zip,
                    progress_tracker.clone(),
                )
                .await
                {
                    Ok(_) => {
                        info!(target: LOG_TARGET,"Downloaded version: {:?}", version.clone());
                        info!(target: LOG_TARGET,"Extracting version: {:?}", version.clone());
                        info!(target: LOG_TARGET,"Destination dir: {:?}", destination_dir);
                        info!(target: LOG_TARGET,"In progress file: {:?}", in_progress_file_zip);

                        extract(&in_progress_file_zip.clone(), &destination_dir)
                            .await.map_err(|error| {
                                error!(target: LOG_TARGET,"Error extracting version: {:?}. Error: {:?}", version.clone(), error);
                                return error;
                            });

                        if self.should_validate_checksum {
                            info!(target: LOG_TARGET,"Validating checksum for version: {:?}", version.clone());
                            let version_download_info = VersionDownloadInfo {
                                version: version.clone(),
                                assets: vec![asset.clone()],
                            };
                            let checksum_file = match self
                                .adapter
                                .download_and_get_checksum_path(
                                    destination_dir.clone(),
                                    version_download_info,
                                    progress_tracker.clone(),
                                )
                                .await
                            {
                                Ok(checksum_file) => checksum_file,
                                Err(e) => {
                                    error!(target: LOG_TARGET,"Error downloading checksum file for version: {:?}. Error: {:?}", version.clone(), e);
                                    std::fs::remove_dir_all(destination_dir.clone()).map_err(
                                        |error| {
                                            error!(target: LOG_TARGET,"Error removing destination dir: {:?}. Error: {:?}", destination_dir, error);
                                        },
                                    );
                                    return Err(e);
                                }
                            };

                            match validate_checksum(
                                in_progress_file_zip.clone(),
                                checksum_file,
                                asset.clone().name,
                            )
                            .await
                            {
                                Ok(_) => {
                                    info!(target: LOG_TARGET,"Checksum validated for version: {:?}", version.clone());
                                    Ok(())
                                }
                                Err(e) => {
                                    error!(target: LOG_TARGET,"Error validating checksum for version: {:?}. Error: {:?}", version.clone(), e);
                                    std::fs::remove_dir_all(destination_dir.clone()).map_err(
                                        |error| {
                                            error!(target: LOG_TARGET,"Error removing destination dir: {:?}. Error: {:?}", destination_dir, error);
                                        },
                                    );
                                    Err(e)
                                }
                            }
                        } else {
                            Ok(())
                        }
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error downloading version: {:?}. Error: {:?}", version.clone(), e);
                        Err(e)
                    }
                }
            }
        }
    }

    pub async fn read_local_versions(&mut self) {
        info!(target: LOG_TARGET,"Reading local versions for binary: {:?}", self.binary_name);

        let binary_folder = match self.adapter.get_binary_folder() {
            Ok(path) => path,
            Err(e) => {
                error!(target: LOG_TARGET,"Error getting binary folder. Error: {:?}", e);
                return;
            }
        };

        match std::fs::read_dir(binary_folder) {
            Ok(version_folders_list) => {
                for version_folder in version_folders_list {
                    let version_folder = match version_folder {
                        Ok(version_folder) => version_folder,
                        Err(e) => {
                            error!(target: LOG_TARGET,"Error reading version folder. Error: {:?}", e);
                            continue;
                        }
                    };
                    let is_folder = match version_folder.file_type() {
                        Ok(file_type) => file_type.is_dir(),
                        Err(e) => {
                            error!(target: LOG_TARGET,"Error getting file type. Error: {:?}", e);
                            continue;
                        }
                    };

                    if !is_folder {
                        continue;
                    }

                    let version_folder = version_folder.file_name();
                    let version_folder_name = match version_folder.to_str() {
                        Some(name) => name,
                        None => {
                            error!(target: LOG_TARGET,"Error getting version folder name");
                            continue;
                        }
                    };
                    match Version::from_str(version_folder_name) {
                        Ok(version) => {
                            info!(target: LOG_TARGET,"Found local version: {:?}", version);
                            if self.check_if_version_meet_requirements(&version)
                                && self.check_if_files_for_version_exist(Some(version.clone()))
                            {
                                info!(target: LOG_TARGET,"Adding local version to list: {:?}", version);
                                self.local_aviailable_versions_list.push(version);
                            }
                        }
                        Err(e) => {
                            error!("Error parsing version folder name: {:?}", e);
                        }
                    }
                }
            }
            Err(e) => {
                error!(target: LOG_TARGET,"Error reading binary folder. Error: {:?}", e);
            }
        };
    }

    pub fn set_used_version(&mut self, version: Version) {
        info!(target: LOG_TARGET,"Setting used version: {:?}", version);
        self.used_version = Some(version);
    }

    pub fn get_used_version(&self) -> Option<Version> {
        self.used_version.clone()
    }

    pub fn get_base_dir(&self) -> Result<PathBuf, Error> {
        match self.adapter.get_binary_folder() {
            Ok(path) => match self.used_version.clone() {
                Some(version) => Ok(path.join(version.to_string())),
                None => Err(anyhow!("No version selected")),
            },
            Err(e) => {
                error!(target: LOG_TARGET,"Error getting binary folder. Error: {:?}", e);
                Err(e)
            }
        }
    }
}
