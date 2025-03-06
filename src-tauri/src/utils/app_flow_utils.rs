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

use std::sync::LazyLock;

use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};

static INSTANCE: LazyLock<FrontendReadyChannel> = LazyLock::new(FrontendReadyChannel::new);

#[derive(Debug)]
pub struct FrontendReadyChannel {
    pub sender: Sender<bool>,
    pub receiver: Mutex<Receiver<bool>>,
}

impl FrontendReadyChannel {
    pub fn new() -> Self {
        let (sender, receiver) = tokio::sync::watch::channel(false);
        Self {
            sender,
            receiver: Mutex::new(receiver),
        }
    }

    pub fn set_ready(&self) {
        self.sender.send(true).unwrap();
    }

    pub async fn wait_for_ready(&self) -> Result<(), tokio::sync::watch::error::RecvError> {
        let mut receiver = self.receiver.lock().await;
        receiver.wait_for(|value| *value).await?;
        Ok(())
    }

    pub fn current() -> &'static FrontendReadyChannel {
        &INSTANCE
    }
}
