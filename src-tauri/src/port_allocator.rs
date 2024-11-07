use std::{collections::HashSet, sync::LazyLock};
use std::net::TcpListener;
use anyhow::{Error,anyhow};
use log::{error, info, warn};
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::systemtray_manager";
static INSTANCE: LazyLock<RwLock<PortAllocator>> =
    LazyLock::new(|| RwLock::new(PortAllocator::new()));

const ADDRESS: &str = "127.0.0.1";

pub struct PortAllocator {
    used_ports: HashSet<u16>,
}

impl PortAllocator {
    pub fn new() -> Self {
        Self {
            used_ports: HashSet::new(),
        }
    }

    pub fn current() -> &'static RwLock<PortAllocator> {
        &INSTANCE
    }

    fn get_address_with_0_port(&self) -> String {
        format!("{}:0", ADDRESS)
    }

    fn get_port(&self) -> Result<u16, Error> {
        match TcpListener::bind(self.get_address_with_0_port()) {
            Ok(listener) => {
                let port = listener.local_addr().ok().map(|addr| addr.port()).ok_or_else(|| anyhow!("Failed to get port"))?;
                Ok(port)
            },
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to bind to port: {:?}", e);
                Err(anyhow!("Failed to bind to port"))
            }
        }
    }

    fn check_if_port_is_free(&self, port: u16) -> bool {
        match TcpListener::bind(format!("{}:{}", ADDRESS, port)) {
            Ok(_) => self.used_ports.contains(&port),
            Err(_) => false,
        }
    }

    pub fn assign_port(&mut self) -> Result<u16, Error> {
        let mut port = self.get_port()?;
        while self.check_if_port_is_free(port) {
            port = self.get_port()?;
        }
        self.used_ports.insert(port);
        info!(target: LOG_TARGET, "Assigned port: {}", port);
        Ok(port)
    }
}