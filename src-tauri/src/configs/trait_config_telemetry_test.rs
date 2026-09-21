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

//! Regression tests for the redaction of secrets in config telemetry and logs.
//!
//! The generic config setters are used for credentials as well as for plain
//! settings, so neither the `config-update-field` telemetry payload nor the
//! debug log line may ever contain the value handed to the setter.

use super::config_core::AirdropTokens;
use super::trait_config::{CONFIG_UPDATE_FIELD_EVENT_NAME, build_config_update_field_event};

const ACCESS_SENTINEL: &str = "access_sentinel";
const REFRESH_SENTINEL: &str = "refresh_sentinel";

fn sentinel_tokens() -> AirdropTokens {
    AirdropTokens {
        token: ACCESS_SENTINEL.to_string(),
        refresh_token: REFRESH_SENTINEL.to_string(),
    }
}

#[test]
fn airdrop_tokens_debug_redacts_both_tokens() {
    let debug_output = format!("{:?}", sentinel_tokens());

    assert!(
        !debug_output.contains(ACCESS_SENTINEL),
        "access token leaked into Debug output: {debug_output}"
    );
    assert!(
        !debug_output.contains(REFRESH_SENTINEL),
        "refresh token leaked into Debug output: {debug_output}"
    );
    assert!(debug_output.contains("REDACTED"), "{debug_output}");
}

#[test]
fn airdrop_tokens_debug_inside_option_redacts_both_tokens() {
    // `update_field` is called with `Option<AirdropTokens>`, so the redaction
    // has to survive being wrapped.
    let debug_output = format!("{:?}", Some(sentinel_tokens()));

    assert!(!debug_output.contains(ACCESS_SENTINEL), "{debug_output}");
    assert!(!debug_output.contains(REFRESH_SENTINEL), "{debug_output}");
}

#[test]
fn airdrop_tokens_still_serialize_round_trip() {
    // Redacting Debug must not affect persistence or what the frontend gets.
    let serialized = serde_json::to_value(sentinel_tokens()).unwrap_or_default();

    assert_eq!(serialized["token"], ACCESS_SENTINEL);
    assert_eq!(serialized["refresh_token"], REFRESH_SENTINEL);
}

#[test]
fn config_update_field_event_omits_the_value() {
    // The exact payload `ConfigImpl::update_field` emits when the airdrop
    // tokens are written.
    let payload = build_config_update_field_event(
        "config_core",
        "tari_universe::configs::config_core::ConfigCoreContent::set_airdrop_tokens",
    );
    let serialized = payload.to_string();

    assert!(
        !serialized.contains(ACCESS_SENTINEL),
        "access token leaked into telemetry payload: {serialized}"
    );
    assert!(
        !serialized.contains(REFRESH_SENTINEL),
        "refresh token leaked into telemetry payload: {serialized}"
    );
    assert!(
        payload.get("value").is_none(),
        "telemetry payload must not carry the setter value: {serialized}"
    );

    // The metadata we do want is still there.
    assert_eq!(payload["config"], "config_core");
    assert_eq!(
        payload["field"],
        "tari_universe::configs::config_core::ConfigCoreContent::set_airdrop_tokens"
    );
    assert_eq!(CONFIG_UPDATE_FIELD_EVENT_NAME, "config-update-field");
}

#[test]
fn config_update_field_event_has_only_metadata_keys() {
    let payload = build_config_update_field_event("config_core", "set_airdrop_tokens");
    let object = payload.as_object().cloned().unwrap_or_default();

    let mut keys: Vec<&str> = object.keys().map(String::as_str).collect();
    keys.sort_unstable();
    assert_eq!(keys, vec!["config", "field"]);
}
