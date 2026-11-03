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
use log::warn;
use regex::Regex;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::TcpStream,
};

use crate::LOG_TARGET_APP_LOGIC;

const BOOTSTRAP_QUERY: &str = "GETINFO status/bootstrap-phase\r\n";
const CIRCUIT_QUERY: &str = "GETINFO status/circuit-established\r\n";
const NETWORK_QUERY: &str = "GETINFO network-liveness\r\n";

pub(crate) fn control_auth_cookie_path(data_dir: &Path) -> PathBuf {
    data_dir.join("tor-data").join("control_auth_cookie")
}

fn authentication_command(cookie: &[u8]) -> String {
    format!("AUTHENTICATE {}\r\n", hex::encode(cookie))
}

pub(crate) async fn read_authentication_command(
    cookie_path: &Path,
) -> Result<String, anyhow::Error> {
    let cookie = tokio::fs::read(cookie_path).await?;
    if cookie.len() != 32 {
        return Err(anyhow!("Invalid Tor control authentication cookie length"));
    }
    Ok(authentication_command(&cookie))
}

#[derive(Default, Clone, Copy, Debug, Serialize)]
pub(crate) struct TorStatus {
    pub bootstrap_phase: u8,
    pub is_bootstrapped: bool,
    pub network_liveness: bool,
    pub circuit_ok: bool,
}

pub(crate) struct TorControlClient {
    control_port: u16,
    cookie_path: PathBuf,
}

impl TorControlClient {
    pub fn new(control_port: u16, cookie_path: PathBuf) -> Self {
        Self {
            control_port,
            cookie_path,
        }
    }

