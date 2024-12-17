#[cfg(target_os = "windows")]
pub const PROCESS_CREATION_NO_WINDOW: u32 = 0x08000000;

pub const DEFAULT_MONERO_ADDRESS: &str =
    "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A";

// Tari Ootle & Tapplets
pub const TAPPLETS_INSTALLED_DIR: &'static str = "tapplets_installed";
pub const TAPPLETS_ASSETS_DIR: &'static str = "assets";
pub const TAPPLET_ARCHIVE: &'static str = "tapplet.tar.gz";
pub const TAPPLET_DIST_DIR: &'static str = "package/dist";
pub const DB_FILE_NAME: &'static str = "tari_universe.sqlite3";
pub const WALLET_DAEMON_CONFIG_FILE: &'static str = "wallet_daemon.config.toml";
pub const REGISTRY_URL: &'static str =
    "https://raw.githubusercontent.com/karczuRF/tapp-registry/main";
