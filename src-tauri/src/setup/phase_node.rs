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

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};
use crate::{
    LOG_TARGET_APP_LOGIC, UniverseAppState,
    binaries::{Binaries, BinaryResolver},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    events_manager::EventsManager,
    node::node_manager::{NodeManagerError, NodeType, STOP_ON_ERROR_CODES},
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    wallet::minotari_wallet::MinotariWalletManager,
};
use anyhow::Error;
use log::{error, info, warn};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::{collections::HashMap, time::Duration};
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::{
    sync::{
        Mutex,
        watch::{self, Sender},
    },
    time::{Interval, interval},
};
use tokio_util::task::TaskTracker;

pub(crate) const TOR_FALLBACK_WARNING: &str = "Tor unavailable, running without it";

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct ResolvedNodeTorConfig {
    pub effective_use_tor: bool,
    pub tor_control_port: Option<u16>,
    pub tor_cookie_path: Option<PathBuf>,
    pub fallback_reason: Option<String>,
    pub failed_step: Option<SetupStep>,
}

pub(crate) fn should_defer_local_startup(node_type: &NodeType) -> bool {
    matches!(node_type, NodeType::RemoteUntilLocal)
}

pub(crate) fn finalize_foreground_tor_config(
    configured_use_tor: bool,
    is_local_node: bool,
    uses_builtin_libtor: bool,
    binaries_tor_warning: Option<String>,
    start_tor_warning: Option<String>,
    control_info: Result<(Option<u16>, Option<PathBuf>), Error>,
) -> ResolvedNodeTorConfig {
    if !configured_use_tor || !is_local_node {
        return ResolvedNodeTorConfig {
            effective_use_tor: false,
            tor_control_port: None,
            tor_cookie_path: None,
            fallback_reason: None,
            failed_step: None,
        };
    }

    if uses_builtin_libtor {
        return ResolvedNodeTorConfig {
            effective_use_tor: true,
            tor_control_port: None,
            tor_cookie_path: None,
            fallback_reason: None,
            failed_step: None,
        };
    }

    if let Some(reason) = binaries_tor_warning {
        warn!(
            target: LOG_TARGET_APP_LOGIC,
            "{TOR_FALLBACK_WARNING}: Tor binary setup failed: {reason}"
        );
        return ResolvedNodeTorConfig {
            effective_use_tor: false,
            tor_control_port: None,
            tor_cookie_path: None,
            fallback_reason: Some(reason),
            failed_step: Some(SetupStep::BinariesTor),
        };
    }

    if let Some(reason) = start_tor_warning {
        warn!(
            target: LOG_TARGET_APP_LOGIC,
            "{TOR_FALLBACK_WARNING}: Tor bootstrap failed: {reason}"
        );
        return ResolvedNodeTorConfig {
            effective_use_tor: false,
            tor_control_port: None,
            tor_cookie_path: None,
            fallback_reason: Some(reason),
            failed_step: Some(SetupStep::StartTor),
        };
    }

    match control_info {
        Ok((Some(port), Some(cookie_path))) => ResolvedNodeTorConfig {
            effective_use_tor: true,
            tor_control_port: Some(port),
            tor_cookie_path: Some(cookie_path),
            fallback_reason: None,
            failed_step: None,
        },
        Ok(_) => {
            let reason = "Tor control port or authentication cookie is unavailable".to_string();
            warn!(target: LOG_TARGET_APP_LOGIC, "{TOR_FALLBACK_WARNING}: {reason}");
            ResolvedNodeTorConfig {
                effective_use_tor: false,
                tor_control_port: None,
                tor_cookie_path: None,
                fallback_reason: Some(reason),
                failed_step: Some(SetupStep::StartTor),
            }
        }
        Err(err) => {
            let reason = err.to_string();
            warn!(target: LOG_TARGET_APP_LOGIC, "{TOR_FALLBACK_WARNING}: {reason}");
            ResolvedNodeTorConfig {
                effective_use_tor: false,
                tor_control_port: None,
                tor_cookie_path: None,
                fallback_reason: Some(reason),
                failed_step: Some(SetupStep::StartTor),
            }
        }
    }
}

