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

use crate::ProgressTracker;
use anyhow::{anyhow, Context, Error};
use async_zip::base::read::seek::ZipFileReader;
use flate2::read::GzDecoder;
use futures_util::StreamExt;
use log::{info, warn};
use regex::Regex;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tar::Archive;
use tokio::fs;
use tokio::fs::{File, OpenOptions};
use tokio::io::AsyncReadExt;
use tokio::io::{AsyncWriteExt, BufReader};
use tokio::time::sleep;
use tokio_util::compat::{TokioAsyncReadCompatExt, TokioAsyncWriteCompatExt};

const LOG_TARGET: &str = "tari::universe::download_utils";

pub async fn download_file_with_retries(
    url: &str,
    destination: &Path,
    progress_tracker: ProgressTracker,
) -> Result<(), Error> {
    let mut retries = 0;
    loop {
        match download_file(url, destination, progress_tracker.clone()).await {
            Ok(_) => return Ok(()),
            Err(err) => {
                if retries >= 3 {
                    return Err(err);
                }
                retries += 1;
                warn!(target: LOG_TARGET, "Error downloading file: {}. Try {:?}/3", err, retries);
                progress_tracker
                    .send_last_action(format!(
                        "Failed at retry: {} to download binary from url: {} to destination: {}",
                        retries,
                        url,
                        destination.to_str().unwrap_or("unknown")
                    ))
                    .await;
                sleep(Duration::from_secs(1)).await;
            }
        }
    }
}

async fn download_file(
    url: &str,
    destination: &Path,
    progress_tracker: ProgressTracker,
) -> Result<(), anyhow::Error> {
    let response = reqwest::get(url).await?;

    // Ensure the directory exists
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).await?;
    }

    // Open a file for writing
    let mut dest = File::create(destination).await?;

    // Stream the response body directly to the file
    let mut stream = response.bytes_stream();
    while let Some(item) = stream.next().await {
        let _ = progress_tracker
            .update("downloading".to_string(), None, 10)
            .await;
        dest.write_all(&item?).await?;
    }

    progress_tracker
        .update("download-completed".to_string(), None, 100)
        .await;
    info!(target: LOG_TARGET, "Finished downloading: {}", url);

    Ok(())
}

pub async fn extract(file_path: &Path, dest_dir: &Path) -> Result<(), anyhow::Error> {
    let ext = file_path
        .extension()
        .context("File has no extension")?
        .to_str()
        .context("Cant parse to str")?;
    match ext {
        "gz" => {
            extract_gz(file_path, dest_dir).await?;
        }
        "zip" => {
            extract_zip(file_path, dest_dir).await?;
        }
        _ => {
            return Err(anyhow::anyhow!("Unsupported file extension"));
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

// Taken from async_zip example

fn sanitize_file_path(path: &str) -> PathBuf {
    // Replaces backwards slashes
    path.replace('\\', "/")
        // Sanitizes each component
        .split('/')
        .map(sanitize_filename::sanitize)
        .collect()
}
pub async fn extract_zip(archive: &Path, out_dir: &Path) -> Result<(), anyhow::Error> {
    let archive = BufReader::new(fs::File::open(archive).await?).compat();
    let mut reader = ZipFileReader::new(archive).await?;
    for index in 0..reader.file().entries().len() {
        let entry = reader.file().entries().get(index).ok_or_else(|| {
            anyhow!(
                "The entry at index {} does not exist. The archive may be corrupted.",
                index
            )
        })?;

        let path = entry
            .filename()
            .as_str()
            .map(|entry| out_dir.join(sanitize_file_path(entry)))
            .map_err(|error| {
                anyhow!(
                    "The entry at index {} has an invalid filename: {}",
                    index,
                    error
                )
            })?;

        // If the filename of the entry ends with '/', it is treated as a directory.
        // This is implemented by previous versions of this crate and the Python Standard Library.
        // https://docs.rs/async_zip/0.0.8/src/async_zip/read/mod.rs.html#63-65
        // https://github.com/python/cpython/blob/820ef62833bd2d84a141adedd9a05998595d6b6d/Lib/zipfile.py#L528
        let entry_is_dir = entry.dir().map_err(|error| {
            anyhow!(
                "The entry at index {} has an invalid directory flag: {}",
                index,
                error
            )
        })?;

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

#[cfg(unix)]
pub async fn set_permissions(file_path: &Path) -> Result<(), anyhow::Error> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = fs::metadata(file_path).await?.permissions();
    let current_mode = perms.mode();
    perms.set_mode(current_mode | 0o111);
    fs::set_permissions(file_path, perms).await?;
    Ok(())
}

#[cfg(windows)]
pub async fn set_permissions(_file_path: &Path) -> Result<(), anyhow::Error> {
    Ok(())
}

pub async fn validate_checksum(
    file_path: PathBuf,
    file_sha256_path: PathBuf,
    asset_name: String,
) -> Result<bool, Error> {
    let mut file_sha256 = File::open(file_sha256_path.clone()).await?;
    let mut buffer_sha256 = Vec::new();
    file_sha256.read_to_end(&mut buffer_sha256).await?;
    let contents = String::from_utf8(buffer_sha256).expect("Failed to read file contents as UTF-8");

    // Extract the expected hash for the corresponding asset name
    let mut expected_hash = "";
    let regex = Regex::new(&format!(r"([a-f0-9]+)\s.{}", asset_name))
        .map_err(|e| anyhow!("Failed to create regex: {}", e))?;

    for line in contents.lines() {
        if let Some(caps) = regex.captures(line) {
            expected_hash = caps
                .get(1)
                .map(|hash| hash.as_str())
                .ok_or_else(|| anyhow!("Failed to extract hash from line: {}", line))?;
        }
    }

    let mut file = File::open(file_path.clone()).await?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).await?;

    let mut hasher = Sha256::new();
    hasher.update(&buffer);
    let hash = hasher.finalize();
    let hash_hex = format!("{:x}", hash);

    Ok(hash_hex == expected_hash)
}
