// Copyright 2025. The Tari Project
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

use reqwest::Response;
use tokio::fs::File;

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

pub async fn get_content_size_from_file(file: &File) -> Result<u64, anyhow::Error> {
    let metadata = file
        .metadata()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to get metadata for file: {}", e))?;
    Ok(metadata.len())
}

pub fn create_exponential_timeout(attempt: u32) -> tokio::time::Duration {
    let base_delay = 2; // seconds
    let max_delay = 60; // seconds
    let delay = base_delay * (2_u64.pow(attempt));
    tokio::time::Duration::from_secs(delay.min(max_delay))
}
