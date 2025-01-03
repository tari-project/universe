use std::path::PathBuf;

use semver::Version;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
    MinotariNode,
    Wallet,
    ShaP2pool,
    GpuMiner,
    Tor,
    TariValidatorNode,
    TariIndexer,
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
            Binaries::Tor => "tor",
            Binaries::TariValidatorNode => "tari_validator_node",
            Binaries::TariIndexer => "tari_indexer",
        }
    }

    pub fn from_name(name: &str) -> Self {
        match name {
            "xmrig" => Binaries::Xmrig,
            "mmproxy" => Binaries::MergeMiningProxy,
            "minotari_node" => Binaries::MinotariNode,
            "wallet" => Binaries::Wallet,
            "sha-p2pool" => Binaries::ShaP2pool,
            "xtrgpuminer" => Binaries::GpuMiner,
            "tor" => Binaries::Tor,
            "tari_validator_node" => Binaries::TariValidatorNode,
            "tari_indexer" => Binaries::TariIndexer,
            _ => panic!("Unknown binary name: {}", name),
        }
    }

    pub fn binary_file_name(self, version: Version) -> PathBuf {
        match self {
            Binaries::Xmrig => {
                let file_name = format!("xmrig-{}", version);
                PathBuf::from(file_name).join("xmrig")
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
            Binaries::Tor => {
                let file_name = "tor";
                PathBuf::from(file_name)
            }
            Binaries::TariValidatorNode => {
                let file_name = "tari_validator_node";
                PathBuf::from(file_name)
            }
            Binaries::TariIndexer => {
                let file_name = "tari_indexer";
                PathBuf::from(file_name)
            }
        }
    }

    #[allow(dead_code)]
    pub fn iterator() -> impl Iterator<Item = Binaries> {
        [
            Binaries::Xmrig,
            Binaries::MergeMiningProxy,
            Binaries::MinotariNode,
            Binaries::Wallet,
            Binaries::ShaP2pool,
            Binaries::GpuMiner,
            Binaries::Tor,
            Binaries::TariValidatorNode,
            Binaries::TariIndexer,
        ]
        .iter()
        .copied()
    }
}