pub(crate) async fn resolve_tor_transport<InitBinFut, StartTorFut, ControlInfoFut>(
    configured_use_tor: bool,
    is_local_node: bool,
    uses_builtin_libtor: bool,
    init_tor_binary: impl FnOnce() -> InitBinFut,
    start_tor: impl FnOnce() -> StartTorFut,
    read_control_info: impl FnOnce() -> ControlInfoFut,
) -> ResolvedNodeTorConfig
where
    InitBinFut: std::future::Future<Output = Result<(), Error>>,
    StartTorFut: std::future::Future<Output = Result<(), Error>>,
    ControlInfoFut: std::future::Future<Output = Result<(Option<u16>, Option<PathBuf>), Error>>,
{
    if !configured_use_tor || !is_local_node || uses_builtin_libtor {
        return finalize_foreground_tor_config(
            configured_use_tor,
            is_local_node,
            uses_builtin_libtor,
            None,
            None,
            Ok((None, None)),
        );
    }

    if let Err(err) = init_tor_binary().await {
        return finalize_foreground_tor_config(
            configured_use_tor,
            is_local_node,
            uses_builtin_libtor,
            Some(err.to_string()),
            None,
            Ok((None, None)),
        );
    }

    if let Err(err) = start_tor().await {
        return finalize_foreground_tor_config(
            configured_use_tor,
            is_local_node,
            uses_builtin_libtor,
            None,
            Some(err.to_string()),
            Ok((None, None)),
        );
    }

    finalize_foreground_tor_config(
        configured_use_tor,
        is_local_node,
        uses_builtin_libtor,
        None,
        None,
        read_control_info().await,
    )
}

#[derive(Clone, Default)]
pub struct NodeSetupPhaseAppConfiguration {
    use_tor: bool,
    base_node_grpc_address: String,
    custom_data_dir: Option<PathBuf>,
}

pub struct NodeSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    #[allow(dead_code)]
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
    external_tor_active: AtomicBool,
}

impl NodeSetupPhase {
    pub(crate) fn configure_progress_stepper(builder: &mut ProgressStepperBuilder) {
        builder
            .add_incremental_step(SetupStep::BinariesTor, false)
            .add_incremental_step(SetupStep::BinariesNode, true)
            .add_step(SetupStep::StartTor, false)
            .add_incremental_step(SetupStep::MigratingDatabase, true)
            .add_step(SetupStep::StartingNode, true)
            .add_incremental_step(SetupStep::StartingNode, true);
    }
}

