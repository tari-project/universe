use std::net::TcpListener;

use serde::Deserialize;
use tari_common::configuration::Network;

pub(crate) fn get_free_port() -> Option<u16> {
    match TcpListener::bind("127.0.0.1:0") {
        Ok(listener) => listener.local_addr().ok().map(|addr| addr.port()),
        Err(_) => None,
    }
}

fn get_text_explore_url(network: Network, block_height: u64) -> String {
    match network {
        Network::StageNet => format!(
            "https://textexplore-stagenet.tari.com/blocks/{}?json",
            block_height
        ),
        Network::NextNet => format!(
            "https://textexplore-nextnet.tari.com/blocks/{}?json",
            block_height
        ),
        Network::Esmeralda => format!(
            "https://textexplore-esmeralda.tari.com/blocks/{}?json",
            block_height
        ),
        _ => format!(
            "https://textexplore-esmeralda.tari.com/blocks/{}?json",
            block_height
        ),
    }
}

pub(crate) async fn get_block_info_from_block_scan(
    network: Network,
    block_height: u64,
) -> Result<(u64, String), anyhow::Error> {
    #[derive(Deserialize)]
    struct BlockHeader {
        hash: HashData,
        height: String,
    }

    #[derive(Deserialize)]
    struct HashData {
        data: Vec<u8>,
    }

    #[derive(Deserialize)]
    struct BlockResponse {
        header: BlockHeader,
    }

    let response = reqwest::get(&get_text_explore_url(network, block_height))
        .await?
        .json::<BlockResponse>()
        .await?;

    let hash = response
        .header
        .hash
        .data
        .iter()
        .map(|x| format!("{:02x}", x))
        .collect::<String>();
    let height = response.header.height.parse::<u64>()?;

    println!("Height: {}, Hash: {}", height, hash);

    Ok((height, hash))
}
