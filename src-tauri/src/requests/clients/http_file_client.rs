use std::path::PathBuf;

use tokio::sync::watch;

struct FileClientConfig {
    progress_status_sender: Option<watch::Sender<f64>>,
    should_extract: bool,
    should_use_range_header: bool,
    should_check_cloudflare_cache: bool,
}
struct FileClientBuilder {
    config: FileClientConfig,
}

impl FileClientBuilder {
    pub fn new() -> Self {
        FileClientBuilder {
            config: FileClientConfig {
                progress_status_sender: None,
                should_extract: false,
                should_use_range_header: false,
                should_check_cloudflare_cache: false,
            },
        }
    }

    pub fn with_progress_status_sender(mut self, sender: watch::Sender<f64>) -> Self {
        self.config.progress_status_sender = Some(sender);
        self
    }

    pub fn with_file_extract(mut self) -> Self {
        self.config.should_extract = true;
        self
    }

    pub fn with_download_resume(mut self) -> Self {
        self.config.should_use_range_header = true;
        self
    }

    pub fn with_cloudflare_cache_check(mut self) -> Self {
        self.config.should_check_cloudflare_cache = true;
        self
    }

    pub fn build(self, url: String, destination: PathBuf) -> FileClient {
        FileClient {
            url,
            destination,
            config: FileClientConfig {
                progress_status_sender: self.config.progress_status_sender,
                should_extract: self.config.should_extract,
                should_use_range_header: self.config.should_use_range_header,
                should_check_cloudflare_cache: self.config.should_check_cloudflare_cache,
            },
        }
    }
}

pub struct FileClient {
    url: String,
    destination: PathBuf,
    config: FileClientConfig,
}

impl FileClient {
    pub fn builder() -> FileClientBuilder {
        FileClientBuilder::new()
    }

    // This will be main entry point for the file client with all of the logic
    // First step is to check cloudflare cache if enabled
    // Second send head request to get content metadata
    // Then either use default flow or resume flow based on the configuration and file state
    // Verify file integrity if needed
    // Extract file if config is set to do so
    // Finally return the file path
    pub async fn execute(&self) -> Result<PathBuf, String> {
        Ok(())
    }

    pub async fn handle_default_flow(&self) -> Result<(), String> {
        // Implement the default flow logic here
        Ok(())
    }

    pub async fn handle_resume_flow(&self) -> Result<(), String> {
        // Implement the resume flow logic here
        Ok(())
    }

    pub async fn download(&self) -> Result<(), String> {
        // Implement the download logic here
        Ok(())
    }

    pub async fn download_with_resume(&self, start: u64, end: u64) -> Result<(), String> {
        // Implement the download with resume logic here
        Ok(())
    }

    // It should extract file if the configuration is set to do so and file extension is supported
    // Then delete the original file
    pub async fn extract(&self) -> Result<(), String> {
        // Implement the extraction logic here
        Ok(())
    }
}
