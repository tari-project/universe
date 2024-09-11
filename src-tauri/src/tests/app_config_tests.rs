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
            "auto_mining": true
        }
        "#;

        let mut config = AppConfig::new();

        config.apply_loaded_config(config_json.to_string());

        assert_eq!(config.mode(), MiningMode::Eco);
        // it doesn't affect auto_mining value saved in the config
        assert_eq!(config.auto_mining(), true);
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
                "auto_mining": false,
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
        assert_eq!(config.auto_mining(), false);
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
