use serde::Deserialize;
use std::fmt::Write as _;
use tari_common::configuration::Network;

fn get_text_explore_blocks_url(network: Network, block_height: u64) -> String {
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

fn get_text_explore_url(network: Network) -> String {
    match network {
        Network::StageNet => "https://textexplore-stagenet.tari.com/?json".to_string(),
        Network::NextNet => "https://textexplore-nextnet.tari.com/?json".to_string(),
        Network::Esmeralda => "https://textexplore-esmeralda.tari.com/?json".to_string(),
        _ => "https://textexplore-esmeralda.tari.com/?json".to_string(),
    }
}

pub(crate) async fn get_best_block_from_block_scan(network: Network) -> Result<u64, anyhow::Error> {
    #[derive(Deserialize)]
    struct BlockScanResponse {
        #[serde(rename = "tipInfo")]
        tip_info: TipInfo,
    }

    #[derive(Deserialize)]
    struct TipInfo {
        metadata: Metadata,
    }

    #[derive(Deserialize)]
    struct Metadata {
        best_block_height: String,
    }

    let response = reqwest::get(&get_text_explore_url(network))
        .await?
        .json::<BlockScanResponse>()
        .await?;

    let best_block_height = response
        .tip_info
        .metadata
        .best_block_height
        .parse::<u64>()?;

    Ok(best_block_height)
}

pub(crate) async fn get_block_info_from_block_scan(
    network: Network,
    block_height: &u64,
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

    let response = reqwest::get(&get_text_explore_blocks_url(network, *block_height))
        .await?
        .json::<BlockResponse>()
        .await?;

    let hash = response
        .header
        .hash
        .data
        .iter()
        .fold(String::new(), |mut acc, x| {
            write!(acc, "{:02x}", x).expect("Unable to write");
            acc
        });
    let height = response.header.height.parse::<u64>()?;

    Ok((height, hash))
}
