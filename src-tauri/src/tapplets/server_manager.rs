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

use anyhow::Error;
use log::info;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;

const LOG_TARGET: &str = "tari::tapplet";
#[derive(Clone)]
pub struct ServerHandle {
    pub address: String,
    pub cancel_token: CancellationToken,
}

#[derive(Clone)]
pub struct ServerManager {
    servers: Arc<Mutex<HashMap<String, ServerHandle>>>, // address -> server handle
    tapplet_id_map: Arc<Mutex<HashMap<i32, String>>>,   // tapplet_id -> address
}

impl ServerManager {
    pub fn new() -> Self {
        Self {
            servers: Arc::new(Mutex::new(HashMap::new())),
            tapplet_id_map: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn is_running(&self, address: &str) -> bool {
        let servers = self.servers.lock().await;
        servers.contains_key(address)
    }

    pub async fn add_server(
        &self,
        tapplet_id: i32,
        address: String,
        cancel_token: CancellationToken,
    ) {
        let mut servers = self.servers.lock().await;
        let mut id_map = self.tapplet_id_map.lock().await;

        servers.insert(
            address.clone(),
            ServerHandle {
                address: address.clone(),
                cancel_token,
            },
        );
        info!(target: LOG_TARGET, "👉👉👉 add_server {:?} - {:?}", &tapplet_id, address.clone());
        id_map.insert(tapplet_id, address);
    }

    pub async fn get_address(&self, tapplet_id: i32) -> Option<String> {
        let id_map = self.tapplet_id_map.lock().await;
        id_map.get(&tapplet_id).cloned()
    }

    pub async fn stop_server_by_id(&self, tapplet_id: i32) -> Result<String, Error> {
        let address_opt = self.get_address(tapplet_id).await;
        info!(target: LOG_TARGET, "👉👉👉 stop_server_by_id: {:?}", &tapplet_id);

        match address_opt {
            Some(address) => {
                let mut servers = self.servers.lock().await;
                if let Some(handle) = servers.remove(&address) {
                    info!(
                        "Stopping tapplet server with id {} at {}",
                        tapplet_id, address
                    );
                    handle.cancel_token.cancel();

                    let mut id_map = self.tapplet_id_map.lock().await;
                    id_map.remove(&tapplet_id);

                    Ok(address)
                } else {
                    Err(Error::msg(format!(
                        "Server with address {} not found",
                        address
                    )))
                }
            }
            None => Err(Error::msg(format!(
                "No server found for tapplet_id {}",
                tapplet_id
            ))),
        }
    }

    /// Optionally, get the cancel token or server handle for given tapplet_id
    pub async fn _get_server_handle_by_id(&self, tapplet_id: i32) -> Option<ServerHandle> {
        let id_map = self.tapplet_id_map.lock().await;
        let servers = self.servers.lock().await;
        id_map
            .get(&tapplet_id)
            .and_then(|address| servers.get(address).cloned())
    }
}
