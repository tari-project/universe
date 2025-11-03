use anyhow::anyhow;
use regex::Regex;
use reqwest;
use std::time::Instant;

const BASE_URL: &str = "https://speed.cloudflare.com";
const DOWNLOAD_URL: &str = "__down?bytes=";
const UPLOAD_URL: &str = "__up";

pub async fn test_latency() -> Result<f64, anyhow::Error> {
    let client = reqwest::Client::new();
    let url = &format!("{}/{}{}", BASE_URL, DOWNLOAD_URL, 0);
    let builder = client.get(url);

    let start = Instant::now();

    let res = builder.send().await?;
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

pub async fn test_upload(payload_size_bytes: usize) -> Result<f64, anyhow::Error> {
    let client = reqwest::Client::new();
    let url = &format!("{BASE_URL}/{UPLOAD_URL}");
    let payload: Vec<u8> = vec![1; payload_size_bytes];
    let builder = client.post(url).body(payload);

    let start = Instant::now();
    let res = builder.send().await?;
    let duration = start.elapsed();

    if res.status() != reqwest::StatusCode::OK {
        return Err(anyhow!("Failed to send upload response"));
    }
    let mbits = (payload_size_bytes as f64 * 8.0 / 1_000_000.0) / duration.as_secs_f64();
    Ok(mbits)
}

pub async fn test_download(payload_size_bytes: usize) -> Result<f64, anyhow::Error> {
    let client = reqwest::Client::new();
    let url = &format!("{BASE_URL}/{DOWNLOAD_URL}{payload_size_bytes}");
    let builder = client.get(url);

    let start = Instant::now();
    let res = builder.send().await?;
    let duration = start.elapsed();

    if res.status() != reqwest::StatusCode::OK {
        return Err(anyhow!("Failed to send download response"));
    }

    let mbits = (payload_size_bytes as f64 * 8.0 / 1_000_000.0) / duration.as_secs_f64();
    Ok(mbits)
}
