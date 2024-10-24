use std::{collections::HashMap, path::PathBuf, sync::LazyLock};

use serde::{Deserialize, Serialize};
use anyhow::{anyhow, Error, Ok};
use tauri::api::path::cache_dir;
use tokio::sync::RwLock;
use crate::{binaries::binaries_resolver::VersionDownloadInfo, APPLICATION_FOLDER_ID};

const LOG_TARGET: &str = "tari::universe::github_cache";

static INSTANCE: LazyLock<RwLock<CacheJsonFile>> = LazyLock::new(|| RwLock::new(CacheJsonFile::new()));

#[derive(Debug, Serialize, Deserialize)]
pub struct CacheEntry {
    pub repo_owner: String,
    pub repo_name: String,
    pub github_etag: Option<String>,
    pub mirror_etag: Option<String>,
    pub file_path: PathBuf,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CacheJsonFile {
    pub cache_entries: HashMap<String, CacheEntry>,
    pub cache_file_path: PathBuf,
}

impl CacheJsonFile {
    fn new() -> Self {
        let cache_file_path = PathBuf::new().join(APPLICATION_FOLDER_ID).join("cache").join("binaries_versions").join("versions_releases_responses.json");

        Self {
            cache_entries: HashMap::new(),
            cache_file_path,
        }
    }

    fn create_cache_entry_identifier(repo_owner: &str, repo_name: &str) -> String {
        format!("{}-{}", repo_owner, repo_name)
    }

    fn get_version_releases_responses_cache_file_path(&self) -> Result<PathBuf, Error> {
        let cache_path = cache_dir().ok_or_else(|| anyhow!("Failed to get cache directory"))?;
        Ok(cache_path.join(self.cache_file_path.clone()))
    }

    pub fn read_version_releases_responses_cache_file(&mut self) -> Result<(), Error> {
        let cache_file_path = self.get_version_releases_responses_cache_file_path()?;
        if !cache_file_path.exists() {
            std::fs::write(&cache_file_path, "{}")?;
        }
        let json = std::fs::read_to_string(&cache_file_path)?;
        self.cache_entries = serde_json::from_str(&json)?;
        Ok(())
    }

    fn save_version_releases_responses_cache_file(&self) -> Result<(), Error> {
        let cache_file_path = self.get_version_releases_responses_cache_file_path()?;
        let json = serde_json::to_string_pretty(&self.cache_entries)?;
        std::fs::write(&cache_file_path, json)?;
        Ok(())
    }

    pub fn get_cache_entry(&self, repo_owner: &str, repo_name: &str) -> Option<&CacheEntry> {
        self.cache_entries.get(&Self::create_cache_entry_identifier(repo_owner, repo_name))
    }


    pub fn update_cache_entry(&mut self, repo_owner: &str, repo_name: &str, github_etag: Option<String>, mirror_etag: Option<String>, file_path: PathBuf) -> Result<(), Error> {
        let cache_entry = self.cache_entries.get_mut(&Self::create_cache_entry_identifier(repo_owner, repo_name)).ok_or_else(|| anyhow!("Cache entry not found"))?;
        cache_entry.github_etag = github_etag;
        cache_entry.mirror_etag = mirror_etag;
        cache_entry.file_path = file_path;
        self.save_version_releases_responses_cache_file()?;
        Ok(())
    }

    pub fn create_cache_entry(&mut self, repo_owner: &str, repo_name: &str, file_path: PathBuf, github_etag: Option<String>, mirror_etag: Option<String>) -> Result<(), Error> {
        let is_cache_entry_exists = self.cache_entries.contains_key(&Self::create_cache_entry_identifier(repo_owner, repo_name));

        if is_cache_entry_exists {
            self.update_cache_entry(repo_owner, repo_name, github_etag, mirror_etag, file_path)?;
        } else {
            let cache_entry = CacheEntry {
                repo_owner: repo_owner.to_string(),
                repo_name: repo_name.to_string(),
                github_etag,
                mirror_etag,
                file_path,
            };
            self.cache_entries.insert(Self::create_cache_entry_identifier(repo_owner, repo_name), cache_entry);
            self.save_version_releases_responses_cache_file()?;
        };

        Ok(())
    }

    pub fn chech_if_content_file_exist(&self, repo_owner: &str, repo_name: &str) -> bool{
        let cache_entry = self.get_cache_entry(repo_owner, repo_name);
        match cache_entry {
            Some(cache_entry) => cache_entry.file_path.exists(),
            None => false,
        }
    }

    pub fn save_file_content(&self, repo_owner: &str, repo_name: &str, content: Vec<VersionDownloadInfo>) -> Result<(), Error> {
        let cache_entry = self.get_cache_entry(repo_owner, repo_name).ok_or_else(|| anyhow!("Cache entry not found"))?;
        let file_path = cache_entry.file_path.clone();
        let json = serde_json::to_string_pretty(&content)?;
        std::fs::write(&file_path, json)?;
        Ok(())
    }
        

    pub fn get_file_content(&self, repo_owner: &str, repo_name: &str) -> Result<Vec<VersionDownloadInfo>, Error> {
        let cache_entry = self.get_cache_entry(repo_owner, repo_name).ok_or_else(|| anyhow!("Cache entry not found"))?;
        let file_path = cache_entry.file_path.clone();
        let json = std::fs::read_to_string(&file_path)?;
        let content: Vec<VersionDownloadInfo> = serde_json::from_str(&json)?;
        Ok(content)
    }

    pub fn current() -> &'static RwLock<CacheJsonFile> {
        &INSTANCE
    }
    
}