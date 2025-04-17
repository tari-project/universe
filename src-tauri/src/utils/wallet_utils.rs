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
