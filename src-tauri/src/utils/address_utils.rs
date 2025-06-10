// Copyright 2025. The Tari Project
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

use std::str::FromStr;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};

pub fn verify_tari_address(address: &str) -> Result<TariAddress, String> {
    let tari_address =
        TariAddress::from_str(address).map_err(|_| "Invalid address format".to_string())?;
    if tari_address.network() != Network::get_current_or_user_setting_or_default() {
        return Err("Invalid network".to_string());
    }
    Ok(tari_address)
}

pub fn verify_send(address: String, sending_method: TariAddressFeatures) -> Result<(), String> {
    let tari_address = verify_tari_address(&address)?;

    if !tari_address.features().contains(sending_method) {
        return Err(format!(
            "Address does not support feature {}",
            sending_method
        ));
    }
    Ok(())
}

/// Extracts payment ID from a Tari address if present
/// Returns hex-encoded payment ID for telemetry purposes  
pub fn extract_payment_id(address: &str) -> Result<Option<String>, String> {
    let tari_address = verify_tari_address(address)?;

    // Try to extract payment ID from address
    match tari_address {
        TariAddress::Dual(dual_addr) => {
            // Try to access payment ID through dual address properties
            let payment_id_bytes = dual_addr.get_payment_id_user_data_bytes();
            if !payment_id_bytes.is_empty() {
                return Ok(Some(hex::encode(payment_id_bytes)));
            }
            // If no payment ID, return None for dual addresses without payment ID
            Ok(None)
        }
        _ => {
            // Single addresses don't have payment IDs
            Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used)]

    use super::*;

    const ESME_ONE_SIDED_ADDRESS: &str = "f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g";
    const ESME_INTERACTIVE_ADDRESS: &str = "f45eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF31";
    const ESME_INTERACTIVE_EMOJI_ADDRESS: &str = "🍗🌊😇🦀🚽💈🎠🍚🦂🌕🎩💨👂🏰📜👞🎵🐬🐚💄🚨🔋🐀🐯💻👗🐊👠🦀🐝🚦🍌🎋🎼🍗🎮🎉👗🐮🎨👾🔧🤖💋🐾💨🎃🍀🦂🐀🐬🔱🥝👕🎳⏰🎃🐉💍🙈🍉🔱🎣🐢👒🍊👅";
    const ESME_ONE_SIDED_EMOJI_ADDRESS: &str = "🍗📟😇🦀🚽💈🎠🍚🦂🌕🎩💨👂🏰📜👞🎵🐬🐚💄🚨🔋🐀🐯💻👗🐊👠🦀🐝🚦🍌🎋🎼🍗🎮🎉👗🐮🎨👾🔧🤖💋🐾💨🎃🍀🦂🐀🐬🔱🥝👕🎳⏰🎃🐉💍🙈🍉🔱🎣🐢👒🍊💦";
    const NEXTNET_ONE_SIDED_ADDRESSS: &str = "32FZ9MmtkbcxNwF1Qia1RykS2i3ycaJC5er32xaFi1fpkNKjKvVo6VFPKjoigSME76EmsaDPZLXu2e3ivp5MWSU54j1";

    #[test]
    fn test_verify_tari_address_valid() {
        assert!(verify_tari_address(ESME_ONE_SIDED_ADDRESS).is_ok());
        assert!(verify_tari_address(ESME_INTERACTIVE_ADDRESS).is_ok());
        assert!(verify_tari_address(ESME_INTERACTIVE_EMOJI_ADDRESS).is_ok());
        assert!(verify_tari_address(ESME_ONE_SIDED_EMOJI_ADDRESS).is_ok());
    }

    #[test]
    fn test_verify_tari_address_invalid_format() {
        let result = verify_tari_address("invalid_address");
        assert!(result.is_err());
        match result {
            Err(e) => assert_eq!(e, "Invalid address format"),
            _ => panic!("Expected an error but got success"),
        }
    }

    #[test]
    fn test_verify_tari_address_invalid_network() {
        let result = verify_tari_address(NEXTNET_ONE_SIDED_ADDRESSS);
        assert!(result.is_err());
        match result {
            Err(e) => assert_eq!(e, "Invalid network"),
            _ => panic!("Expected an error but got success"),
        }
    }

    #[test]
    fn test_verify_send_valid() {
        assert!(verify_send(
            ESME_ONE_SIDED_ADDRESS.to_string(),
            TariAddressFeatures::ONE_SIDED,
        )
        .is_ok());
        assert!(verify_send(
            ESME_ONE_SIDED_EMOJI_ADDRESS.to_string(),
            TariAddressFeatures::ONE_SIDED,
        )
        .is_ok());
        assert!(verify_send(
            ESME_INTERACTIVE_ADDRESS.to_string(),
            TariAddressFeatures::ONE_SIDED,
        )
        .is_ok());
        assert!(verify_send(
            ESME_INTERACTIVE_EMOJI_ADDRESS.to_string(),
            TariAddressFeatures::ONE_SIDED,
        )
        .is_ok());
        assert!(verify_send(
            ESME_INTERACTIVE_ADDRESS.to_string(),
            TariAddressFeatures::INTERACTIVE,
        )
        .is_ok());
        assert!(verify_send(
            ESME_INTERACTIVE_EMOJI_ADDRESS.to_string(),
            TariAddressFeatures::INTERACTIVE,
        )
        .is_ok());
    }

    #[test]
    fn test_verify_send_invalid_feature() {
        let sending_method = TariAddressFeatures::INTERACTIVE;
        let result = verify_send(ESME_ONE_SIDED_ADDRESS.to_string(), sending_method);
        assert!(result.is_err());

        match result {
            Err(e) => assert_eq!(e, "Address does not support feature Interactive,"),
            _ => panic!("Expected an error but got success"),
        }
    }

    #[test]
    fn test_extract_payment_id_from_addresses() {
        // Test with addresses - checking what they actually return
        let result = extract_payment_id(ESME_ONE_SIDED_ADDRESS);
        assert!(result.is_ok());
        // These test addresses don't appear to have payment IDs
        assert_eq!(result.unwrap(), None);

        let result = extract_payment_id(ESME_INTERACTIVE_ADDRESS);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);

        // Test with emoji addresses
        let result = extract_payment_id(ESME_ONE_SIDED_EMOJI_ADDRESS);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);

        let result = extract_payment_id(ESME_INTERACTIVE_EMOJI_ADDRESS);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);
    }

    #[test]
    fn test_extract_payment_id_invalid_address() {
        let result = extract_payment_id("invalid_address");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid address format");
    }

    #[test]
    fn test_extract_payment_id_network_mismatch() {
        let result = extract_payment_id(NEXTNET_ONE_SIDED_ADDRESSS);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid network");
    }
}
