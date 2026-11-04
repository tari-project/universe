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

use anyhow::anyhow;
use minotari_wallet::utils::crypto::{FullEncryptedData, decrypt_data, encrypt_data};
use ring::aead;
use sha2::{Digest, Sha256};
use tari_utilities::SafePassword;
use zeroize::Zeroizing;

// `encrypt_data` draws a 16-byte salt and a 24-byte XChaCha20 nonce; the blob stores both
// ahead of the ciphertext: salt || nonce || ciphertext+tag.
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 24;

fn pin_str(passphrase: &SafePassword) -> Result<&str, anyhow::Error> {
    std::str::from_utf8(passphrase.reveal()).map_err(|_| anyhow!("PIN is not valid UTF-8"))
}

/// Enciphers with an Argon2id key over a fresh salt (minotari's `encrypt_data`, the same
/// scheme that guards the minotari wallet account).
pub fn encrypt(data: &[u8], passphrase: &SafePassword) -> Result<Vec<u8>, anyhow::Error> {
    let encrypted = encrypt_data(data, pin_str(passphrase)?)?;
    if encrypted.salt_bytes.len() != SALT_LEN || encrypted.nonce.len() != NONCE_LEN {
        return Err(anyhow!("Unexpected salt or nonce length from encrypt_data"));
    }
    Ok([encrypted.salt_bytes, encrypted.nonce, encrypted.ciphertext].concat())
}

/// Opens a blob from `encrypt`, or one written before it by `legacy_decrypt`'s scheme.
pub fn decrypt(
    encrypted_data: &[u8],
    passphrase: &SafePassword,
) -> Result<Zeroizing<Vec<u8>>, anyhow::Error> {
    // The legacy check costs one SHA-256, so it goes first and a current blob only pays
    // for Argon2 once.
    if let Ok(plaintext) = legacy_decrypt(encrypted_data, passphrase) {
        return Ok(plaintext);
    }
    if encrypted_data.len() < SALT_LEN + NONCE_LEN {
        return Err(anyhow!("Invalid encrypted data length"));
    }
    let (salt_bytes, rest) = encrypted_data.split_at(SALT_LEN);
    let (nonce, ciphertext) = rest.split_at(NONCE_LEN);
    decrypt_data(
        &FullEncryptedData {
            ciphertext,
            nonce,
            salt_bytes,
        },
        pin_str(passphrase)?,
    )
}

/// The blob re-enciphered by `encrypt` when it still uses the legacy key, `None` when it
/// doesn't (already current, or not openable with this PIN).
pub fn upgrade(
    encrypted_data: &[u8],
    passphrase: &SafePassword,
) -> Result<Option<Vec<u8>>, anyhow::Error> {
    match legacy_decrypt(encrypted_data, passphrase) {
        Ok(plaintext) => encrypt(&plaintext, passphrase).map(Some),
        Err(_) => Ok(None),
    }
}

/// Whether a stored 32-byte seed blob is still on the legacy cipher (nonce12 || ct32 || tag16).
/// Current blobs are 88 bytes and plain seeds 32, so the length alone tells.
pub fn is_legacy_seed_blob(encrypted_data: &[u8]) -> bool {
    encrypted_data.len() == 12 + 32 + 16
}

/// Before GHSA-gr4c-r43w-8pp9 the key was a single unsalted SHA-256 of the PIN, which a
/// 10^6 PIN space can't survive offline. Read-only now: `upgrade` moves these blobs over.
fn legacy_key(passphrase: &SafePassword) -> Zeroizing<[u8; 32]> {
    Zeroizing::new(Sha256::digest(passphrase.reveal()).into())
}

const LEGACY_AAD: &[u8] = b"additional data";

fn legacy_decrypt(
    encrypted_data: &[u8],
    passphrase: &SafePassword,
) -> Result<Zeroizing<Vec<u8>>, anyhow::Error> {
    if encrypted_data.len() < 12 + 16 {
        return Err(anyhow!("Invalid encrypted data length"));
    }
    let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, legacy_key(passphrase).as_ref())
        .map_err(|_| anyhow!("Failed to create unbound key"))?;
    let key = aead::LessSafeKey::new(unbound_key);

    let (nonce_bytes, ciphertext_and_tag) = encrypted_data.split_at(12);
    let nonce = aead::Nonce::try_assume_unique_for_key(nonce_bytes)
        .map_err(|_| anyhow!("Invalid nonce"))?;

    let mut in_out = Zeroizing::new(ciphertext_and_tag.to_vec());
    let plaintext = key
        .open_in_place(nonce, aead::Aad::from(LEGACY_AAD), &mut in_out)
        .map_err(|_| anyhow!("Decryption failed"))?;
    Ok(Zeroizing::new(plaintext.to_vec()))
}

