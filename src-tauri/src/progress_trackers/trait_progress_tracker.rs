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
use tauri::AppHandle;

use crate::events::EventType;
pub trait ProgressEvent {
    fn get_event_type(&self) -> EventType;
    fn get_title(&self) -> String;
    fn get_description(&self) -> Option<String>;
}

pub trait ProgressStep {
    type ChannelEvent: ProgressEvent;
    fn resolve_to_event(&self) -> Self::ChannelEvent;
    fn get_progress_weight(&self) -> u8;
    fn get_event_type(&self) -> EventType;
    fn get_title(&self) -> String;
    fn get_description(&self) -> Option<String>;
}
#[allow(dead_code)]
pub trait ProgressPlanExecutorImpl {
    // App handle is optional only for testing purposes
    async fn resolve_step(&mut self, app_handle: Option<AppHandle>)
        -> Result<(String, f64), Error>;
    fn skip_step(&mut self) -> Result<(String, f64), Error>;
}
#[allow(dead_code)]
pub trait ProgressPlanBuilderImpl<Executor: ProgressPlanExecutorImpl> {
    type PlanElement: ProgressStep;

    fn new() -> Self;
    fn add_step(&mut self, element: Self::PlanElement) -> &mut Self;
    fn calculate_percentage_steps(&mut self) -> &mut Self;
    fn build(&self) -> Executor;
}
#[allow(dead_code)]
pub trait ProgressTrackerImpl {
    type PlanExecuter: ProgressPlanExecutorImpl;
    type PlanBuilder: ProgressPlanBuilderImpl<Self::PlanExecuter>;

    fn new() -> Self::PlanBuilder;
}
