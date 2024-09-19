use std::fs::File;
use std::io::Read;
use std::sync::Arc;

use anyhow::Result;
use log::{debug, error, info};
use reqwest::multipart;
use tokio::sync::RwLock;
use zip::ZipWriter;
use zip_extensions::write::ZipWriterExtensions;

use crate::app_config::AppConfig;
use crate::app_in_memory_config::AppInMemoryConfig;

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

    pub async fn send_feedback(&self, feedback_message: String, include_logs: bool) -> Result<()> {
        let feedback_url = format!(
            "{}/feedback",
            self.in_memory_config.read().await.airdrop_api_url.clone()
        );

        let mut upload_zip_path = None;
        let config = self.config.read().await;
        let app_id = config.anon_id();
        let zip_filename = format!("logs_{}.zip", app_id);
        if include_logs {
            if let Some(config_dir) = config.config_dir() {
                let logs_dir = config_dir.join("logs");
                // Zip all the logs
                let zip_file = config_dir.join(zip_filename.clone());
                let file = File::create(zip_file.clone())?;
                let zip = ZipWriter::new(file);
                zip.create_from_directory(&logs_dir)?;
                upload_zip_path = Some(zip_file);
            }
        }

        if (feedback_message.is_empty() && upload_zip_path.is_none()) || feedback_url.is_empty() {
            info!(target: LOG_TARGET, "Feedback not sent. No message or URL provided");
            return Ok(());
        }

        // Create a multipart form
        let mut form = multipart::Form::new().text("feedback", feedback_message.clone());
        if let Some(zip_file) = &upload_zip_path {
            let mut file = File::open(zip_file)?;
            let mut file_contents = Vec::new();
            file.read_to_end(&mut file_contents)?;
            form = form.part(
                "logs",
                multipart::Part::bytes(file_contents)
                    .file_name(zip_filename)
                    .mime_str("application/zip")?,
            );
        }
        // Send the POST request
        let client = reqwest::Client::new();
        let response = client.post(feedback_url).multipart(form).send().await?;

        if response.status().is_success() {
            debug!(target: LOG_TARGET, "Feedback sent successfully");
        } else {
            error!(target: LOG_TARGET, "Failed to upload file: {}", response.status());
        }
        // Delete the ZIP file
        if let Some(zip_file) = upload_zip_path {
            std::fs::remove_file(zip_file)?;
        }
        Ok(())
    }
}
