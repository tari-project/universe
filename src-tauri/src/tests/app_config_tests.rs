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

#[cfg(test)]
mod tests {
    use std::time::{Duration, SystemTime};

    use crate::{
        app_config::{AppConfig, MiningMode},
        consts::DEFAULT_MONERO_ADDRESS,
    };

    #[test]
    fn test_apply_config_legacy() {
        let config_json = r#"
        {
            "version": 0,
        }
        "#;

        let mut config = AppConfig::new();

        config.apply_loaded_config(config_json.to_string());

        assert_eq!(config.mode(), MiningMode::Eco);
        assert_eq!(config.p2pool_enabled(), false);
        assert_ne!(format!("{:?}", config.last_binaries_update_timestamp()), "");
        assert_eq!(config.allow_telemetry(), false);
        assert_eq!(config.anon_id().len(), 20);
        assert_eq!(config.monero_address(), DEFAULT_MONERO_ADDRESS.to_string());
        assert_eq!(config.gpu_mining_enabled(), true);
        assert_eq!(config.cpu_mining_enabled(), true);
    }

    #[test]
    fn test_apply_config_up_to_date() {
        let config_json = r#"
            {
                "mode": "Ludicrous",
                "p2pool_enabled": true,
                "last_binaries_update_timestamp": {
                    "secs_since_epoch": 1725545367,
                    "nanos_since_epoch": 379078628
                },
                "allow_telemetry": true,
                "anon_id": "5GGl^0NQiChrGMsjYXs5",
                "monero_address": "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A",
                "gpu_mining_enabled": true,
                "cpu_mining_enabled": true
            }
        "#;

        let mut config = AppConfig::new();

        config.apply_loaded_config(config_json.to_string());

        assert_eq!(config.mode(), MiningMode::Ludicrous);
        // For now always false by default
        assert_eq!(config.p2pool_enabled(), false);
        let expected_timestamp = SystemTime::UNIX_EPOCH + Duration::new(1725545367, 379078628);
        assert_eq!(config.last_binaries_update_timestamp(), expected_timestamp);
        assert_eq!(config.allow_telemetry(), true);
        assert_eq!(config.anon_id(), "5GGl^0NQiChrGMsjYXs5");
        assert_eq!(
            config.monero_address(),
            "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A"
        );
        assert_eq!(config.gpu_mining_enabled(), true);
        assert_eq!(config.cpu_mining_enabled(), true);
    }
}
