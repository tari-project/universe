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

use crate::requests::utils::create_user_agent;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use serde::Deserialize;
use tari_common::configuration::Network;

fn create_client() -> Result<reqwest::Client, anyhow::Error> {
    let agent = create_user_agent();
    let mut headers = HeaderMap::new();
    headers.insert(
        HeaderName::from_static("x-requested-with"),
        HeaderValue::from_str(&agent).unwrap_or(HeaderValue::from_static("tari-universe")),
    );

    let client = reqwest::Client::builder()
        .user_agent(agent)
        .default_headers(headers)
        .build()?;

    Ok(client)
}

fn get_text_explore_blocks_url(network: Network, block_height: u64) -> String {
    match network {
        Network::MainNet => {
            format!("https://textexplore.tari.com/blocks/{block_height}/header")
        }
        _ => format!(
            "https://textexplore-{}.tari.com/blocks/{}/header",
            network.as_key_str(),
            block_height
        ),
    }
}

fn get_text_explore_url(network: Network) -> String {
    match network {
        Network::MainNet => "https://textexplore.tari.com/tip/height".to_string(),
        _ => format!(
            "https://textexplore-{}.tari.com/tip/height",
            network.as_key_str()
        ),
    }
}

pub(crate) async fn get_best_block_from_block_scan(network: Network) -> Result<u64, anyhow::Error> {
    #[derive(Deserialize)]
    struct BlockScanResponse {
        height: u64,
    }

    let client = create_client()?;
    let response = client.get(get_text_explore_url(network)).send().await?;
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(anyhow::anyhow!("Block scan API not found"));
    }
    let response = response.json::<BlockScanResponse>().await?;

    Ok(response.height)
}

pub(crate) async fn get_block_info_from_block_scan(
    network: Network,
    block_height: &u64,
) -> Result<(u64, String), anyhow::Error> {
    #[derive(Deserialize)]
    struct BlockResponse {
        height: u64,
        hash: String,
    }

    let client = create_client()?;
    let response = client
        .get(get_text_explore_blocks_url(network, *block_height))
        .send()
        .await?;
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(anyhow::anyhow!(
            "Block {} not found on block scan",
            block_height
        ));
    }
    let response = response.json::<BlockResponse>().await?;

    Ok((response.height, response.hash))
}
