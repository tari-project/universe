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

use crate::app_config::AppConfig;
use crate::app_in_memory_config::AppInMemoryConfig;
use crate::utils::file_utils::{make_relative_path, path_as_string};

const LOG_TARGET: &str = "tari::universe::feedback";

pub struct Feedback {
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    config: Arc<RwLock<AppConfig>>,
}

impl Feedback {
    pub fn new(
        in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        config: Arc<RwLock<AppConfig>>,
    ) -> Self {
        Self {
            in_memory_config,
            config,
        }
    }

    /// Build zip file
    pub async fn zip_create_from_directory(
        &self,
        archive_file: &Path,
        directory: &Path,
    ) -> Result<zip::result::ZipResult<File>, Error> {
        let file_options = SimpleFileOptions::default();

        let file = File::create(archive_file)?;
        let mut zip = ZipWriter::new(file);
        let mut paths_queue: Vec<PathBuf> = vec![];
        paths_queue.push(directory.to_path_buf().clone());

        let mut buffer = Vec::new();

        let log_regex_filter = Regex::new(r"^(.*[0-9]+\.log|.*\.zip)$")
            .map_err(|e| anyhow!("Failed to create log file filter: {}", e))?;

        while let Some(next) = paths_queue.pop() {
            let directory_entry_iterator = std::fs::read_dir(next)?;

            for entry in directory_entry_iterator {
                let entry_path = entry?.path();
                let entry_metadata = std::fs::metadata(entry_path.clone())?;
                let entry_file_name_as_str = entry_path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .ok_or_else(|| anyhow::anyhow!("Failed to get file name"))?;

                if entry_metadata.is_file() && !log_regex_filter.is_match(entry_file_name_as_str) {
                    let mut f = File::open(&entry_path)?;
                    f.read_to_end(&mut buffer)?;
                    let relative_path = make_relative_path(directory, &entry_path);
                    zip.start_file(path_as_string(&relative_path), file_options)?;
                    zip.write_all(buffer.as_ref())?;
                    buffer.clear();
                } else if entry_metadata.is_dir() {
                    let relative_path = make_relative_path(directory, &entry_path);
                    zip.add_directory(path_as_string(&relative_path), file_options)?;
                    paths_queue.push(entry_path.clone());
                } else {
                    // Skip log files
                }
            }
        }

        Ok(zip.finish())
    }

    async fn archive_path(&self, logs_dir: &Path) -> Result<(PathBuf, String)> {
        let config = self.config.read().await;
        let zip_filename = format!("logs_{}.zip", config.anon_id());
        let archive_file = logs_dir.join(zip_filename.clone());
        let _unused = self
            .zip_create_from_directory(&archive_file, logs_dir)
            .await?;
        Ok((archive_file.to_path_buf(), zip_filename))
    }
    pub async fn send_feedback(
        &self,
        feedback_message: String,
        include_logs: bool,
        app_log_dir: Option<PathBuf>,
    ) -> Result<String> {
        if feedback_message.is_empty() {
            return Err(anyhow::anyhow!("Feedback not sent. No message provided"));
        }

        let feedback_url = format!(
            "{}/feedback",
            self.in_memory_config.read().await.airdrop_api_url.clone()
        );

        // Create a multipart form
        let app_id = self.config.read().await.anon_id().to_string();
        let mut form = multipart::Form::new()
            .text("feedback", feedback_message.clone())
            .text("appId", app_id.clone());

        let upload_zip_path = if include_logs {
            let logs_dir = &app_log_dir.ok_or(anyhow::anyhow!("Missing log directory"))?;
            let (archive_file, zip_filename) = self.archive_path(logs_dir).await?;
            let _unused = self
                .zip_create_from_directory(&archive_file, logs_dir)
                .await?;
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

        let jwt = self
            .in_memory_config
            .read()
            .await
            .airdrop_access_token
            .clone();

        // Send the POST request
        let mut req = reqwest::Client::new().post(feedback_url).multipart(form);
        if let Some(jwt) = jwt {
            req = req.header("Authorization", format!("Bearer {}", jwt));
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