    pub async fn get_info(&self) -> Result<TorStatus, anyhow::Error> {
        let auth_command = read_authentication_command(&self.cookie_path).await?;
        let stream = TcpStream::connect(format!("127.0.0.1:{}", self.control_port)).await?;
        let (reader, mut writer) = stream.into_split();
        let mut reader = BufReader::new(reader).lines();

        writer.write_all(auth_command.as_bytes()).await?;
        writer.flush().await?;

        let response = reader
            .next_line()
            .await?
            .ok_or_else(|| anyhow!("Tor closed the connection before authentication"))?;
        if response != "250 OK" {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to authenticate with Tor control port");
            return Err(anyhow!("Failed to authenticate with Tor control port"));
        }

        writer.write_all(BOOTSTRAP_QUERY.as_bytes()).await?;
        writer.flush().await?;

        let mut bootstrap_phase = 0;
        let mut bootstrapped = false;

        if let Some(response) = reader.next_line().await? {
            // Expected output 250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"
            let regex = Regex::new(r#"250-status\/bootstrap-phase=NOTICE\s+BOOTSTRAP\s+PROGRESS=(\d+)\s+TAG=(\w+) SUMMARY="([^"]+)""#).expect("If regex is wrong, don't start");
            if let Some(captures) = regex.captures(&response) {
                bootstrap_phase = captures
                    .get(1)
                    .ok_or_else(|| anyhow!("No progress capture in tor bootstrap status"))?
                    .as_str()
                    .parse::<u8>()?;
                bootstrapped = captures
                    .get(3)
                    .ok_or_else(|| anyhow!("No status capture in tor bootstrap status"))?
                    .as_str()
                    == "Done";
                // drop the next line
                let _s250_ok = reader.next_line().await?;
            } else {
                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to parse Tor bootstrap response");
            }
        }

        writer.write_all(CIRCUIT_QUERY.as_bytes()).await?;
        writer.flush().await?;
        let mut circuit_ok = false;
        if let Some(response) = reader.next_line().await? {
            if response.contains("circuit-established=1") {
                circuit_ok = true;
            }
            let _s250_ok = reader.next_line().await?;
        }

        writer.write_all(NETWORK_QUERY.as_bytes()).await?;
        writer.flush().await?;

        let mut network_liveness = false;
        if let Some(response) = reader.next_line().await?
            && response.contains("network-liveness=up")
        {
            network_liveness = true;
        }
        Ok(TorStatus {
            bootstrap_phase,
            is_bootstrapped: bootstrapped,
            network_liveness,
            circuit_ok,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_authenticate_known_cookie_hex_encodes_bytes() {
        assert_eq!(
            authentication_command(&[0xde, 0xad, 0xbe, 0xef]),
            "AUTHENTICATE deadbeef\r\n"
        );
    }

    #[tokio::test]
    async fn test_missing_cookie_does_not_connect() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("test setup succeeds");
        let temp = tempfile::tempdir().expect("test setup succeeds");
        let client = TorControlClient::new(
            listener.local_addr().expect("test setup succeeds").port(),
            temp.path().join("missing"),
        );
        assert!(client.get_info().await.is_err());
        assert!(
            tokio::time::timeout(std::time::Duration::from_millis(20), listener.accept())
                .await
                .is_err()
        );
    }
    #[tokio::test]
    async fn test_get_info_rereads_cookie_after_restart() {
        let temp = tempfile::tempdir().expect("tempdir");
        let cookie_path = temp.path().join("cookie");
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind");
        let client = TorControlClient::new(
            listener.local_addr().expect("addr").port(),
            cookie_path.clone(),
        );
        for byte in [0xab, 0xcd] {
            std::fs::write(&cookie_path, [byte; 32]).expect("write cookie");
            let (result, ()) = tokio::join!(client.get_info(), async {
                let (stream, _) = listener.accept().await.expect("accept");
                let mut reader = BufReader::new(stream);
                let mut line = String::new();
                reader.read_line(&mut line).await.expect("read auth");
                assert_eq!(line, authentication_command(&[byte; 32]));
                reader
                    .get_mut()
                    .write_all(b"250 OK\r\n")
                    .await
                    .expect("auth reply");
                line.clear();
                reader.read_line(&mut line).await.expect("bootstrap query");
                assert_eq!(line, BOOTSTRAP_QUERY);
                reader.get_mut().write_all(b"250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY=\"Done\"\r\n250 OK\r\n").await.expect("bootstrap reply");
                line.clear();
                reader.read_line(&mut line).await.expect("circuit query");
                assert_eq!(line, CIRCUIT_QUERY);
                reader
                    .get_mut()
                    .write_all(b"250-status/circuit-established=1\r\n250 OK\r\n")
                    .await
                    .expect("circuit reply");
                line.clear();
                reader.read_line(&mut line).await.expect("network query");
                assert_eq!(line, NETWORK_QUERY);
                reader
                    .get_mut()
                    .write_all(b"250-network-liveness=up\r\n250 OK\r\n")
                    .await
                    .expect("network reply");
            });
            let status = result.expect("authenticated info");
            assert!(status.is_bootstrapped && status.circuit_ok && status.network_liveness);
        }
    }

    #[tokio::test]
    async fn test_get_info_requires_successful_auth_reply() {
        // The logger is process-wide, so capture logs in a child that runs only this test.
        const CHILD: &str = "TOR_AUTH_LOG_TEST_CHILD";
        if std::env::var_os(CHILD).is_none() {
            let status = std::process::Command::new(std::env::current_exe().expect("test binary"))
                .args([
                    "--exact",
                    "tor_control_client::tests::test_get_info_requires_successful_auth_reply",
                ])
                .env(CHILD, "1")
                .status()
                .expect("run isolated logging test");
            assert!(status.success());
            return;
        }
        struct CapturedLog(std::sync::Mutex<String>);
        impl log::Log for CapturedLog {
            fn enabled(&self, _: &log::Metadata<'_>) -> bool {
                true
            }
            fn log(&self, record: &log::Record<'_>) {
                use std::fmt::Write;
                writeln!(self.0.lock().unwrap(), "{}", record.args()).unwrap();
            }
            fn flush(&self) {}
        }
        static LOG: CapturedLog = CapturedLog(std::sync::Mutex::new(String::new()));
        log::set_logger(&LOG).expect("install test logger");
        log::set_max_level(log::LevelFilter::Warn);
        let temp = tempfile::tempdir().expect("tempdir");
        let cookie_path = temp.path().join("cookie");
        std::fs::write(&cookie_path, [0xab; 32]).expect("write cookie");
        let echoed_secret = format!("515 Rejected AUTHENTICATE {}\r\n", "ab".repeat(32));
        for reply in [echoed_secret.as_bytes(), b"".as_slice()] {
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
                .await
                .expect("bind");
            let client = TorControlClient::new(
                listener.local_addr().expect("addr").port(),
                cookie_path.clone(),
            );
            let (result, ()) = tokio::join!(client.get_info(), async {
                let (stream, _) = listener.accept().await.expect("accept");
                let mut reader = BufReader::new(stream);
                let mut line = String::new();
                reader.read_line(&mut line).await.expect("read auth");
                reader.get_mut().write_all(reply).await.expect("auth reply");
            });
            let error = result.expect_err("authentication must fail").to_string();
            assert!(!error.contains(&"ab".repeat(32)));
        }
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind");
        let client =
            TorControlClient::new(listener.local_addr().expect("addr").port(), cookie_path);
        let (_result, ()) = tokio::join!(client.get_info(), async {
            let (stream, _) = listener.accept().await.expect("accept");
            let mut reader = BufReader::new(stream);
            let mut line = String::new();
            reader.read_line(&mut line).await.expect("read auth");
            reader
                .get_mut()
                .write_all(b"250 OK\r\n")
                .await
                .expect("auth reply");
            line.clear();
            reader.read_line(&mut line).await.expect("bootstrap query");
            reader
                .get_mut()
                .write_all(echoed_secret.as_bytes())
                .await
                .expect("echo reply");
        });
        let captured = LOG.0.lock().unwrap();
        assert!(captured.contains("Failed to parse Tor bootstrap response"));
        assert!(captured.contains("Failed to authenticate"));
        assert!(!captured.contains(&"ab".repeat(32)));
    }

    #[tokio::test]
    async fn test_invalid_cookie_never_authenticates() {
        let temp = tempfile::tempdir().expect("tempdir");
        let cookie_path = temp.path().join("cookie");
        for cookie in [vec![], vec![1; 31], vec![1; 33]] {
            std::fs::write(&cookie_path, cookie).expect("write cookie");
            assert!(read_authentication_command(&cookie_path).await.is_err());
        }
        assert!(read_authentication_command(temp.path()).await.is_err());
    }
}
