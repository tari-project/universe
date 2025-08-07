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

    /// Check if a server is running
    pub async fn is_running(&self, address: &str) -> bool {
        let servers = self.servers.lock().await;
        servers.contains_key(address)
    }

    /// Add server and associate it with tapplet_id
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

    /// Get the address for a given tapplet_id
    pub async fn get_address(&self, tapplet_id: i32) -> Option<String> {
        let id_map = self.tapplet_id_map.lock().await;
        id_map.get(&tapplet_id).cloned()
    }

    /// Stop a server by tapplet_id (looks up address then cancels)
    pub async fn stop_server_by_id(&self, tapplet_id: i32) -> Result<String, String> {
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

                    // Also remove the tapplet_id -> address mapping:
                    let mut id_map = self.tapplet_id_map.lock().await;
                    id_map.remove(&tapplet_id);

                    Ok(address)
                } else {
                    Err(format!("Server with address {} not found", address))
                }
            }
            None => Err(format!("No server found for tapplet_id {}", tapplet_id)),
        }
    }

    /// Optionally, get the cancel token or server handle for given tapplet_id
    pub async fn get_server_handle_by_id(&self, tapplet_id: i32) -> Option<ServerHandle> {
        let id_map = self.tapplet_id_map.lock().await;
        let servers = self.servers.lock().await;
        id_map
            .get(&tapplet_id)
            .and_then(|address| servers.get(address).cloned())
    }
}
