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
use ring::{
    aead,
    rand::{SecureRandom, SystemRandom},
};
use sha2::{Digest, Sha256};
use tari_utilities::SafePassword;

fn derive_key(passphrase: &SafePassword) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(passphrase.reveal());
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    key
}

pub fn encrypt(data: &[u8], passphrase: &SafePassword) -> Result<Vec<u8>, anyhow::Error> {
    let key_bytes = derive_key(passphrase);
    let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key_bytes)
        .map_err(|_| anyhow!("Failed to create unbound key"))?;
    let key = aead::LessSafeKey::new(unbound_key);

    let mut nonce_bytes = [0u8; 12];
    let rng = SystemRandom::new();
    rng.fill(&mut nonce_bytes)
        .map_err(|_| anyhow!("Failed to generate nonce"))?;
    let nonce = aead::Nonce::assume_unique_for_key(nonce_bytes);

    let aad = aead::Aad::from(b"additional data");

    let mut in_out = data.to_vec(); // Do NOT resize here!
    key.seal_in_place_append_tag(nonce, aad, &mut in_out)
        .map_err(|_| anyhow!("Encryption failed"))?;

    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&in_out); // in_out is now ciphertext + tag
    Ok(result)
}

pub fn decrypt(encrypted_data: &[u8], passphrase: &SafePassword) -> Result<Vec<u8>, anyhow::Error> {
    if encrypted_data.len() < 12 + 16 {
        return Err(anyhow!("Invalid encrypted data length"));
    }
    let key_bytes = derive_key(passphrase);
    let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key_bytes)
        .map_err(|_| anyhow!("Failed to create unbound key"))?;
    let key = aead::LessSafeKey::new(unbound_key);

    let (nonce_bytes, ciphertext_and_tag) = encrypted_data.split_at(12);
    let nonce = aead::Nonce::try_assume_unique_for_key(nonce_bytes)
        .map_err(|_| anyhow!("Invalid nonce"))?;
    let aad = aead::Aad::from(b"additional data");

    let mut in_out = ciphertext_and_tag.to_vec();
    let plaintext = key
        .open_in_place(nonce, aad, &mut in_out)
        .map_err(|_| anyhow!("Decryption failed"))?;
    Ok(plaintext.to_vec())
}

#[test]
fn test_encrypt_decrypt_roundtrip() {
    let data = b"Secret message";
    let pin = SafePassword::from("123456");
    let encrypted = encrypt(data, &pin).expect("Encryption failed");
    let decrypted = decrypt(&encrypted, &pin).expect("Decryption failed");
    assert_eq!(decrypted, data);
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
    // Tamper with the ciphertext
    if let Some(byte) = encrypted.get_mut(20) {
        *byte ^= 0xFF;
    }
    let result = decrypt(&encrypted, &pin);
    assert!(
        result.is_err(),
        "Decryption should fail if ciphertext is tampered"
    );
}
