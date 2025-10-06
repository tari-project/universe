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

use std::collections::HashMap;
use std::time::Duration;

use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);
const LOG_TARGET: &str = "tari::universe::http_client";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: Option<Value>,
    pub error: Option<String>,
}

pub struct HttpClient {
    client: Client,
}

impl HttpClient {
    pub fn new() -> Result<Self> {
        let client = Client::builder()
            .timeout(DEFAULT_TIMEOUT)
            .user_agent(format!("TariUniverse/{}", env!("CARGO_PKG_VERSION")))
            .build()
            .map_err(|e| anyhow!("Failed to create HTTP client: {}", e))?;

        Ok(Self { client })
    }

    pub async fn request(&self, request: HttpRequest) -> HttpResponse {
        log::debug!(target: LOG_TARGET, "Making HTTP request to: {} {}", request.method, request.url);

        let mut req_builder = match request.method.as_str() {
            "GET" => self.client.get(&request.url),
            "POST" => self.client.post(&request.url),
            "PUT" => self.client.put(&request.url),
            "DELETE" => self.client.delete(&request.url),
            "PATCH" => self.client.patch(&request.url),
            _ => {
                return HttpResponse {
                    status: 400,
                    headers: HashMap::new(),
                    body: None,
                    error: Some(format!("Unsupported HTTP method: {}", request.method)),
                }
            }
        };

        // Add headers
        if let Some(headers) = request.headers {
            for (key, value) in headers {
                req_builder = req_builder.header(&key, &value);
            }
        }

        // Add body for POST/PUT/PATCH requests
        if let Some(body) = request.body {
            req_builder = req_builder.json(&body);
        }

        match req_builder.send().await {
            Ok(response) => {
                let status = response.status().as_u16();
                
                // Extract headers
                let mut response_headers = HashMap::new();
                for (key, value) in response.headers() {
                    if let Ok(value_str) = value.to_str() {
                        response_headers.insert(key.to_string(), value_str.to_string());
                    }
                }

                // Extract body
                let body = match response.text().await {
                    Ok(text) => {
                        if text.is_empty() {
                            None
                        } else {
                            match serde_json::from_str::<Value>(&text) {
                                Ok(json) => Some(json),
                                Err(_) => Some(Value::String(text)),
                            }
                        }
                    }
                    Err(e) => {
                        log::error!(target: LOG_TARGET, "Failed to read response body: {}", e);
                        None
                    }
                };

                HttpResponse {
                    status,
                    headers: response_headers,
                    body,
                    error: None,
                }
            }
            Err(e) => {
                log::error!(target: LOG_TARGET, "HTTP request failed: {}", e);
                HttpResponse {
                    status: 0,
                    headers: HashMap::new(),
                    body: None,
                    error: Some(e.to_string()),
                }
            }
        }
    }
}

impl Default for HttpClient {
    fn default() -> Self {
        Self::new().expect("Failed to create default HTTP client")
    }
}
