use crate::ootle::error::{
    Error::{self, IOError},
    IOError::*,
};
use base64::{engine::general_purpose, Engine as _};
use sha2::Digest;
use std::fs::read_dir;
use std::io::Read;
use std::path::PathBuf;
use std::{fs, path::Path};

fn calculate_hash(data: &[u8], sha: usize) -> String {
    match sha {
        224 => format!("{:x}", sha2::Sha224::digest(&data)),
        256 => format!("{:x}", sha2::Sha256::digest(&data)),
        384 => format!("{:x}", sha2::Sha384::digest(&data)),
        512 => format!("{:x}", sha2::Sha512::digest(&data)),
        _ => panic!("Unsupported SHA algorithm: {}", sha),
    }
}

fn read_data(path: &Path, sha: usize) -> Result<String, Error> {
    let mut results = Vec::new();
    if path.is_dir() {
        let paths = read_dir(path).map_err(|_| {
            IOError(FailedToReadDir {
                path: path.to_str().unwrap_or_default().to_string(),
            })
        })?;
        for entry in paths {
            if let Ok(entry) = entry {
                if entry.path().is_file() {
                    if let Ok(mut file) = fs::File::open(&entry.path()) {
                        let entry_path = entry.path();
                        let path_to_file = entry_path.to_str().unwrap_or_default();
                        let mut data = Vec::new();
                        file.read_to_end(&mut data).map_err(|_| {
                            IOError(FailedToReadFile {
                                path: path_to_file.to_string(),
                            })
                        })?;
                        let strout = calculate_hash(&data, sha);
                        results.push(strout + "    " + path_to_file);
                    }
                }
            }
        }
    } else {
        if let Ok(mut file) = fs::File::open(&path) {
            let mut data = Vec::new();
            file.read_to_end(&mut data).map_err(|_| {
                IOError(FailedToReadFile {
                    path: path.to_str().unwrap_or_default().to_string(),
                })
            })?;
            let strout = calculate_hash(&data, sha);
            results.push(strout);
        }
    }
    Ok(results.join("\n"))
}

fn decode_hex(s: &str) -> Result<Vec<u8>, Error> {
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).map_err(|e| Error::IOError(ParseIntError(e))))
        .collect()
}

pub fn calculate_checksum(tapplet_path: PathBuf) -> Result<String, Error> {
    // sha-512
    let sha: usize = 512;
    let tarball_file = tapplet_path.join("tapplet.tar.gz");

    // calculate sha and convert
    let shasum_output = read_data(&tarball_file, sha)?;
    let decoded_shasum = decode_hex(&shasum_output)?;
    let converted_shasum = general_purpose::STANDARD.encode(decoded_shasum);

    // format output to match `integrity` field from manifest.json
    let calculated_integrity = format!("{}{}", "sha512-", converted_shasum.replace("\n", ""));
    Ok(calculated_integrity)
}
