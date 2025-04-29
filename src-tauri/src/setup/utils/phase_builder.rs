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

use std::time::Duration;

use tauri::AppHandle;
use tokio::sync::watch::{Receiver, Sender};

use crate::setup::{
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
};

pub struct PhaseBuilder {
    configuration: SetupConfiguration,
}

impl PhaseBuilder {
    pub fn new() -> Self {
        PhaseBuilder {
            configuration: SetupConfiguration {
                listeners_for_required_phases_statuses: Vec::new(),
                setup_timeout_duration: None,
            },
        }
    }

    pub fn with_listeners_for_required_phases_statuses(
        mut self,
        listeners: Vec<Receiver<PhaseStatus>>,
    ) -> Self {
        self.configuration.listeners_for_required_phases_statuses = listeners;
        self
    }

    pub fn with_setup_timeout_duration(mut self, duration: Duration) -> Self {
        self.configuration.setup_timeout_duration = Some(duration);
        self
    }

    pub async fn build<T: SetupPhaseImpl>(
        &self,
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
    ) -> T {
        T::new(app_handle, status_sender, self.configuration.clone()).await
    }
}
