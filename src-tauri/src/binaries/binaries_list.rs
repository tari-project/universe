use std::path::PathBuf;

use semver::Version;
use tauri::api::version;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
    MinotariNode,
    Wallet,
    ShaP2pool,
    GpuMiner,
}

impl Binaries {
    pub fn name(&self) -> &str {
        match self {
            Binaries::Xmrig => "xmrig",
            Binaries::MergeMiningProxy => "mmproxy",
            Binaries::MinotariNode => "minotari_node",
            Binaries::Wallet => "wallet",
            Binaries::ShaP2pool => "sha-p2pool",
            Binaries::GpuMiner => "xtrgpuminer",
        }
    }

    pub fn binary_file_name(&self, version: Version) -> PathBuf {
        match self {
            Binaries::Xmrig => {
                let file_name = format!("xmrig-{}", version);
                PathBuf::from(file_name)
            }
            Binaries::MergeMiningProxy => {
                let file_name = "minotari_merge_mining_proxy";
                PathBuf::from(file_name)
            }
            Binaries::MinotariNode => {
                let file_name = "minotari_node";
                PathBuf::from(file_name)
            }
            Binaries::Wallet => {
                let file_name = "minotari_console_wallet";
                PathBuf::from(file_name)
            }
            Binaries::ShaP2pool => {
                let file_name = "sha_p2pool";
                PathBuf::from(file_name)
            }
            Binaries::GpuMiner => {
                let file_name = "xtrgpuminer";
                PathBuf::from(file_name)
            }
        }
    }

    pub fn iterator() -> impl Iterator<Item = Binaries> {
        [
            Binaries::Xmrig,
            Binaries::MergeMiningProxy,
            Binaries::MinotariNode,
            Binaries::Wallet,
            Binaries::ShaP2pool,
            Binaries::GpuMiner,
        ]
        .iter()
        .copied()
    }
}

pub fn get_binary_path(
    binary: Binaries,
    version_dir: PathBuf,
    version: Version,
) -> Result<PathBuf, anyhow::Error> {
    match binary {
        Binaries::Xmrig => {
            let xmrig_bin = version_dir.join("xmrig");
            Ok(xmrig_bin)
        }
        Binaries::MergeMiningProxy => {
            let mmproxy_bin = version_dir.join("minotari_merge_mining_proxy");
            Ok(mmproxy_bin)
        }
        Binaries::MinotariNode => {
            let minotari_node_bin = version_dir.join("minotari_node");
            Ok(minotari_node_bin)
        }
        Binaries::Wallet => {
            let wallet_bin = version_dir.join("minotari_console_wallet");
            Ok(wallet_bin)
        }
        Binaries::ShaP2pool => {
            let sha_p2pool_bin = version_dir.join("sha_p2pool");
            Ok(sha_p2pool_bin)
        }
        Binaries::GpuMiner => {
            let xtrgpuminer_bin = version_dir.join("xtrgpuminer");
            Ok(xtrgpuminer_bin)
        }
    }
}
