use crate::cpu_miner::CpuMinerEvent;
use crate::xmrig::latest_release::fetch_latest_release;
use anyhow::{anyhow, Error};
use async_zip::base::read::seek::ZipFileReader;
use flate2::read::GzDecoder;
use futures_util::{FutureExt, StreamExt};
use std::path::{Path, PathBuf};
use tar::Archive;
use tari_shutdown::Shutdown;
use tokio::fs;
use tokio::fs::OpenOptions;
use tokio::fs::{copy, File};
use tokio::io::AsyncWriteExt;
use tokio::io::BufReader;
use tokio::runtime::Handle;
use tokio::sync::mpsc::Receiver;
use tokio::task::JoinHandle;


pub enum XmrigNodeConnection {
    LocalMmproxy{ host_name: String, port: u16},
}

impl XmrigNodeConnection {
    pub fn generate_args(&self) -> Vec<String> {
        match self {
            XmrigNodeConnection::LocalMmproxy{ host_name, port} => {
                vec![
                    "--daemon".to_string(),  format!("--url={}:{}", host_name, port), "--coin=monero".to_string(),
                    // TODO: Generate password
                "--http-port".to_string(), "9090".to_string(), "--http-access-token=pass".to_string()]},
        }
    }
}

pub struct XmrigAdapter {
    force_download: bool,
    node_connection: XmrigNodeConnection,
    monero_address: String,
    // TODO: secure
    http_api_token: String,
    http_api_port: u16
}

pub struct XmrigInstance {
    shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

impl XmrigAdapter {
    pub fn new(xmrig_node_connection: XmrigNodeConnection, monero_address: String) -> Self {
        Self {
            force_download: false,
            node_connection: xmrig_node_connection,
            monero_address,
            http_api_token: "pass".to_string(),
            http_api_port: 9090


        }
    }
    pub fn spawn(&self) -> Result<(Receiver<CpuMinerEvent>, XmrigInstance, XmrigHttpApiClient), anyhow::Error> {
        let (tx, rx) = tokio::sync::mpsc::channel(100);
        let cache_dir = tauri::api::path::cache_dir()
            .ok_or(anyhow::anyhow!("Failed to get cache dir"))?
            .join("tari-universe");
        let force_download = self.force_download;
        let xmrig_shutdown = Shutdown::new();
        let mut shutdown_signal = xmrig_shutdown.to_signal();
        let mut args = self.node_connection.generate_args();
        let xmrig_log_file = cache_dir.join("log").join("xmrig.log");
        std::fs::create_dir_all(xmrig_log_file.parent().unwrap())?;
        args.push(format!("--log-file={}", &xmrig_log_file.to_str().unwrap()));
        args.push(format!("--http-port={}", self.http_api_port));
        args.push(format!("--http-access-token={}", self.http_api_token));
        args.push(format!("--donate-level=1"));
        args.push(format!("--user={}", self.monero_address));
        dbg!(&args);
        let client =
            XmrigHttpApiClient::new(format!("http://127.0.0.1:{}", self.http_api_port), self.http_api_token.clone());

        Ok((
            rx,
            XmrigInstance {
                shutdown: xmrig_shutdown,
                handle: Some(tokio::spawn(async move {
                    // TODO: Ensure version string is not malicious
                    let version = Self::ensure_latest(cache_dir.clone(), force_download).await?;
                    let xmrig_dir = cache_dir
                        .join("xmrig")
                        .join(&version)
                        .join(format!("xmrig-{}", version));
                    let xmrig_bin = xmrig_dir.join("xmrig");
                    let mut xmrig = tokio::process::Command::new(xmrig_bin)
                        .args(args)
                        .stdout(std::process::Stdio::piped())
                        .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()?;

                    // let (receiver, xmrig) =
                    //     tauri::api::process::Command::new(xmrig_bin.to_str().unwrap().to_string())
                    //         .current_dir(xmrig_dir)
                    //         .spawn()?;
                    shutdown_signal.wait().await;
                    println!("Stopping xmrig");

                    xmrig.kill().await?;

                    Ok(())
                })),
            },
            client
        ))
    }



