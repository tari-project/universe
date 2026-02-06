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

//! Unit tests for internal_wallet.rs pure logic functions.
//!
//! # Test Coverage
//!
//! These tests cover pure logic that doesn't require external dependencies:
//! - TariAddressType enum Display trait and serialization
//! - InternalWallet singleton initialization state checking
//!
//! # Future Mocking Requirements
//!
//! For full coverage of InternalWallet, the following would need to be mocked:
//!
//! ## CredentialManager trait extraction
//! The CredentialManager is instantiated directly via `CredentialManager::new_default()`.
//! To mock this:
//! - Extract a trait `CredentialManagerTrait` with `get_credentials` and `set_credentials` methods
//! - Inject the credential manager as a dependency or use a factory pattern
//! - In tests, provide a mock implementation that returns test credentials
//!
//! ## ConfigWallet singleton reset
//! ConfigWallet uses a static OnceCell pattern similar to InternalWallet.
//! To enable testing:
//! - Add a `#[cfg(test)]` method to reset the singleton state between tests
//! - Or use a test-specific initialization that doesn't persist state
//!
//! ## PinManager dependency injection
//! PinManager is called statically (e.g., `PinManager::get_validated_pin_if_defined`).
//! To mock this:
//! - Extract a trait for PIN operations
//! - Pass the PIN manager as a parameter or use a global test override
//!
//! ## AppHandle mock
//! Many methods require `&tauri::AppHandle` for:
//! - Getting app config directory paths
//! - Event emission via Manager trait
//!
//! To mock this:
//! - Use tauri's test utilities: `tauri::test::mock_app()`
//! - Or extract path resolution into a separate trait that can be mocked
//!
//! ## Static INSTANCE reset
//! The InternalWallet uses a static OnceCell for singleton pattern.
//! For isolation between tests:
//! - Add `#[cfg(test)] pub fn reset_instance()` to clear the OnceCell
//! - Use serial test execution with `serial_test` crate
//! - Or refactor to use dependency injection instead of static singleton

use super::internal_wallet::{InternalWallet, TariAddressType};

#[test]
fn tari_address_type_display_internal() {
    let addr_type = TariAddressType::Internal;
    assert_eq!(format!("{}", addr_type), "Internal");
}

#[test]
fn tari_address_type_display_external() {
    let addr_type = TariAddressType::External;
    assert_eq!(format!("{}", addr_type), "External");
}

#[test]
fn tari_address_type_serialization() {
    let internal = TariAddressType::Internal;
    let external = TariAddressType::External;

    let internal_json = serde_json::to_string(&internal).expect("Failed to serialize Internal");
    let external_json = serde_json::to_string(&external).expect("Failed to serialize External");

    assert_eq!(internal_json, "\"Internal\"");
    assert_eq!(external_json, "\"External\"");
}

#[test]
fn tari_address_type_into_u8() {
    let internal: u8 = TariAddressType::Internal.into();
    let external: u8 = TariAddressType::External.into();

    assert_eq!(internal, 0);
    assert_eq!(external, 1);
}

#[test]
fn internal_wallet_is_initialized_before_set() {
    assert!(
        !InternalWallet::is_initialized(),
        "InternalWallet should not be initialized before set_current is called"
    );
}

#[test]
#[should_panic(expected = "InternalWallet is not initialized")]
fn current_panics_before_initialization() {
    let _ = InternalWallet::current();
}
