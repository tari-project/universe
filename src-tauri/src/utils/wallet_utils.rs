use std::env::temp_dir;

use crate::{
    consts::DEFAULT_MONERO_ADDRESS,
    credential_manager::{Credential, CredentialManager},
    APPLICATION_FOLDER_ID,
};
use anyhow::Error;
use dirs::config_dir;
use log::{info, warn};
use monero_address_creator::network::Mainnet;
use monero_address_creator::Seed as MoneroSeed;

static LOG_TARGET: &str = "tari::universe::wallet_utils";

pub async fn create_monereo_address() -> Result<String, Error> {
    let config_dir = config_dir()
        .unwrap_or_else(|| {
            warn!("Failed to get config directory, using temp dir");
            temp_dir()
        })
        .join(APPLICATION_FOLDER_ID);

    let cm = CredentialManager::default_with_dir(config_dir);

    if let Ok(cred) = cm.get_credentials().await {
        if let Some(seed) = cred.monero_seed {
            info!(target: LOG_TARGET, "Found monero seed in credential manager");
            let seed = MoneroSeed::new(seed);
            return Ok(seed
                .to_address::<Mainnet>()
                .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string()));
        }
    }

    let monero_seed = MoneroSeed::generate()?;
    let cred = Credential {
        tari_seed_passphrase: None,
        monero_seed: Some(*monero_seed.inner()),
    };

    info!(target: LOG_TARGET, "Setting monero seed in credential manager");
    cm.set_credentials(&cred).await?;

    Ok(monero_seed
        .to_address::<Mainnet>()
        .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string()))
}