#[cfg(test)]
fn legacy_encrypt(data: &[u8], passphrase: &SafePassword) -> Vec<u8> {
    use ring::rand::{SecureRandom, SystemRandom};
    let key = aead::LessSafeKey::new(
        aead::UnboundKey::new(&aead::AES_256_GCM, legacy_key(passphrase).as_ref()).unwrap(),
    );
    let mut nonce_bytes = [0u8; 12];
    SystemRandom::new().fill(&mut nonce_bytes).unwrap();
    let mut in_out = data.to_vec();
    key.seal_in_place_append_tag(
        aead::Nonce::assume_unique_for_key(nonce_bytes),
        aead::Aad::from(LEGACY_AAD),
        &mut in_out,
    )
    .unwrap();
    [nonce_bytes.to_vec(), in_out].concat()
}

#[test]
fn test_encrypt_decrypt_roundtrip() {
    let data = b"Secret message";
    let pin = SafePassword::from("123456");
    let encrypted = encrypt(data, &pin).expect("Encryption failed");
    let decrypted = decrypt(&encrypted, &pin).expect("Decryption failed");
    assert_eq!(decrypted.as_slice(), data);
}

#[test]
fn test_decrypt_with_wrong_pin_fails() {
    let data = b"Secret message";
    let pin = SafePassword::from("123456");
    let wrong_pin = SafePassword::from("4321");
    let encrypted = encrypt(data, &pin).expect("Encryption failed");
    let result = decrypt(&encrypted, &wrong_pin);
    assert!(result.is_err(), "Decryption should fail with wrong pin");
}

#[test]
fn test_decrypt_with_tampered_ciphertext_fails() {
    let data = b"Secret message";
    let pin = SafePassword::from("123456");
    let mut encrypted = encrypt(data, &pin).expect("Encryption failed");
    let last = encrypted.len() - 1;
    encrypted[last] ^= 0xFF;
    assert!(
        decrypt(&encrypted, &pin).is_err(),
        "Decryption should fail if ciphertext is tampered"
    );
}

#[test]
fn test_new_blobs_are_not_openable_with_the_legacy_key() {
    let pin = SafePassword::from("123456");
    let encrypted = encrypt(&[7u8; 32], &pin).expect("Encryption failed");
    assert!(legacy_decrypt(&encrypted, &pin).is_err());
    assert!(upgrade(&encrypted, &pin).expect("upgrade").is_none());
}

#[test]
fn test_legacy_blob_reads_and_upgrades() {
    let seed = [7u8; 32];
    let pin = SafePassword::from("123456");
    let legacy = legacy_encrypt(&seed, &pin);
    assert_eq!(
        decrypt(&legacy, &pin).expect("legacy read").as_slice(),
        seed
    );

    let upgraded = upgrade(&legacy, &pin)
        .expect("upgrade")
        .expect("legacy blob is upgraded");
    assert!(legacy_decrypt(&upgraded, &pin).is_err());
    assert_eq!(
        decrypt(&upgraded, &pin).expect("current read").as_slice(),
        seed
    );

    let wrong_pin = SafePassword::from("654321");
    assert!(upgrade(&legacy, &wrong_pin).expect("upgrade").is_none());
}

/// Bytes written by the pre-fix build (upstream `encrypt(&[7u8; 32], "123456")`), so a slip that
/// `legacy_encrypt` and `legacy_decrypt` share can't hide behind a round trip.
#[test]
fn test_blob_from_the_pre_fix_build_opens_and_upgrades() {
    let legacy = hex::decode(
        "1e2c517ab28152262a359f2175fae1d1f6e8a20c0048cbcb917d25be767cec26\
         13df33434503a174a5479eb43fbf65e856e89bc585af42522c392b3f",
    )
    .expect("hex");
    let pin = SafePassword::from("123456");
    assert!(is_legacy_seed_blob(&legacy));
    assert_eq!(
        decrypt(&legacy, &pin).expect("legacy read").as_slice(),
        [7u8; 32]
    );
    assert!(upgrade(&legacy, &pin).expect("upgrade").is_some());
    assert!(decrypt(&legacy, &SafePassword::from("654321")).is_err());
}

/// A stored current-format blob must keep opening: the Argon2 parameters come from minotari's
/// defaults and aren't recorded in the blob, so a dependency bump that changes them fails here.
#[test]
fn test_stored_current_blob_still_opens() {
    let current = hex::decode(
        "6a5fcae766212e123ed2867b34d745e8fde8dd91a477f1cf272191749cf6cab1\
         438d17700b693899a5238579ed66537825b78c972ec34853e8acce8cbc371b32\
         48e2cafcc5beb82283e4193172d0ce66d421e509cae572e7",
    )
    .expect("hex");
    let pin = SafePassword::from("123456");
    assert!(!is_legacy_seed_blob(&current));
    assert!(!is_legacy_seed_blob(&[7u8; 32]));
    assert_eq!(
        decrypt(&current, &pin).expect("current read").as_slice(),
        [7u8; 32]
    );
    assert!(upgrade(&current, &pin).expect("upgrade").is_none());
}
