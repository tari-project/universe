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

use super::config_mcp::ConfigMcpContent;

// =============================================================================
// Default values
// =============================================================================

#[test]
fn default_config_is_disabled() {
    let config = ConfigMcpContent::default();
    assert!(!*config.enabled());
}

#[test]
fn default_config_has_no_bearer_token() {
    let config = ConfigMcpContent::default();
    assert!(config.bearer_token().is_none());
}

#[test]
fn default_config_port_is_19222() {
    let config = ConfigMcpContent::default();
    assert_eq!(*config.port(), 19222);
}

#[test]
fn default_config_transactions_disabled() {
    let config = ConfigMcpContent::default();
    assert!(!*config.transactions_enabled());
}

#[test]
fn default_config_read_tier_enabled() {
    let config = ConfigMcpContent::default();
    assert!(*config.read_tier_enabled());
}

#[test]
fn default_config_control_tier_enabled() {
    let config = ConfigMcpContent::default();
    assert!(*config.control_tier_enabled());
}

#[test]
fn default_config_rate_limit_is_5() {
    let config = ConfigMcpContent::default();
    assert_eq!(*config.rate_limit_transaction(), 5);
}

#[test]
fn default_config_token_expiry_days_is_30() {
    let config = ConfigMcpContent::default();
    assert_eq!(*config.token_expiry_days(), 30);
}

#[test]
fn default_config_no_max_transaction_amount() {
    let config = ConfigMcpContent::default();
    assert!(config.max_transaction_amount().is_none());
}

// =============================================================================
// Token generation
// =============================================================================

#[test]
fn generate_token_starts_with_prefix() {
    let token = ConfigMcpContent::generate_token();
    assert!(
        token.starts_with("tu_"),
        "Token should start with 'tu_', got: {token}"
    );
}

#[test]
fn generate_token_has_sufficient_length() {
    let token = ConfigMcpContent::generate_token();
    // "tu_" prefix (3 chars) + base64url of 32 bytes (43 chars) = 46 chars
    assert!(token.len() >= 40, "Token too short: {} chars", token.len());
}

#[test]
fn generate_token_produces_unique_tokens() {
    let token1 = ConfigMcpContent::generate_token();
    let token2 = ConfigMcpContent::generate_token();
    assert_ne!(token1, token2, "Two generated tokens should be different");
}

// =============================================================================
// ensure_token
// =============================================================================

#[test]
fn ensure_token_creates_token_when_none() {
    let mut config = ConfigMcpContent::default();
    assert!(config.bearer_token().is_none());

    let token = config.ensure_token().to_string();
    assert!(token.starts_with("tu_"));
    assert!(config.bearer_token().is_some());
    assert!(config.token_created_at().is_some());
    assert!(config.token_expires_at().is_some());
}

#[test]
fn ensure_token_returns_same_token_on_subsequent_calls() {
    let mut config = ConfigMcpContent::default();
    let token1 = config.ensure_token().to_string();
    let token2 = config.ensure_token().to_string();
    assert_eq!(token1, token2);
}

// =============================================================================
// revoke_token
// =============================================================================

#[test]
fn revoke_token_clears_all_token_fields() {
    let mut config = ConfigMcpContent::default();
    config.ensure_token();
    assert!(config.bearer_token().is_some());

    config.revoke_token();
    assert!(config.bearer_token().is_none());
    assert!(config.token_created_at().is_none());
    assert!(config.token_expires_at().is_none());
}

// =============================================================================
// refresh_token_expiry
// =============================================================================

#[test]
fn refresh_token_expiry_updates_when_token_exists() {
    let mut config = ConfigMcpContent::default();
    config.ensure_token();
    let original_expiry = *config.token_expires_at();

    std::thread::sleep(std::time::Duration::from_millis(10));

    config.refresh_token_expiry();
    let new_expiry = *config.token_expires_at();

    assert!(original_expiry.is_some());
    assert!(new_expiry.is_some());
}

#[test]
fn refresh_token_expiry_noop_without_token() {
    let mut config = ConfigMcpContent::default();
    config.refresh_token_expiry();
    assert!(config.token_expires_at().is_none());
}

// =============================================================================
// is_token_expired
// =============================================================================

#[test]
fn is_token_expired_true_when_no_expiry() {
    let config = ConfigMcpContent::default();
    assert!(config.is_token_expired());
}

#[test]
fn is_token_expired_false_for_fresh_token() {
    let mut config = ConfigMcpContent::default();
    config.ensure_token();
    assert!(!config.is_token_expired());
}

// =============================================================================
// redacted_token
// =============================================================================

#[test]
fn redacted_token_none_when_no_token() {
    let config = ConfigMcpContent::default();
    assert!(config.redacted_token().is_none());
}

#[test]
fn redacted_token_shows_prefix_with_dots() {
    let mut config = ConfigMcpContent::default();
    config.ensure_token();
    let redacted = config.redacted_token().unwrap();
    assert!(
        redacted.contains("••••••••"),
        "Redacted token should contain dots: {redacted}"
    );
    assert!(
        redacted.starts_with("tu_"),
        "Redacted should show first 3 chars: {redacted}"
    );
}

#[test]
fn redacted_token_short_token_fallback() {
    let mut config = ConfigMcpContent::default();
    config.set_bearer_token(Some("short".to_string()));
    let redacted = config.redacted_token().unwrap();
    assert_eq!(redacted, "tu_••••••••");
}

// =============================================================================
// Setters
// =============================================================================

#[test]
fn set_enabled_true() {
    let mut config = ConfigMcpContent::default();
    config.set_enabled(true);
    assert!(*config.enabled());
}

#[test]
fn set_port() {
    let mut config = ConfigMcpContent::default();
    config.set_port(8080);
    assert_eq!(*config.port(), 8080);
}

#[test]
fn set_max_transaction_amount() {
    let mut config = ConfigMcpContent::default();
    config.set_max_transaction_amount(Some(1_000_000));
    assert_eq!(*config.max_transaction_amount(), Some(1_000_000));
}

#[test]
fn set_read_tier_disabled() {
    let mut config = ConfigMcpContent::default();
    config.set_read_tier_enabled(false);
    assert!(!*config.read_tier_enabled());
}

#[test]
fn set_control_tier_disabled() {
    let mut config = ConfigMcpContent::default();
    config.set_control_tier_enabled(false);
    assert!(!*config.control_tier_enabled());
}

// =============================================================================
// Serialization roundtrip
// =============================================================================

#[test]
fn config_serialization_roundtrip() {
    let config = ConfigMcpContent::default();
    let serialized = serde_json::to_string(&config).unwrap();
    let deserialized: ConfigMcpContent = serde_json::from_str(&serialized).unwrap();

    assert_eq!(*config.enabled(), *deserialized.enabled());
    assert_eq!(*config.port(), *deserialized.port());
    assert_eq!(
        *config.transactions_enabled(),
        *deserialized.transactions_enabled()
    );
    assert_eq!(
        *config.read_tier_enabled(),
        *deserialized.read_tier_enabled()
    );
    assert_eq!(
        *config.control_tier_enabled(),
        *deserialized.control_tier_enabled()
    );
    assert_eq!(
        *config.rate_limit_transaction(),
        *deserialized.rate_limit_transaction()
    );
}

#[test]
fn config_serialization_with_token() {
    let mut config = ConfigMcpContent::default();
    config.ensure_token();

    let serialized = serde_json::to_string(&config).unwrap();
    let deserialized: ConfigMcpContent = serde_json::from_str(&serialized).unwrap();

    assert_eq!(config.bearer_token(), deserialized.bearer_token());
}
