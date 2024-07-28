use std::collections::HashMap;
use std::path::PathBuf;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use tauri::api::path::cache_dir;
use tokio::fs;
use crate::github;
use crate::xmrig::latest_release::fetch_latest_release;
use crate::xmrig_adapter::extract;


const TARI_SUITE_VERSION_URL : &str = "https://api.github.com/repos/tari-project/tari/releases/tags/v1.0.0-pre.18";

pub struct BinaryResolver {
    adapters : HashMap<Binaries, Box<dyn LatestVersionApiAdapter>>

}


pub struct VersionDownloadInfo {
    version: String
}

#[async_trait]
pub trait LatestVersionApiAdapter : Send + Sync + 'static {
   async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error>;

    fn get_binary_folder(&self) -> PathBuf;
}


pub struct XmrigVersionApiAdapter {

}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
    async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error> {
        todo!()
    }

    fn get_binary_folder(&self) -> PathBuf {
        todo!()
    }
}

pub struct GithubReleasesAdapter  {

}

#[async_trait]
impl LatestVersionApiAdapter for GithubReleasesAdapter {
    async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error> {
        let releases = github::list_releases("tari-project", "tari").await?;
        dbg!(releases);
        todo!()
    }

    fn get_binary_folder(&self) -> PathBuf {
        todo!()
    }
}


impl BinaryResolver {
    pub fn new() -> Self {
        let mut adapters = HashMap::<Binaries, Box<dyn LatestVersionApiAdapter >>::new();
        adapters.insert(Binaries::Xmrig, Box::new(XmrigVersionApiAdapter{}));
        adapters.insert(Binaries::MergeMiningProxy, Box::new(GithubReleasesAdapter {}));
        Self {
   adapters
        }
    }


    pub fn current() -> Self {
        Self::new()
    }
    pub fn resolve_path(&self, binary: Binaries) -> Result<PathBuf, anyhow::Error> {
        todo!()
    }

    pub async fn ensure_latest(&self, binary: Binaries) -> Result<(), anyhow::Error> {

        // TODO: Ensure version string is not malicious
        let version = self.ensure_latest_inner(binary, false).await?;
        // let adapter=        self.adapters.get(&binary).ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        // let mmproxy_dir =
        //     adapter.get_binary_folder().join(&version)
        //     .join();
        // let mmproxy_bin = mmproxy_dir.join("mmproxy");

        Ok(())
        // todo!()
    }

    async fn ensure_latest_inner(&self, binary: Binaries, force_download: bool) -> Result<String, Error> {
        let cache_dir = tauri::api::path::cache_dir()
            .ok_or(anyhow::anyhow!("Failed to get cache dir"))?
            .join("tari-universe");
let adapter=        self.adapters.get(&binary).ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let latest_release = adapter.fetch_latest_release().await?;
        // TODO: validate that version doesn't have any ".." or "/" in it

        let bin_folder = adapter.get_binary_folder().join(&latest_release.version);
        if force_download {
            println!("Cleaning up existing dir");
            let _ = fs::remove_dir_all(&bin_folder).await;
        }
        if !bin_folder.exists() {
            println!("Creating {} dir", binary.name());
            println!("latest version is {}", latest_release.version);
            let in_progress_dir = bin_folder.join("in_progress");
            if in_progress_dir.exists() {
                println!("Trying to delete dir {:?}", in_progress_dir);
                match fs::remove_dir(&in_progress_dir).await {
                    Ok(_) => {}
                    Err(e) => {
                        println!("Failed to delete dir {:?}", e);
                        // return Err(e.into());
                    }
                }
            }


            todo!()
            // let platform = latest_release
            //     .get_asset(&::get_os_string())
            //     .ok_or(anyhow::anyhow!("Failed to get windows_x64 asset"))?;
            // println!("Downloading file");
            // println!("Downloading file from {}", &platform.url);
            //
            // let in_progress_file = in_progress_dir.join(&platform.name);
            // crate::xmrig_adapter::download_file(&platform.url, &in_progress_file).await?;
            //
            // println!("Renaming file");
            // println!("Extracting file");
            // extract(&in_progress_file, &xmrig_dir).await?;
            // fs::remove_dir_all(in_progress_dir).await?;
        }
        Ok(latest_release.version)
    }


    fn get_os_string() -> String {
        #[cfg(target_os = "windows")]
        {
            return "windows-x64".to_string();
        }

        #[cfg(target_os = "macos")]
        {
            return "macos-x64".to_string();
        }

        #[cfg(target_os = "linux")]
        {
            return "linux-x64".to_string();
        }

        #[cfg(target_os = "freebsd")]
        {
            return "freebsd-x64".to_string();
        }

        panic!("Unsupported OS");
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
}


impl Binaries {
    pub fn name(&self) -> &str {
        match self {
            Binaries::Xmrig => "xmrig",
            Binaries::MergeMiningProxy => "mmproxy",
        }
    }
}