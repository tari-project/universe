use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
    MinotariNode,
    Wallet,
    ShaP2pool,
}

impl Binaries {
    pub fn name(&self) -> &str {
        match self {
            Binaries::Xmrig => "xmrig",
            Binaries::MergeMiningProxy => "mmproxy",
            Binaries::MinotariNode => "minotari_node",
            Binaries::Wallet => "wallet",
            Binaries::ShaP2pool => "sha-p2pool",
        }
    }
    pub fn iterator() -> impl Iterator<Item = Binaries> {
        [
            Binaries::Xmrig,
            Binaries::MergeMiningProxy,
            Binaries::MinotariNode,
            Binaries::Wallet,
            Binaries::ShaP2pool,
        ]
        .iter()
        .copied()
    }
}

pub fn get_binary_path(binary: Binaries, base_dir: PathBuf) -> Result<PathBuf, anyhow::Error> {
    match binary {
        Binaries::Xmrig => {
            let xmrig_bin = base_dir.join("xmrig");
            Ok(xmrig_bin)
        }
        Binaries::MergeMiningProxy => {
            let mmproxy_bin = base_dir.join("minotari_merge_mining_proxy");
            Ok(mmproxy_bin)
        }
        Binaries::MinotariNode => {
            let minotari_node_bin = base_dir.join("minotari_node");
            Ok(minotari_node_bin)
        }
        Binaries::Wallet => {
            let wallet_bin = base_dir.join("minotari_console_wallet");
            Ok(wallet_bin)
        }
        Binaries::ShaP2pool => {
            let sha_p2pool_bin = base_dir.join("sha_p2pool");
            Ok(sha_p2pool_bin)
        }
    }
}
