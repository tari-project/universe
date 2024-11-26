use anyhow::{anyhow, Error};
use log::{error, info, warn};
use std::{collections::HashMap, net::TcpListener};

const LOG_TARGET: &str = "tari::universe::port_allocator";
const ADDRESS: &str = "127.0.0.1";
const MAX_RETRIES: u16 = 10;
const FALLBACK_PORT_RANGE: std::ops::Range<u16> = 49152..65535;


pub struct PortAllocator {}

impl PortAllocator {
    pub fn new() -> Self {
        Self {}
    }

    fn get_address_with_0_port(&self) -> String {
        format!("{}:0", ADDRESS)
    }

    fn get_port(&self) -> Result<u16, Error> {
        match TcpListener::bind(self.get_address_with_0_port()) {
            Ok(listener) => {
                let port = listener
                    .local_addr()
                    .ok()
                    .map(|addr| addr.port())
                    .ok_or_else(|| anyhow!("Failed to get port"))?;
                Ok(port)
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to bind to port: {:?}", e);
                Err(anyhow!("Failed to bind to port"))
            }
        }
    }

    fn check_if_port_is_free(&self, port: u16) -> bool {
        TcpListener::bind(format!("{}:{}", ADDRESS, port)).is_ok()
    }

    fn asign_port_from_fallback_range(&self) -> u16 {
        for p in FALLBACK_PORT_RANGE {
            if self.check_if_port_is_free(p) {
                return p;
            }
        }
        0
    }

    pub fn assign_port(&self) -> Result<u16, Error> {
        let mut port = self.get_port()?;
        let mut tries = 0;

        while !self.check_if_port_is_free(port) {
            port = self.get_port()?;
            tries += 1;
            if tries >= MAX_RETRIES {
                warn!(target: LOG_TARGET, "Failed to assign port after {} tries", MAX_RETRIES);
                return Err(anyhow!("Failed to assign port after {} tries", MAX_RETRIES));
            }
        }

        info!(target: LOG_TARGET, "Assigned port: {}", port);
        Ok(port)
    }

    pub fn assign_port_with_fallback(&self) -> u16 {
        let mut port = self
            .get_port()
            .unwrap_or_else(|_| self.asign_port_from_fallback_range());
        let mut tries = 0;

        while !self.check_if_port_is_free(port) {
            port = self
                .get_port()
                .unwrap_or_else(|_| self.asign_port_from_fallback_range());
            tries += 1;
            if tries >= MAX_RETRIES {
                warn!(target: LOG_TARGET, "Failed to assign port after {} tries", MAX_RETRIES);
                info!(target: LOG_TARGET, "Assigning port from fallback range");
                return self.asign_port_from_fallback_range();
            }
        }

        info!(target: LOG_TARGET, "Assigned port: {}", port);
        port
    }
}