impl SetupPhaseImpl for NodeSetupPhase {
    type AppConfiguration = NodeSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
        setup_features: SetupFeaturesList,
    ) -> Self {
        let timeout_watcher = TimeoutWatcher::new(configuration.setup_timeout_duration);
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(
                app_handle,
                status_sender.clone(),
                timeout_watcher.get_sender(),
            )),
            setup_configuration: configuration,
            status_sender,
            setup_features,
            timeout_watcher,
            external_tor_active: AtomicBool::new(false),
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn get_status_sender(&self) -> &Sender<PhaseStatus> {
        &self.status_sender
    }

    async fn get_shutdown_signal(&self) -> ShutdownSignal {
        TasksTrackers::current().node_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current().node_phase.get_task_tracker().await
    }
    fn get_phase_dependencies(&self) -> Vec<tokio::sync::watch::Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::Node
    }
    fn get_timeout_watcher(&self) -> &TimeoutWatcher {
        &self.timeout_watcher
    }

    fn create_progress_stepper(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        timeout_watcher_sender: Sender<u64>,
    ) -> ProgressStepper {
        let mut builder = ProgressStepperBuilder::new();
        Self::configure_progress_stepper(&mut builder);
        builder.build(
            app_handle.clone(),
            timeout_watcher_sender,
            status_sender,
            SetupPhase::Node,
        )
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let config_core = ConfigCore::content().await;
        let use_tor = *config_core.use_tor();
        let base_node_grpc_address = config_core.remote_base_node_address().clone();
        let custom_data_dir = config_core.node_data_directory().clone();

        Ok(NodeSetupPhaseAppConfiguration {
            use_tor,
            base_node_grpc_address,
            custom_data_dir,
        })
    }

    async fn setup(self) {
        SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), Error> {
        let app_configuration = Self::load_app_configuration().await.unwrap_or_default();

        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let mut node_data_dir = data_dir.clone();
        if let Some(custom_data_dir) = app_configuration.custom_data_dir {
            node_data_dir = custom_data_dir
        }

        let state = self.app_handle.state::<UniverseAppState>();
        let node_type = state.node_manager.get_node_type().await;
        self.external_tor_active.store(false, Ordering::SeqCst);
        EventsEmitter::emit_tor_fallback(false, None).await;

        let binary_resolver = BinaryResolver::current();
        let mut progress_stepper = self.progress_stepper.lock().await;

        if should_defer_local_startup(&node_type) {
            progress_stepper.skip_step(SetupStep::BinariesTor).await?;

            let node_binary_progress_tracker =
                progress_stepper.track_step_incrementally(SetupStep::BinariesNode);
            progress_stepper
                .complete_step(SetupStep::BinariesNode, || async {
                    binary_resolver
                        .initialize_binary(Binaries::MinotariNode, node_binary_progress_tracker)
                        .await
                })
                .await?;

            progress_stepper.skip_step(SetupStep::StartTor).await?;

            progress_stepper
                .complete_step(SetupStep::StartingNode, || async {
                    for attempt in 0..2 {
                        match state
                            .node_manager
                            .ensure_remote_started(
                                node_data_dir.clone(),
                                config_dir.clone(),
                                log_dir.clone(),
                                Some(app_configuration.base_node_grpc_address.clone()),
                            )
                            .await
                        {
                            Ok(()) => {
                                EventsManager::handle_node_type_update(&self.app_handle).await;
                                break;
                            }
                            Err(e) if attempt == 0 => {
                                warn!(
                                    target: LOG_TARGET_APP_LOGIC,
                                    "Remote node failed to start in RemoteUntilLocal mode ({e:?}), retrying once."
                                );
                            }
                            Err(e) => {
                                error!(
                                    target: LOG_TARGET_APP_LOGIC,
                                    "Could not start remote node in RemoteUntilLocal mode: {e:?}"
                                );
                                return Err(e.into());
                            }
                        }
                    }
                    Ok(())
                })
                .await?;

            progress_stepper
                .complete_step(SetupStep::MigratingDatabase, || async { Ok(()) })
                .await?;

            return Ok(());
        }

        // Tor is not needed for a remote node
        let configured_use_tor = app_configuration.use_tor && node_type.is_local();
        // MacOS uses built-in libtor
        let uses_builtin_libtor = cfg!(target_os = "macos");
        let needs_external_tor = configured_use_tor && !uses_builtin_libtor;

        let tor_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesTor);

        progress_stepper
            .complete_step(SetupStep::BinariesTor, || async {
                if !needs_external_tor {
                    return Ok(());
                }
                binary_resolver
                    .initialize_binary(Binaries::Tor, tor_binary_progress_tracker)
                    .await
            })
            .await?;
        let binaries_tor_warning = progress_stepper
            .get_setup_warnings()
            .get(&SetupStep::BinariesTor)
            .cloned();

        let node_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesNode);

        progress_stepper
            .complete_step(SetupStep::BinariesNode, || async {
                binary_resolver
                    .initialize_binary(Binaries::MinotariNode, node_binary_progress_tracker)
                    .await
            })
            .await?;

        if !needs_external_tor || binaries_tor_warning.is_some() {
            progress_stepper.skip_step(SetupStep::StartTor).await?;
        } else {
            progress_stepper
                .complete_step(SetupStep::StartTor, || async {
                    state
                        .tor_manager
                        .ensure_started(data_dir.clone(), config_dir.clone(), log_dir.clone())
                        .await
                })
                .await?;
        }

        let start_tor_warning = progress_stepper
            .get_setup_warnings()
            .get(&SetupStep::StartTor)
            .cloned();
        let control_info = if needs_external_tor
            && binaries_tor_warning.is_none()
            && start_tor_warning.is_none()
        {
            match state.tor_manager.get_control_port().await {
                Ok(port) => Ok((port, state.tor_manager.get_control_cookie_path().await)),
                Err(err) => Err(err),
            }
        } else {
            Ok((None, None))
        };

        let tor_config = finalize_foreground_tor_config(
            configured_use_tor,
            node_type.is_local(),
            uses_builtin_libtor,
            binaries_tor_warning,
            start_tor_warning,
            control_info,
        );
        if let Some(ref reason) = tor_config.fallback_reason {
            EventsEmitter::emit_tor_fallback(true, Some(reason.clone())).await;
        }
        self.external_tor_active.store(
            tor_config.effective_use_tor && !uses_builtin_libtor,
            Ordering::SeqCst,
        );

        let effective_use_tor = tor_config.effective_use_tor;
        let tor_control_port = tor_config.tor_control_port;
        let tor_cookie_path = tor_config.tor_cookie_path;

        progress_stepper
            .complete_step(SetupStep::StartingNode, || async {
                for attempt in 0..2 {
                    match state
                        .node_manager
                        .ensure_started(
                            node_data_dir.clone(),
                            config_dir.clone(),
                            log_dir.clone(),
                            effective_use_tor,
                            tor_control_port,
                            tor_cookie_path.clone(),
                            Some(app_configuration.base_node_grpc_address.clone()),
                        )
                        .await
                    {
                        Ok(_) => {
                            EventsManager::handle_node_type_update(&self.app_handle).await;
                            break;
                        }
                        Err(e) if attempt == 0 => {
                            if let NodeManagerError::ExitCode(code) = e {
                                if STOP_ON_ERROR_CODES.contains(&code) {
                                    warn!(target: LOG_TARGET_APP_LOGIC, "Node data or config is corrupt or needs a restart, deleting and trying again.");
                                    state.node_manager.clean_data_folder(&node_data_dir).await?;
                                    // The wallet db can hold the only proof of a burn that is broadcast but not mined.
                                    match MinotariWalletManager::ensure_no_pending_burns() {
                                        Ok(()) => crate::wallet::clean_wallet_data_folders(&data_dir).await?,
                                        Err(e) => warn!(target: LOG_TARGET_APP_LOGIC, "Keeping the wallet data folder: {e}"),
                                    }
                                }
                                continue;
                            }
                            if let NodeManagerError::UnknownError(error) = e {
                                warn!(target: LOG_TARGET_APP_LOGIC, "NodeManagerError::UnknownError({error:?}) needs a restart.");
                                continue;
                            }
                        }
                        Err(e) => {
                            error!(target: LOG_TARGET_APP_LOGIC, "Could not start node manager after restart: {e:?}");
                            return Err(e.into());
                        }
                    }
                }
                Ok(())
            })
            .await?;

        let migration_tracker =
            progress_stepper.track_step_incrementally(SetupStep::MigratingDatabase);
        progress_stepper
            .complete_step(SetupStep::MigratingDatabase, || async {
                if node_type.is_remote() {
                    return Ok(());
                }
                if let Some(tracker) = migration_tracker {
                    state
                        .node_manager
                        .wait_migration(Some(tracker))
                        .await
                        .map_err(|e| anyhow::anyhow!("Failed to wait for node migration: {e}"))?;
                }
                Ok(())
            })
            .await?;

        Ok(())
    }

    #[allow(clippy::too_many_lines)]
    async fn finalize_setup(&self) -> Result<(), Error> {
        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        TasksTrackers::current()
            .node_phase.get_task_tracker().await
            .spawn(async move {
                let app_state = app_handle_clone.state::<UniverseAppState>().clone();
                let mut node_status_watch_rx = (*app_state.node_status_watch_rx).clone();
                let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;

                let init_node_status = *node_status_watch_rx.borrow();
                EventsEmitter::emit_base_node_update(init_node_status).await;
                let mut latest_updated_block_height = init_node_status.block_height;


                loop {
                    tokio::select! {
                _ = node_status_watch_rx.changed() => {
                    let node_status = *node_status_watch_rx.borrow();
                    let node_synced = node_status.is_synced;
                    let wallet_is_syncing = MinotariWalletManager::is_syncing().await;

                    let all_syncing_complete= !wallet_is_syncing && node_synced;
                    let latest_needs_update = all_syncing_complete && (latest_updated_block_height == 0 || node_status.block_height > latest_updated_block_height);

                   if latest_needs_update {
                        latest_updated_block_height = node_status.block_height;
                        if all_syncing_complete {
                            EventsEmitter::emit_new_block_mined(latest_updated_block_height).await;
                        }
                    }
                    EventsEmitter::emit_base_node_update(node_status).await;
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
                }
            });

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let state: tauri::State<'_, UniverseAppState> =
            app_handle_clone.state::<UniverseAppState>();
        let node_type = state.node_manager.get_node_type().await;
        let app_configuration = Self::load_app_configuration().await.unwrap_or_default();

        if self.external_tor_active.load(Ordering::SeqCst)
            && let Ok(tor_guards) = state.tor_manager.get_entry_guards().await
        {
            EventsEmitter::emit_tor_entry_guards(tor_guards).await;
        } else if app_configuration.use_tor
            && node_type.is_local()
            && !should_defer_local_startup(&node_type)
            && !cfg!(target_os = "macos")
        {
            EventsEmitter::emit_tor_entry_guards(Vec::new()).await;
        }

        if should_defer_local_startup(&node_type) {
            let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
            let node_data_dir = app_configuration
                .custom_data_dir
                .clone()
                .unwrap_or_else(|| data_dir.clone());
            let app_handle_bg = self.app_handle.clone();
            let configured_use_tor = app_configuration.use_tor;
            let mut bg_shutdown = shutdown_signal.clone();

            TasksTrackers::current()
                .node_phase
                .get_task_tracker()
                .await
                .spawn(async move {
                    tokio::select! {
                        _ = bootstrap_local_node_in_background(
                            app_handle_bg,
                            data_dir,
                            node_data_dir,
                            config_dir,
                            log_dir,
                            configured_use_tor,
                        ) => {}
                        _ = bg_shutdown.wait() => {
                            info!(target: LOG_TARGET_APP_LOGIC, "Background RemoteUntilLocal bootstrap stopped on shutdown");
                        }
                    }
                });
        }

        let mut shutdown_signal_clone = shutdown_signal.clone();
        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        if node_type.is_local() {
            TasksTrackers::current()
                .node_phase
                .get_task_tracker()
                .await
                .spawn(async move {
                    tokio::select! {
                        _ = wait_node_synced_with_progress(app_handle_clone) => {
                            info!(target: LOG_TARGET_APP_LOGIC, "wait_node_synced_with_progress completed")
                        },
                        _ = shutdown_signal_clone.wait() => {
                            info!(target: LOG_TARGET_APP_LOGIC, "wait_node_synced_with_progress stopped")
                        }
                    }
                });
        }

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut interval: Interval = interval(Duration::from_secs(60));
                interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

                loop {
                    tokio::select! {
                        _ = interval.tick() => {
                            let state = app_handle_clone.state::<UniverseAppState>().inner();
                            let check_if_orphan = state
                                .node_manager
                                .check_if_is_orphan_chain()
                                .await;
                            match check_if_orphan {
                                Ok(is_stuck) => {
                                    EventsEmitter::emit_stuck_on_orphan_chain(is_stuck).await;
                                }
                                Err(ref e) => {
                                    error!(target: LOG_TARGET_APP_LOGIC, "{e}");
                                }
                            }
                        },
                        _ = shutdown_signal.wait() => {
                            info!(target: LOG_TARGET_APP_LOGIC, "Stopping periodic orphan chain checks");
                            break;
                        }
                    }
                }
            });

        let progress_stepper = self.progress_stepper.lock().await;
        let setup_warnings = progress_stepper.get_setup_warnings();
        if setup_warnings.is_empty() {
            self.status_sender.send(PhaseStatus::Success)?;
        } else {
            self.status_sender
                .send(PhaseStatus::SuccessWithWarnings(setup_warnings.clone()))?;
        }

        Ok(())
    }
}

