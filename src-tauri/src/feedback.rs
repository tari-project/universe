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

use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{anyhow, Error, Result};
use log::{error, info};
use regex::Regex;
use reqwest::multipart;
use tokio::sync::RwLock;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::app_in_memory_config::AppInMemoryConfig;
use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::utils::file_utils::{make_relative_path, path_as_string};

const LOG_TARGET: &str = "tari::universe::feedback";
const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024; // 100MB in bytes
pub struct Feedback {
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
}

impl Feedback {
    pub fn new(in_memory_config: Arc<RwLock<AppInMemoryConfig>>) -> Self {
        Self { in_memory_config }
    }

    pub async fn zip_create_from_directories(
        &self,
        archive_file: &Path,
        directories_and_filters: &[(PathBuf, Regex, String)],
    ) -> Result<zip::result::ZipResult<File>, Error> {
        let file_options = SimpleFileOptions::default();

        let _zip_file_name = archive_file
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| anyhow::anyhow!("Failed to get zip file name"))?;

        let file = File::create(archive_file)?;
        let zip_file_name = archive_file
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| anyhow!("Failed to get archive file name"))?;

        let mut zip = ZipWriter::new(file);
        let mut buffer = Vec::new();

        for (directory, regex_filter, folder_name) in directories_and_filters {
            if !directory.exists() {
                continue; // Skip non-existent directories
            }

            let mut paths_queue: Vec<PathBuf> = vec![];
            paths_queue.push(directory.to_path_buf());

            while let Some(next) = paths_queue.pop() {
                let directory_entry_iterator = std::fs::read_dir(next)?;

                for entry in directory_entry_iterator {
                    let entry_path = entry?.path();
                    let entry_metadata = std::fs::metadata(entry_path.clone())?;
                    let entry_file_name_as_str = entry_path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .ok_or_else(|| anyhow::anyhow!("Failed to get file name"))?;

                    if entry_metadata.is_file()
                        && regex_filter.is_match(entry_file_name_as_str)
                        && !entry_file_name_as_str.eq(zip_file_name)
                    {
                        // Skip files larger than 100MB
                        if entry_metadata.len() > MAX_FILE_SIZE {
                            info!(target: LOG_TARGET, "Skipping file {} (size: {} bytes) - exceeds 100MB limit",
                                  entry_file_name_as_str, entry_metadata.len());
                            continue;
                        }

                        let mut f = File::open(&entry_path)?;
                        f.read_to_end(&mut buffer)?;
                        let relative_path = make_relative_path(directory, &entry_path);
                        let prefixed_path =
                            format!("{}/{}", folder_name, path_as_string(&relative_path));
                        zip.start_file(prefixed_path, file_options)?;
                        zip.write_all(buffer.as_ref())?;
                        buffer.clear();
                    } else if entry_metadata.is_dir() {
                        let relative_path = make_relative_path(directory, &entry_path);
                        let prefixed_path =
                            format!("{}/{}", folder_name, path_as_string(&relative_path));
                        zip.add_directory(prefixed_path, file_options)?;
                        paths_queue.push(entry_path.clone());
                    } else {
                        info!(target: LOG_TARGET, "Skipping file {} - does not match filter",
                              entry_file_name_as_str);
                    }
                }
            }
        }

        Ok(zip.finish())
    }

    async fn archive_path(&self, logs_dir: &Path, config_dir: &Path) -> Result<(PathBuf, String)> {
        let anon_id = ConfigCore::content().await.anon_id().clone();
        let zip_filename = format!("logs_config_{}.zip", anon_id.clone());
        let archive_file = logs_dir.join(zip_filename.clone());

        // Create regex filters for different file types
        let log_regex_filter = Regex::new(r"^(.*[0-9]*\.log|.*\.zip)$")
            .map_err(|e| anyhow!("Failed to create log file filter: {}", e))?;
        let config_regex_filter =
            Regex::new(r"^(.*\.toml|.*\.json|.*\.yaml|.*\.yml|.*\.ini|.*\.conf|.*\.config)$")
                .map_err(|e| anyhow!("Failed to create config file filter: {}", e))?;

        let directories_and_filters = vec![
            (logs_dir.to_path_buf(), log_regex_filter, "logs".to_string()),
            (
                config_dir.to_path_buf(),
                config_regex_filter,
                "configs".to_string(),
            ),
        ];

        let _unused = self
            .zip_create_from_directories(&archive_file, &directories_and_filters)
            .await?;
        Ok((archive_file.to_path_buf(), zip_filename))
    }
    pub async fn send_feedback(
        &self,
        feedback_message: String,
        include_logs: bool,
        app_log_dir: PathBuf,
        app_config_dir: PathBuf,
    ) -> Result<String> {
        if feedback_message.is_empty() {
            return Err(anyhow::anyhow!("Feedback not sent. No message provided"));
        }

        let feedback_url = format!(
            "{}/feedback",
            self.in_memory_config.read().await.airdrop_api_url.clone()
        );

        // Create a multipart form
        let anon_id = ConfigCore::content().await.anon_id().clone();
        let mut form = multipart::Form::new()
            .text("feedback", feedback_message.clone())
            .text("appId", anon_id.clone());

        let upload_zip_path = if include_logs {
            let (archive_file, zip_filename) =
                self.archive_path(&app_log_dir, &app_config_dir).await?;
            let metadata = std::fs::metadata(&archive_file)?;
            let file_size = metadata.len();
            info!(target: LOG_TARGET, "Uploading {} ({} bytes)", zip_filename.clone(), file_size);
            let mut file = File::open(&archive_file)?;
            let mut file_contents = Vec::new();
            file.read_to_end(&mut file_contents)?;
            form = form.part(
                "logs",
                multipart::Part::bytes(file_contents)
                    .file_name(zip_filename.clone())
                    .mime_str("application/x-compressed")?,
            );
            Some(archive_file)
        } else {
            None
        };

        let airdrop_tokens = ConfigCore::content().await.airdrop_tokens().clone();
        let jwt = airdrop_tokens.map(|tokens| tokens.token);

        // Send the POST request
        let mut req = reqwest::Client::new().post(feedback_url).multipart(form);
        if let Some(jwt) = jwt {
            req = req.header("Authorization", format!("Bearer {jwt}"));
        }
        let response = req.send().await?;

        // Delete the ZIP file
        if let Some(archive_file) = upload_zip_path {
            std::fs::remove_file(archive_file)?;
        }
        if response.status().is_success() {
            info!(target: LOG_TARGET, "Feedback sent successfully");
            Ok(response.text().await?)
        } else {
            error!(target: LOG_TARGET, "Failed to upload file: {}", response.status());
            Err(anyhow::anyhow!(
                "Failed to upload file: {}",
                response.status()
            ))
        }
    }
}
