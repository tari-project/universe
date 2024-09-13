use std::{collections::HashMap,  path::PathBuf, str::FromStr};

use semver::{Version, VersionReq};
use serde::{Deserialize, Serialize};

use crate::{
    binaries::binaries_resolver::BINARY_RESOLVER_LOG_TARGET,
    download_utils::{download_file_with_retries, extract},
    progress_tracker::ProgressTracker,
};

use super::{
    binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo},
    Binaries,
};

use log::{info, warn};

#[derive(Deserialize, Serialize)]
struct BinaryVersionsJsonContent {
    binaries: HashMap<String, String>,
}
pub struct BinaryManager {
    binary_name: String,

    version_requirements: VersionReq,
    network_prerelease_prefix: Option<String>,

    online_versions_list: Vec<VersionDownloadInfo>,
    local_aviailable_versions_list: Vec<Version>,

    used_version: Option<Version>,
    is_highest_version_missing: bool,

    adapter: Box<dyn LatestVersionApiAdapter>,
}

impl BinaryManager {
    fn read_version_requirements(binary_name: String, path: PathBuf) -> VersionReq {
        info!(target: BINARY_RESOLVER_LOG_TARGET, "Reading version requirements for {:?} from: {:?}",binary_name, path);

        println!(
            "Reading version requirements for {:?} from: {:?}",
            binary_name, path
        );

        let json_content: BinaryVersionsJsonContent =
            serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
        let version_req = json_content.binaries.get(&binary_name);

        match version_req {
            Some(version_req) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,
                    "Version requirements for {:?}: {:?}",
                    binary_name, version_req
                );
                VersionReq::from_str(version_req).unwrap()
            }
            None => {
                warn!("No version requirements found for binary: {:?}. Will try to run with highest version found",binary_name);
                VersionReq::from_str("*").unwrap()
            }
        }
    }

    pub fn new(
        binary_name: String,
        adapter: Box<dyn LatestVersionApiAdapter>,
        versions_requirements_path: PathBuf,
        network_prerelease_prefix: Option<String>,
    ) -> Self {
        let version_requirements = BinaryManager::read_version_requirements(
            binary_name.clone(),
            versions_requirements_path,
        );

        Self {
            binary_name: binary_name.clone(),
            network_prerelease_prefix,
            version_requirements,
            online_versions_list: Vec::new(),
            local_aviailable_versions_list: Vec::new(),
            is_highest_version_missing: false,
            used_version: None,
            adapter,
        }
    }

    fn select_highest_local_version(&mut self) -> Option<Version> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selecting highest local version for binary: {:?}", self.binary_name);

        if self.local_aviailable_versions_list.is_empty() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No local versions found for binary: {:?}", self.binary_name);
            return None;
        }

        let selected_local_version = Some(self.local_aviailable_versions_list[0].clone());

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selected local version: {:?}", selected_local_version);
        selected_local_version.clone()
    }

    fn select_highest_online_version(&mut self) -> Option<Version> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selecting highest online version for binary: {:?}", self.binary_name);

        if self.online_versions_list.is_empty() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No online versions found for binary: {:?}", self.binary_name);
            return None;
        }

        let selected_online_version = Some(self.online_versions_list[0].version.clone());

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selected online version: {:?}", selected_online_version);
        selected_online_version.clone()
    }

    fn create_in_progress_folder_for_selected_version(&self,selected_version: Version) -> PathBuf {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Creating in progress folder for version: {:?}", selected_version);

        let binary_folder = self.adapter.get_binary_folder();
        let version_folder = binary_folder.join(selected_version.to_string());
        let in_progress_folder = version_folder.join("in_progress");

        if in_progress_folder.exists() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"Removing in progress folder: {:?}", in_progress_folder);
            std::fs::remove_dir_all(&in_progress_folder).unwrap();
        }

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Creating in progress folder: {:?}", in_progress_folder);
        std::fs::create_dir_all(&in_progress_folder).unwrap();

        in_progress_folder
    }

    fn get_asset_for_selected_version(&self,selected_version: Version) -> Option<VersionAsset> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Getting asset for selected version: {:?}", selected_version);

        let version_info = self
            .online_versions_list
            .iter()
            .find(|v| v.version.eq(&selected_version));

        if version_info.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version info found for version: {:?}", selected_version);
            return None;
        }

        match self
            .adapter
            .find_version_for_platform(version_info.clone().unwrap())
        {
            Ok(asset) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Found asset for version: {:?}", selected_version);
                Some(asset)
            }
            Err(e) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Error finding asset for version: {:?}. Error: {:?}", selected_version, e);
                None
            }
        }
    }

    fn check_if_version_meet_requirements(&self, version: &Version) -> bool {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Checking if version meets requirements: {:?}", version);
        let is_meet_semver = self.version_requirements.matches(version);
        let is_meet_network_prerelease = match self.network_prerelease_prefix.is_none() {
            true => true,
            false => !version
                .pre
                .matches(self.network_prerelease_prefix.clone().unwrap().as_str())
                .collect::<Vec<&str>>()
                .is_empty(),
        };

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Version meets semver requirements: {:?}", is_meet_semver);
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Version meets network prerelease requirements: {:?}", is_meet_network_prerelease);

        is_meet_semver && is_meet_network_prerelease
    }

    // async fn download_checksum(&mut self,progress_tracker: ProgressTracker) -> Option<PathBuf> {
    //     info!(target: BINARY_RESOLVER_LOG_TARGET,"Downloading checksum for version: {:?}", self.selected_version);

    //     if self.selected_version.is_none() {
    //         info!(target: BINARY_RESOLVER_LOG_TARGET,"No version selected");
    //         return None;
    //     }

    //     let asset = self.get_asset_for_selected_version().unwrap();
    //     let in_progress_dir = self.create_in_progress_folder();

    //     let in_progress_file_sha256 = in_progress_dir
    //         .clone()
    //         .join(format!("{}.sha256", asset.name));
    //     let asset_sha256_url = format!("{}.sha256", asset.url.clone());

    //     match download_file_with_retries(asset_sha256_url.as_str(), in_progress_file_sha256.deref(), progress_tracker).await {
    //         Ok(_) => {
    //             info!(target: BINARY_RESOLVER_LOG_TARGET,"Downloaded checksum for version: {:?}", self.selected_version);
    //             return Some(in_progress_file_sha256)
    //         }
    //         Err(e) => {
    //             info!(target: BINARY_RESOLVER_LOG_TARGET,"Error downloading checksum for version: {:?}. Error: {:?}", self.selected_version, e);
    //             return None
    //         }
    //     }

    // }

    // pub async fn validate_checksum_and_extract(&mut self, zip_file: PathBuf, checksum_file: PathBuf) -> bool {
    //     info!(target: BINARY_RESOLVER_LOG_TARGET,"Validating checksum for version: {:?}", self.selected_version);

    //     let asset = self.get_asset_for_selected_version().unwrap();
    //     match validate_checksum(zip_file.clone(), checksum_file, asset.name).await {
    //         Ok(_) => {
    //             info!(target: BINARY_RESOLVER_LOG_TARGET,"Checksum validated for version: {:?}", self.selected_version);

    //             let bin_dir = self.adapter.get_binary_folder().join(self.selected_version.clone().unwrap().to_string());

    //             extract(zip_file.clone().as_path(), bin_dir.as_path()).await.unwrap();

    //             return true
    //         }
    //         Err(e) => {
    //             info!(target: BINARY_RESOLVER_LOG_TARGET,"Error validating checksum for version: {:?}. Error: {:?}", self.selected_version, e);
    //             return false
    //         }
    //     }

    // }

    pub fn select_highest_version(&mut self) -> Option<Version> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selecting version for binary: {:?}", self.binary_name);

        let online_selected_version = self.select_highest_online_version();
        let local_selected_version = self.select_highest_local_version();

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Online selected version: {:?}", online_selected_version);
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Local selected version: {:?}", local_selected_version);

        let highest_version = Version::max(
                online_selected_version.unwrap_or(Version::new(0, 0, 0)),
                local_selected_version.unwrap_or(Version::new(0, 0, 0)),
        );

        if highest_version == Version::new(0, 0, 0) {
            self.is_highest_version_missing = true;
            return None;
        }

        if self
            .local_aviailable_versions_list
            .contains(&highest_version)
        {
            self.is_highest_version_missing = false;
        } else {
            self.is_highest_version_missing = true;
        }

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selected highest version: {:?}", highest_version);

        Some(highest_version.clone())
    }

    pub fn check_if_files_for_version_exist(&self, version: Option<Version>) -> bool {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Checking if files for selected version exist: {:?}", version);

        if version.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version selected");
            return false;
        }

        let binary_folder = self.adapter.get_binary_folder();
        let version_folder = binary_folder.join(version.clone().unwrap().to_string());
        let binary_file = version_folder.join(
            Binaries::from_name(&self.binary_name)
                .unwrap()
                .binary_file_name(version.clone().unwrap()),
        );

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Binary folder path: {:?}", binary_folder);
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Version folder path: {:?}", version_folder);
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Binary file path: {:?}", binary_file);

        let binary_file_exists = binary_file.exists();

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Binary file exists: {:?}", binary_file_exists);

        binary_file_exists
    }

    pub async fn check_for_updates(&mut self) {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Checking for updates for binary: {:?}", self.binary_name);

        let versions_info = self
            .adapter
            .fetch_releases_list()
            .await
            .unwrap_or(Vec::new());

        info!(target: BINARY_RESOLVER_LOG_TARGET,
            "Found {:?} versions for binary: {:?}",
            versions_info.len(),
            self.binary_name
        );

        for version_info in versions_info {
            if self.check_if_version_meet_requirements(&version_info.version) {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Adding version to online versions list: {:?}", version_info.version);
                self.online_versions_list.push(version_info);
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
    ) -> Option<PathBuf> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Downloading version: {:?}", selected_version);

        if selected_version.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version selected");
            return None;
        }

        let asset = self.get_asset_for_selected_version(selected_version.clone().unwrap()).unwrap();

        let destination_dir = self
            .adapter
            .get_binary_folder()
            .join(selected_version.clone().unwrap().to_string());

        // This is a safety check to ensure that the destination directory is empty
        // Its special case for tari repo, where zip will inclue mutliple binaries
        // So when one of them is deleted, and we need to download it again
        // We in fact will download zip with multiple binaries, and when other binaries are present in destination dir
        // extract will fail, so we need to remove all files from destination dir
        if destination_dir.exists() {
            std::fs::remove_dir_all(&destination_dir).unwrap();
            std::fs::create_dir_all(&destination_dir).unwrap();
        }

        let in_progress_dir = self.create_in_progress_folder_for_selected_version(selected_version.clone().unwrap());
        let in_progress_file_zip = in_progress_dir.join(asset.name);

        match download_file_with_retries(
            asset.url.as_str(),
            &in_progress_file_zip,
            progress_tracker,
        )
        .await
        {
            Ok(_) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Downloaded version: {:?}", selected_version.clone());
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Extracting version: {:?}", selected_version.clone());
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Destination dir: {:?}", destination_dir);
                info!(target: BINARY_RESOLVER_LOG_TARGET,"In progress file: {:?}", in_progress_file_zip);

                extract(&in_progress_file_zip, &destination_dir)
                    .await
                    .unwrap();
                return Some(in_progress_file_zip);
            }
            Err(e) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Error downloading version: {:?}. Error: {:?}", selected_version, e);
                return None;
            }
        }
    }

    pub async fn read_local_versions(&mut self) {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Reading local versions for binary: {:?}", self.binary_name);

        let binary_folder = self.adapter.get_binary_folder();

        // adapter.get_binary_folder() ensures that the folder exists so we can safely unwrap here
        let version_folders_list = std::fs::read_dir(binary_folder).unwrap();

        for version_folder in version_folders_list {
            if version_folder.is_err() {
                continue;
            }
            let version_folder = version_folder.unwrap();
            let is_folder = version_folder.file_type().unwrap().is_dir();
            if !is_folder {
                continue;
            }

            let version_folder_name = version_folder.file_name();
            match Version::from_str(version_folder_name.to_str().unwrap()) {
                Ok(version) => {
                    info!(target: BINARY_RESOLVER_LOG_TARGET,"Found local version: {:?}", version);
                    if self.check_if_version_meet_requirements(&version)
                        && self.check_if_files_for_version_exist(Some(version.clone()))
                    {
                        info!(target: BINARY_RESOLVER_LOG_TARGET,"Adding local version to list: {:?}", version);
                        self.local_aviailable_versions_list.push(version);
                    }
                }
                Err(e) => {
                    warn!("Error parsing version folder name: {:?}", e);
                }
            }
        }
    }

    pub fn set_used_version(&mut self, version: Version) {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Setting used version: {:?}", version);
        self.used_version = Some(version);
    }

    pub fn get_used_version(&self) -> Option<Version> {
        self.used_version.clone()
    }

    pub fn get_base_dir(&self) -> PathBuf {
        self.adapter
            .get_binary_folder()
            .join(self.used_version.clone().unwrap().to_string())
    }
}
