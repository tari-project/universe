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

use anyhow::anyhow;
use regex::Regex;
use reqwest::blocking::Client;
use std::time::Instant;

const BASE_URL: &str = "https://speed.cloudflare.com";
const DOWNLOAD_URL: &str = "__down?bytes=";
const UPLOAD_URL: &str = "__up";

pub fn test_latency() -> Result<f64, anyhow::Error> {
    let client = Client::new();
    let url = &format!("{}/{}{}", BASE_URL, DOWNLOAD_URL, 0);
    let builder = client.get(url);

    let start = Instant::now();
    let res = builder.send()?;
    let duration = start.elapsed().as_secs_f64() * 1_000.0;

    let timing_header = match res.headers().get("Server-Timing") {
        Some(header) => header.to_str(),
        None => Ok("0.0"),
    };

    let re = Regex::new(r"cfRequestDuration;dur=([\d.]+)").map_err(|e| anyhow!(e.to_string()))?;

    let mut cf_req_duration = 0.0;
    if let Some(captures) = re.captures(timing_header.unwrap_or("0.0")) {
        cf_req_duration = captures
            .get(1)
            .ok_or_else(|| anyhow!("No progress capture in tor bootstrap status"))?
            .as_str()
            .parse::<f64>()
            .unwrap_or(0.0);
    }
    let mut req_latency = duration - cf_req_duration;
    if req_latency < 0.0 {
        req_latency = 0.0
    }
    Ok(req_latency)
}

pub fn test_upload(payload_size_bytes: usize) -> Result<f64, anyhow::Error> {
    let client = Client::new();
    let url = &format!("{BASE_URL}/{UPLOAD_URL}");
    let payload: Vec<u8> = vec![1; payload_size_bytes];
    let builder = client.post(url).body(payload);

    let mbits = {
        let start = Instant::now();
        let _res = builder.send()?;
        let duration = start.elapsed().as_secs_f64();

        (payload_size_bytes as f64 * 8.0 / 1_000_000.0) / duration
    };

    Ok(mbits)
}

pub fn test_download(payload_size_bytes: usize) -> Result<f64, anyhow::Error> {
    let client = Client::new();
    let url = &format!("{BASE_URL}/{DOWNLOAD_URL}{payload_size_bytes}");
    let builder = client.get(url);
    let mbits = {
        let start = Instant::now();
        let res = builder.send()?;
        let _res_bytes = res.bytes();
        let duration = start.elapsed().as_secs_f64();

        (payload_size_bytes as f64 * 8.0 / 1_000_000.0) / duration
    };
    Ok(mbits)
}
