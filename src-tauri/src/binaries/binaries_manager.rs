use std::{collections::HashMap, ops::Deref, path::PathBuf, str::FromStr};

use semver::{Version, VersionReq};
use serde::{Deserialize, Serialize};
use tari_utilities::message_format::MessageFormat;

use crate::{
    binaries::binaries_resolver::BINARY_RESOLVER_LOG_TARGET,
    download_utils::{download_file_with_retries, extract, validate_checksum},
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
    online_versions_list: Vec<VersionDownloadInfo>,
    local_aviailable_versions_list: Vec<Version>,

    selected_version: Option<Version>,
    selected_version_checksum: Option<String>,

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
    ) -> Self {
        let version_requirements = BinaryManager::read_version_requirements(
            binary_name.clone(),
            versions_requirements_path,
        );

        Self {
            binary_name: binary_name.clone(),
            version_requirements,
            online_versions_list: Vec::new(),
            local_aviailable_versions_list: Vec::new(),
            selected_version: None,
            selected_version_checksum: None,
            is_highest_version_missing: false,
            adapter,
        }
    }

    fn select_highest_local_version(&mut self) -> Option<Version> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selecting highest local version for binary: {:?}", self.binary_name);

        if self.local_aviailable_versions_list.is_empty() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No local versions found for binary: {:?}", self.binary_name);
            return None;
        }

        self.selected_version = Some(self.local_aviailable_versions_list[0].clone());

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selected local version: {:?}", self.selected_version);
        self.selected_version.clone()
    }

    fn select_highest_online_version(&mut self) -> Option<Version> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selecting highest online version for binary: {:?}", self.binary_name);

        if self.online_versions_list.is_empty() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No online versions found for binary: {:?}", self.binary_name);
            return None;
        }

        self.selected_version = Some(self.online_versions_list[0].version.clone());

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selected online version: {:?}", self.selected_version);
        self.selected_version.clone()
    }

    fn create_in_progress_folder(&self) -> PathBuf {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Creating in progress folder for version: {:?}", self.selected_version);

        let binary_folder = self.adapter.get_binary_folder();
        let version_folder = binary_folder.join(self.selected_version.clone().unwrap().to_string());
        let in_progress_folder = version_folder.join("in_progress");

        if in_progress_folder.exists() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"Removing in progress folder: {:?}", in_progress_folder);
            std::fs::remove_dir_all(&in_progress_folder).unwrap();
        }

        info!(target: BINARY_RESOLVER_LOG_TARGET,"Creating in progress folder: {:?}", in_progress_folder);
        std::fs::create_dir_all(&in_progress_folder).unwrap();

        in_progress_folder
    }

    fn get_asset_for_selected_version(&self) -> Option<VersionAsset> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Getting asset for selected version: {:?}", self.selected_version);

        if self.selected_version.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version selected");
            return None;
        }

        let version_info = self
            .online_versions_list
            .iter()
            .find(|v| v.version.eq(&self.selected_version.clone().unwrap()));

        if version_info.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version info found for version: {:?}", self.selected_version);
            return None;
        }

        match self
            .adapter
            .find_version_for_platform(version_info.clone().unwrap())
        {
            Ok(asset) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Found asset for version: {:?}", self.selected_version);
                Some(asset)
            }
            Err(e) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Error finding asset for version: {:?}. Error: {:?}", self.selected_version, e);
                None
            }
        }
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

        let current_selected_version = self.selected_version.clone();
        let online_selected_version = self.select_highest_online_version();
        let local_selected_version = self.select_highest_local_version();

        let highest_version = Version::max(
            current_selected_version.unwrap_or(Version::new(0, 0, 0)),
            Version::max(
                online_selected_version.unwrap_or(Version::new(0, 0, 0)),
                local_selected_version.unwrap_or(Version::new(0, 0, 0)),
            ),
        );

        if highest_version == Version::new(0, 0, 0) {
            self.is_highest_version_missing = true;
            self.selected_version = None;
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

        self.selected_version = Some(highest_version.clone());
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Selected highest version: {:?}", self.selected_version);

        self.selected_version.clone()
    }

    pub fn check_if_files_of_selected_version_exist(&self, binary:Binaries) -> bool {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Checking if files for selected version exist: {:?}", self.selected_version);

        if self.selected_version.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version selected");
            return false;
        }

        let binary_folder = self.adapter.get_binary_folder();
        println!("Binary folder: {:?}", binary_folder);
        let version_folder = binary_folder.join(self.selected_version.clone().unwrap().to_string());
        println!("Version folder: {:?}", version_folder);
        let binary_file = version_folder.join(&binary.binary_file_name(self.selected_version.clone().unwrap()));
        println!("Binary file: {:?}", binary_file);

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
            println!("Version: {:?}", version_info.version.to_string());
            if self.version_requirements.matches(&version_info.version) {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Adding version to online list: {:?}", version_info.version);
                self.online_versions_list.push(version_info);
            }
        }

        self.online_versions_list
            .sort_by(|a, b| a.version.cmp(&b.version));
        self.online_versions_list.reverse();
    }

    pub async fn download_selected_version(
        &self,
        progress_tracker: ProgressTracker,
    ) -> Option<PathBuf> {
        info!(target: BINARY_RESOLVER_LOG_TARGET,"Downloading version: {:?}", self.selected_version);

        if self.selected_version.is_none() {
            info!(target: BINARY_RESOLVER_LOG_TARGET,"No version selected");
            return None;
        }

        let asset = self.get_asset_for_selected_version().unwrap();

        let in_progress_dir = self.create_in_progress_folder();
        let in_progress_file_zip = in_progress_dir.join(asset.name);

        let destination_dir = self
            .adapter
            .get_binary_folder()
            .join(self.selected_version.clone().unwrap().to_string());

        match download_file_with_retries(
            asset.url.as_str(),
            &in_progress_file_zip,
            progress_tracker,
        )
        .await
        {
            Ok(_) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Downloaded version: {:?}", self.selected_version);
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Extracting version: {:?}", self.selected_version);
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Destination dir: {:?}", destination_dir);
                info!(target: BINARY_RESOLVER_LOG_TARGET,"In progress file: {:?}", in_progress_file_zip);
                extract(&in_progress_file_zip, &destination_dir)
                    .await
                    .unwrap();
                return Some(in_progress_file_zip);
            }
            Err(e) => {
                info!(target: BINARY_RESOLVER_LOG_TARGET,"Error downloading version: {:?}. Error: {:?}", self.selected_version, e);
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
                    if self.version_requirements.matches(&version) {
                        self.local_aviailable_versions_list.push(version);
                    }
                }
                Err(e) => {
                    warn!("Error parsing version folder name: {:?}", e);
                }
            }
        }
    }

    pub fn get_selected_version(&self) -> Option<Version> {
        self.selected_version.clone()
    }

    pub fn get_base_dir(&self) -> PathBuf {
        self.adapter
            .get_binary_folder()
            .join(self.selected_version.clone().unwrap().to_string())
    }
}
