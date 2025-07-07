use std::{fs::File, path::PathBuf};

use reqwest::Response;

pub fn create_user_agent() -> String {
    let user_agent = format!(
        "universe {}({})",
        env!("CARGO_PKG_VERSION"),
        std::env::consts::OS
    );

    user_agent
}

pub fn convert_content_length_to_mb(content_length: u64) -> f64 {
    (content_length as f64) / 1024.0 / 1024.0
}

#[allow(dead_code)]
pub fn get_etag_from_head_response(response: &Response) -> String {
    if response.status().is_server_error() || response.status().is_client_error() {
        return "".to_string();
    };
    response
        .headers()
        .get("etag")
        .map_or("", |v| v.to_str().unwrap_or_default())
        .to_string()
}

pub fn get_content_length_from_head_response(response: &Response) -> u64 {
    if response.status().is_server_error() || response.status().is_client_error() {
        return 0;
    };
    response
        .headers()
        .get("content-length")
        .map_or(0, |v| v.to_str().unwrap_or_default().parse().unwrap_or(0))
}

pub async fn get_content_size_from_file(path: PathBuf) -> Result<u64, anyhow::Error> {
    let file = File::open(path)?;
    let metadata = file.metadata()?;
    Ok(metadata.len())
}