    async fn ensure_latest(cache_dir: PathBuf, force_download: bool) -> Result<String, Error> {
        let latest_release = fetch_latest_release().await?;
        let xmrig_dir = cache_dir.join("xmrig").join(&latest_release.version);
        if force_download {
            println!("Cleaning up xmrig dir");
            let _ = fs::remove_dir_all(&xmrig_dir).await;
        }
        if !xmrig_dir.exists() {
            println!("Latest version of xmrig doesn't exist");
            println!("latest version is {}", latest_release.version);
            let in_progress_dir = cache_dir.join("xmrig").join("in_progress");
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

            let platform = latest_release
                .get_asset(&get_os_string())
                .ok_or(anyhow::anyhow!("Failed to get windows_x64 asset"))?;
            println!("Downloading file");
            println!("Downloading file from {}", &platform.url);

            let in_progress_file = in_progress_dir.join(&platform.name);
            download_file(&platform.url, &in_progress_file).await?;

            println!("Renaming file");
            println!("Extracting file");
            extract(&in_progress_file, &xmrig_dir).await?;
            fs::remove_dir_all(in_progress_dir).await?;
        }
        Ok(latest_release.version)
    }
}

impl XmrigInstance {
    pub fn ping(&self) -> Result<bool, anyhow::Error> {
        Ok(self
            .handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false))
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        handle.unwrap().await?
    }
    pub fn kill(&self) -> Result<(), anyhow::Error> {
        todo!()
        // Ok(())
    }
}

impl Drop for XmrigInstance {
    fn drop(&mut self) {
        println!("Drop being called");
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                handle.await.unwrap();
            });
        }
    }
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

async fn download_file(url: &str, destination: &Path) -> Result<(), anyhow::Error> {
    println!("Downloading {} to {:?}", url, destination);
    let response = reqwest::get(url).await?;

    // Ensure the directory exists
    if let Some(parent) = destination.parent() {
        println!("Creating dir {:?}", parent);
        fs::create_dir_all(parent).await?;
    }

    // Open a file for writing
    let mut dest = File::create(destination).await?;

    // Stream the response body directly to the file
    let mut stream = response.bytes_stream();
    while let Some(item) = stream.next().await {
        println!("Writing bytes");
        dest.write_all(&item?).await?;
    }
    println!("Done downloading");

    Ok(())
}

pub async fn extract(file_path: &Path, dest_dir: &Path) -> Result<(), anyhow::Error> {
    match file_path.extension() {
        Some(ext) => match ext.to_str() {
            Some("gz") => {
                extract_gz(file_path, dest_dir).await?;
            }
            Some("zip") => {
                extract_zip(file_path, dest_dir).await?;
            }
            _ => {
                return Err(anyhow::anyhow!("Unsupported file extension"));
            }
        },
        None => {
            return Err(anyhow::anyhow!("File has no extension"));
        }
    }
    Ok(())
}

pub async fn extract_gz(gz_path: &Path, dest_dir: &Path) -> std::io::Result<()> {
    let gz_file = std::fs::File::open(gz_path)?;
    println!("Extracting file at {:?}", gz_path);
    let decoder = GzDecoder::new(std::io::BufReader::new(gz_file));
    let mut archive = Archive::new(decoder);
    println!("Unpacking to {:?}", dest_dir);
    archive.unpack(dest_dir)?;
    Ok(())
}
use tokio_util::compat::{TokioAsyncReadCompatExt, TokioAsyncWriteCompatExt};
use crate::xmrig::http_api::XmrigHttpApiClient;

// Taken from async_zip example

fn sanitize_file_path(path: &str) -> PathBuf {
    // Replaces backwards slashes
    path.replace('\\', "/")
        // Sanitizes each component
        .split('/')
        .map(sanitize_filename::sanitize)
        .collect()
}
async fn extract_zip(archive: &Path, out_dir: &Path) -> Result<(), anyhow::Error> {
    let archive = BufReader::new(fs::File::open(archive).await?).compat();
    let mut reader = ZipFileReader::new(archive).await?;
    for index in 0..reader.file().entries().len() {
        let entry = reader.file().entries().get(index).unwrap();
        let path = out_dir.join(sanitize_file_path(entry.filename().as_str().unwrap()));
        // If the filename of the entry ends with '/', it is treated as a directory.
        // This is implemented by previous versions of this crate and the Python Standard Library.
        // https://docs.rs/async_zip/0.0.8/src/async_zip/read/mod.rs.html#63-65
        // https://github.com/python/cpython/blob/820ef62833bd2d84a141adedd9a05998595d6b6d/Lib/zipfile.py#L528
        let entry_is_dir = entry.dir().unwrap();

        let mut entry_reader = reader.reader_without_entry(index).await?;

        if entry_is_dir {
            // The directory may have been created if iteration is out of order.
            if !path.exists() {
                fs::create_dir_all(&path).await?;
            }
        } else {
            // Creates parent directories. They may not exist if iteration is out of order
            // or the archive does not contain directory entries.
            let parent = path.parent().ok_or_else(|| anyhow!("no parent"))?;
            if !parent.is_dir() {
                fs::create_dir_all(parent).await?;
            }
            let writer = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .await?;
            futures_lite::io::copy(&mut entry_reader, &mut writer.compat_write()).await?;

            // Closes the file and manipulates its metadata here if you wish to preserve its metadata from the archive.
        }
    }
    Ok(())
}
