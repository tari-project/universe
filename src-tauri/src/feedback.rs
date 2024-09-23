use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::Result;
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
    ) -> zip::result::ZipResult<File> {
        let file_options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Zstd)
            .compression_level(Some(15));

        let file = File::create(archive_file)?;
        let mut zip = ZipWriter::new(file);
        let mut paths_queue: Vec<PathBuf> = vec![];
        paths_queue.push(directory.to_path_buf().clone());

        let mut buffer = Vec::new();
        let log_regex_filter = Regex::new(r"^(.*[0-9]+\.log|.*\.zst)$").unwrap();
        while let Some(next) = paths_queue.pop() {
            let directory_entry_iterator = std::fs::read_dir(next)?;

            for entry in directory_entry_iterator {
                let entry_path = entry?.path();
                let entry_metadata = std::fs::metadata(entry_path.clone())?;

                if entry_metadata.is_file()
                    && !log_regex_filter.is_match(entry_path.file_name().unwrap().to_str().unwrap())
                {
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

        zip.finish()
    }

    pub async fn send_feedback(
        &self,
        feedback_message: String,
        include_logs: bool,
        app_log_dir: Option<PathBuf>,
    ) -> Result<()> {
        if feedback_message.is_empty() {
            return Err(anyhow::anyhow!("Feedback not sent. No message provided"));
        }

        let feedback_url = format!(
            "{}/feedback",
            self.in_memory_config.read().await.airdrop_api_url.clone()
        );

        // Create a multipart form
        let mut form = multipart::Form::new().text("feedback", feedback_message.clone());

        let mut upload_zip_path = None;

        if include_logs {
            let config = self.config.read().await;
            let fallback_dir = config.config_dir().map(|d| d.join("logs"));
            let logs_dir = app_log_dir
                .or(fallback_dir)
                .ok_or_else(|| anyhow::anyhow!("Logs directory not found"))?;
            let app_id = config.anon_id();
            let zip_filename = format!("logs_{}.zst", app_id);
            let archive_file = logs_dir.join(zip_filename.clone());
            upload_zip_path = Some(archive_file.clone());
            self.zip_create_from_directory(&archive_file, &logs_dir)
                .await?;
            let metadata = std::fs::metadata(archive_file.clone())?;
            let file_size = metadata.len();
            info!(target: LOG_TARGET, "Uploading {} ({} bytes)", zip_filename.clone(), file_size);
            let mut file = File::open(archive_file)?;
            let mut file_contents = Vec::new();
            file.read_to_end(&mut file_contents)?;
            form = form.part(
                "logs",
                multipart::Part::bytes(file_contents)
                    .file_name(zip_filename.clone())
                    .mime_str("application/x-compressed")?,
            );
        }

        // Send the POST request
        let client = reqwest::Client::new();
        let response = client.post(feedback_url).multipart(form).send().await?;

        // Delete the ZIP file
        if let Some(archive_file) = upload_zip_path {
            std::fs::remove_file(archive_file)?;
        }
        if response.status().is_success() {
            info!(target: LOG_TARGET, "Feedback sent successfully");
            Ok(())
        } else {
            error!(target: LOG_TARGET, "Failed to upload file: {}", response.status());
            Err(anyhow::anyhow!(
                "Failed to upload file: {}",
                response.status()
            ))
        }
    }
}