async fn wait_node_synced_with_progress(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
    let (progress_params_tx, mut progress_params_rx) =
        watch::channel(HashMap::<String, String>::new());
    let (progress_percentage_tx, progress_percentage_rx) = watch::channel(0f64);
    let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;

    let progress_handle = TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    tokio::select! {
                        _ = progress_params_rx.changed() => {
                            let progress_params = progress_params_rx.borrow().clone();
                            let percentage = *progress_percentage_rx.borrow();
                            if let Some(step) = progress_params.get("step").cloned() {
                                EventsEmitter::emit_background_node_sync_update(progress_params.clone()).await;
                                if step == "Done" || (step == "Block" && percentage == 1.0) {
                                    break;
                                }
                            }
                        },
                        _ = shutdown_signal.wait() => {
                            break;
                        }
                    }
                }
            });

    let state = app_handle.state::<UniverseAppState>();
    let _unused = state
        .node_manager
        .wait_synced(&progress_params_tx, &progress_percentage_tx)
        .await
        .err();
    progress_handle.abort();
    let _unused = progress_handle.await;

    Ok(())
}

async fn bootstrap_local_node_in_background(
    app_handle: tauri::AppHandle,
    data_dir: PathBuf,
    node_data_dir: PathBuf,
    config_dir: PathBuf,
    log_dir: PathBuf,
    configured_use_tor: bool,
) {
    let state = app_handle.state::<UniverseAppState>();
    let uses_builtin_libtor = cfg!(target_os = "macos");
    let data_dir_tor = data_dir.clone();
    let config_dir_tor = config_dir.clone();
    let log_dir_tor = log_dir.clone();

    let resolved = resolve_tor_transport(
        configured_use_tor,
        true,
        uses_builtin_libtor,
        || async {
            BinaryResolver::current()
                .initialize_binary(Binaries::Tor, None)
                .await
        },
        || async {
            state
                .tor_manager
                .ensure_started(data_dir_tor, config_dir_tor, log_dir_tor)
                .await
        },
        || async {
            let port = state.tor_manager.get_control_port().await?;
            let cookie = state.tor_manager.get_control_cookie_path().await;
            Ok((port, cookie))
        },
    )
    .await;

    if let Some(ref reason) = resolved.fallback_reason {
        EventsEmitter::emit_tor_fallback(true, Some(reason.clone())).await;
        EventsEmitter::emit_tor_entry_guards(Vec::new()).await;
    } else if resolved.effective_use_tor
        && !uses_builtin_libtor
        && let Ok(tor_guards) = state.tor_manager.get_entry_guards().await
    {
        EventsEmitter::emit_tor_entry_guards(tor_guards).await;
    }

    for attempt in 0..2 {
        match state
            .node_manager
            .ensure_local_started_for_remote_until_local(
                node_data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
                resolved.effective_use_tor,
                resolved.tor_control_port,
                resolved.tor_cookie_path.clone(),
            )
            .await
        {
            Ok(()) => {
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Background local node started in RemoteUntilLocal mode (use_tor={})",
                    resolved.effective_use_tor
                );
                break;
            }
            Err(e) if attempt == 0 => {
                if let NodeManagerError::ExitCode(code) = e {
                    if STOP_ON_ERROR_CODES.contains(&code) {
                        warn!(
                            target: LOG_TARGET_APP_LOGIC,
                            "Background local node data corrupt ({code}), cleaning node folder and retrying."
                        );
                        if let Err(clean_err) =
                            state.node_manager.clean_data_folder(&node_data_dir).await
                        {
                            error!(
                                target: LOG_TARGET_APP_LOGIC,
                                "Failed to clean local node folder during background retry: {clean_err}"
                            );
                            break;
                        }
                    }
                    continue;
                }
                if let NodeManagerError::UnknownError(ref err) = e {
                    warn!(
                        target: LOG_TARGET_APP_LOGIC,
                        "Background local node start failed ({err:?}), retrying once."
                    );
                    continue;
                }
            }
            Err(e) => {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Background local node failed to start in RemoteUntilLocal mode; staying on remote node: {e:?}"
                );
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicBool;

    #[test]
    fn node_progress_stepper_marks_tor_steps_non_required() {
        let mut builder = ProgressStepperBuilder::new();
        NodeSetupPhase::configure_progress_stepper(&mut builder);

        assert_eq!(
            builder.step_is_required(&SetupStep::BinariesTor),
            Some(false)
        );
        assert_eq!(builder.step_is_required(&SetupStep::StartTor), Some(false));
        assert_eq!(
            builder.step_is_required(&SetupStep::BinariesNode),
            Some(true)
        );
        assert_eq!(
            builder.step_is_required(&SetupStep::StartingNode),
            Some(true)
        );
        assert_eq!(
            builder.step_is_required(&SetupStep::MigratingDatabase),
            Some(true)
        );
    }

    #[tokio::test]
    async fn binaries_tor_failure_falls_back_to_tcp_and_skips_tor_startup() {
        let start_tor_called = AtomicBool::new(false);
        let read_control_called = AtomicBool::new(false);

        let resolved = resolve_tor_transport(
            true,
            true,
            false,
            || async { Err(anyhow::anyhow!("AV quarantined tor binary")) },
            || async {
                start_tor_called.store(true, Ordering::SeqCst);
                Ok(())
            },
            || async {
                read_control_called.store(true, Ordering::SeqCst);
                Ok((Some(9051), Some(PathBuf::from("/var/empty/cookie"))))
            },
        )
        .await;

        assert!(!start_tor_called.load(Ordering::SeqCst));
        assert!(!read_control_called.load(Ordering::SeqCst));
        assert!(!resolved.effective_use_tor);
        assert_eq!(resolved.tor_control_port, None);
        assert_eq!(resolved.tor_cookie_path, None);
        assert_eq!(resolved.failed_step, Some(SetupStep::BinariesTor));
        assert_eq!(
            resolved.fallback_reason.as_deref(),
            Some("AV quarantined tor binary")
        );

        let mut warnings = HashMap::new();
        warnings.insert(
            SetupStep::BinariesTor,
            resolved.fallback_reason.expect("warning reason"),
        );
        assert!(PhaseStatus::SuccessWithWarnings(warnings).is_success());
    }

    #[tokio::test]
    async fn start_tor_bootstrap_failure_falls_back_to_tcp_without_control_args() {
        let read_control_called = AtomicBool::new(false);

        let resolved = resolve_tor_transport(
            true,
            true,
            false,
            || async { Ok(()) },
            || async {
                Err(anyhow::anyhow!(
                    "Waiting for Tor to be ready timed out after 180"
                ))
            },
            || async {
                read_control_called.store(true, Ordering::SeqCst);
                Ok((Some(9051), Some(PathBuf::from("/var/empty/cookie"))))
            },
        )
        .await;

        assert!(!read_control_called.load(Ordering::SeqCst));
        assert!(!resolved.effective_use_tor);
        assert_eq!(resolved.tor_control_port, None);
        assert_eq!(resolved.tor_cookie_path, None);
        assert_eq!(resolved.failed_step, Some(SetupStep::StartTor));
        assert_eq!(
            resolved.fallback_reason.as_deref(),
            Some("Waiting for Tor to be ready timed out after 180")
        );

        let mut warnings = HashMap::new();
        warnings.insert(
            SetupStep::StartTor,
            resolved.fallback_reason.expect("warning reason"),
        );
        assert!(PhaseStatus::SuccessWithWarnings(warnings).is_success());
    }

    #[tokio::test]
    async fn normal_tor_success_preserves_tor_transport_and_control_cookie() {
        let cookie = PathBuf::from("/var/empty/tor-data/control_auth_cookie");
        let cookie_clone = cookie.clone();

        let resolved = resolve_tor_transport(
            true,
            true,
            false,
            || async { Ok(()) },
            || async { Ok(()) },
            || async move { Ok((Some(19051), Some(cookie_clone))) },
        )
        .await;

        assert!(resolved.effective_use_tor);
        assert_eq!(resolved.tor_control_port, Some(19051));
        assert_eq!(resolved.tor_cookie_path, Some(cookie));
        assert_eq!(resolved.fallback_reason, None);
        assert_eq!(resolved.failed_step, None);
    }

    #[tokio::test]
    async fn macos_builtin_libtor_preserves_use_tor_without_external_tor() {
        let resolved = resolve_tor_transport(
            true,
            true,
            true,
            || async { Err(anyhow::anyhow!("must not run on macos")) },
            || async { Err(anyhow::anyhow!("must not run on macos")) },
            || async { Err(anyhow::anyhow!("must not run on macos")) },
        )
        .await;

        assert!(resolved.effective_use_tor);
        assert_eq!(resolved.tor_control_port, None);
        assert_eq!(resolved.tor_cookie_path, None);
        assert_eq!(resolved.fallback_reason, None);
        assert_eq!(resolved.failed_step, None);
    }

    #[test]
    fn remote_until_local_defers_local_and_tor_startup_to_background() {
        assert!(should_defer_local_startup(&NodeType::RemoteUntilLocal));
        assert!(!should_defer_local_startup(&NodeType::Local));
        assert!(!should_defer_local_startup(&NodeType::Remote));
        assert!(!should_defer_local_startup(&NodeType::LocalAfterRemote));
    }
}
