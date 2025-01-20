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

use anyhow::{anyhow, Error};
use log::{error, info, warn};
use std::net::TcpListener;

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
