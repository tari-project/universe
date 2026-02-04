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

use super::setup_manager::{ExchangeModalStatus, PhaseStatus, SetupPhase};
use std::collections::HashMap;

#[test]
fn setup_phase_all_returns_five_phases() {
    let phases = SetupPhase::all();
    assert_eq!(phases.len(), 5);
    assert!(phases.contains(&SetupPhase::Core));
    assert!(phases.contains(&SetupPhase::CpuMining));
    assert!(phases.contains(&SetupPhase::GpuMining));
    assert!(phases.contains(&SetupPhase::Node));
    assert!(phases.contains(&SetupPhase::Wallet));
}

#[test]
fn setup_phase_display_core() {
    assert_eq!(format!("{}", SetupPhase::Core), "Core");
}

#[test]
fn setup_phase_display_cpu_mining() {
    assert_eq!(format!("{}", SetupPhase::CpuMining), "CPU Mining");
}

#[test]
fn setup_phase_display_gpu_mining() {
    assert_eq!(format!("{}", SetupPhase::GpuMining), "GPU Mining");
}

#[test]
fn setup_phase_display_node() {
    assert_eq!(format!("{}", SetupPhase::Node), "Node");
}

#[test]
fn setup_phase_display_wallet() {
    assert_eq!(format!("{}", SetupPhase::Wallet), "Wallet");
}

#[test]
fn setup_phase_i18n_key_core() {
    assert_eq!(SetupPhase::Core.get_i18n_title_key(), "setup-core");
}

#[test]
fn setup_phase_i18n_key_cpu_mining() {
    assert_eq!(SetupPhase::CpuMining.get_i18n_title_key(), "setup-cpu-mining");
}

#[test]
fn setup_phase_i18n_key_gpu_mining() {
    assert_eq!(SetupPhase::GpuMining.get_i18n_title_key(), "setup-gpu-mining");
}

#[test]
fn setup_phase_i18n_key_node() {
    assert_eq!(SetupPhase::Node.get_i18n_title_key(), "setup-node");
}

#[test]
fn setup_phase_i18n_key_wallet() {
    assert_eq!(SetupPhase::Wallet.get_i18n_title_key(), "setup-wallet");
}

#[test]
fn exchange_modal_none_is_completed() {
    let status = ExchangeModalStatus::None;
    assert!(status.is_completed());
}

#[test]
fn exchange_modal_completed_is_completed() {
    let status = ExchangeModalStatus::Completed;
    assert!(status.is_completed());
}

#[test]
fn exchange_modal_wait_not_completed() {
    let status = ExchangeModalStatus::WaitForCompletion;
    assert!(!status.is_completed());
}

#[test]
fn exchange_modal_display_none() {
    assert_eq!(format!("{}", ExchangeModalStatus::None), "None");
}

#[test]
fn exchange_modal_display_wait() {
    assert_eq!(
        format!("{}", ExchangeModalStatus::WaitForCompletion),
        "Wait For Completion"
    );
}

#[test]
fn exchange_modal_display_completed() {
    assert_eq!(format!("{}", ExchangeModalStatus::Completed), "Completed");
}

#[test]
fn phase_status_is_success_for_success() {
    let status = PhaseStatus::Success;
    assert!(status.is_success());
}

#[test]
fn phase_status_is_success_for_success_with_warnings() {
    let mut warnings = HashMap::new();
    warnings.insert(
        crate::progress_trackers::progress_plans::SetupStep::StartingNode,
        "test warning".to_string(),
    );
    let status = PhaseStatus::SuccessWithWarnings(warnings);
    assert!(status.is_success());
}

#[test]
fn phase_status_is_success_false_for_failed() {
    let status = PhaseStatus::Failed("error".to_string());
    assert!(!status.is_success());
}

#[test]
fn phase_status_is_success_false_for_in_progress() {
    let status = PhaseStatus::InProgress;
    assert!(!status.is_success());
}

#[test]
fn phase_status_is_failed_returns_reason() {
    let status = PhaseStatus::Failed("test error".to_string());
    let (is_failed, reason) = status.is_failed();
    assert!(is_failed);
    assert_eq!(reason, Some("test error".to_string()));
}

#[test]
fn phase_status_is_failed_false_for_success() {
    let status = PhaseStatus::Success;
    let (is_failed, reason) = status.is_failed();
    assert!(!is_failed);
    assert!(reason.is_none());
}

#[test]
fn phase_status_is_restarting_for_none() {
    let status = PhaseStatus::None;
    assert!(status.is_restarting());
}

#[test]
fn phase_status_is_restarting_false_for_in_progress() {
    let status = PhaseStatus::InProgress;
    assert!(!status.is_restarting());
}

#[test]
fn phase_status_display_none() {
    assert_eq!(format!("{}", PhaseStatus::None), "None");
}

#[test]
fn phase_status_display_in_progress() {
    assert_eq!(format!("{}", PhaseStatus::InProgress), "In Progress");
}

#[test]
fn phase_status_display_failed() {
    assert_eq!(
        format!("{}", PhaseStatus::Failed("test".to_string())),
        "Failed: test"
    );
}
