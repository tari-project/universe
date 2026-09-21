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

use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{Error, Result, anyhow};
use log::{error, info};
use regex::Regex;
use reqwest::multipart;
use serde::Serialize;
use tari_common::configuration::Network;
use tokio::sync::RwLock;
use zip::ZipWriter;
use zip::write::SimpleFileOptions;

use crate::LOG_TARGET_APP_LOGIC;
use crate::app_in_memory_config::AppInMemoryConfig;
use crate::configs::config_core::ConfigCore;
use crate::configs::config_mining::ConfigMining;
use crate::configs::config_pools::ConfigPools;
use crate::configs::config_ui::ConfigUI;
use crate::configs::config_wallet::ConfigWallet;
use crate::configs::trait_config::ConfigImpl;
use crate::utils::file_utils::{make_relative_path, path_as_string};
use crate::utils::log_path_scrub::scrub_user_paths_bytes;

const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024; // 100MB in bytes
/// Path of the diagnostics document inside the support archive.
const DIAGNOSTICS_ARCHIVE_PATH: &str = "configs/diagnostics.json";

/// The non-secret snapshot of the user's settings that ships with a support bundle.
///
/// The support archive used to copy every config file from the app config
/// directory, which exfiltrated airdrop tokens, the wallet view key, the MCP
/// bearer token and the legacy wallet config to the feedback endpoint. This
/// struct replaces that with an explicit allowlist.
///
/// Rules for anyone editing this struct:
///
/// * Every field is listed and populated **individually**. Never build this
///   type by serializing a whole `Config*Content` struct (or any part of one),
///   so a secret added to a config later can never leak in by accident.
/// * Never add secrets or anything that can contain them: airdrop tokens,
///   `tari_wallet_details` (or any field inside it), PIN/locker data, the MCP
///   bearer token, seed phrases, private/view keys, addresses or address
///   books, and filesystem paths (they carry the user name).
/// * Wallet state is reported as booleans and counters only.
/// * If in doubt, leave the field out. A reviewer can always add one later.
#[derive(Debug, Serialize)]
pub struct SupportDiagnostics {
    pub app_version: String,
    pub network: String,
    pub anon_id: String,
    pub exchange_id: String,
    pub allow_telemetry: bool,
    pub allow_notifications: bool,
    pub use_tor: bool,
    pub auto_update: bool,
    pub pre_release: bool,
    pub remote_base_node_address: String,
    pub node_type: String,
    pub mmproxy_use_monero_failover: bool,
    pub cpu_mining_enabled: bool,
    pub gpu_mining_enabled: bool,
    pub mine_on_app_start: bool,
    pub selected_mining_mode: String,
    pub available_mining_modes: Vec<String>,
    pub is_lolminer_tested: bool,
    pub is_gpu_mining_recommended: bool,
    pub cpu_pool_enabled: bool,
    pub cpu_pool_name: String,
    pub cpu_pool_url: String,
    pub gpu_pool_enabled: bool,
    pub gpu_pool_name: String,
    pub gpu_pool_url: String,
    pub application_language: String,
    pub should_always_use_system_language: bool,
    pub display_mode: String,
    pub visual_mode: bool,
    pub show_experimental_settings: bool,
    pub wallet_ui_mode: String,
    /// `tari_wallet_details.is_some()` - never the details themselves.
    pub has_internal_wallet: bool,
    pub tari_wallets_count: usize,
    /// `keyring_accessed`
    pub credential_store_accessed: bool,
    /// `seed_backed_up`
    pub wallet_backed_up: bool,
    pub wallet_migration_nonce: u64,
    pub monero_address_is_generated: bool,
}

impl SupportDiagnostics {
    /// Reads the live configs and copies out the allowlisted fields one by one.
    pub async fn collect() -> Self {
        let core = ConfigCore::content().await;
        let mining = ConfigMining::content().await;
        let ui = ConfigUI::content().await;
        let pools = ConfigPools::content().await;
        let wallet = ConfigWallet::content().await;

        let cpu_pool = pools.current_cpu_pool();
        let gpu_pool = pools.current_gpu_pool();

        let mut available_mining_modes: Vec<String> =
            mining.mining_modes().keys().cloned().collect();
        available_mining_modes.sort();

        Self {
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            network: Network::get_current_or_user_setting_or_default()
                .as_key_str()
                .to_string(),
            anon_id: core.anon_id().clone(),
            exchange_id: core.exchange_id().clone(),
            allow_telemetry: *core.allow_telemetry(),
            allow_notifications: *core.allow_notifications(),
            use_tor: *core.use_tor(),
            auto_update: *core.auto_update(),
            pre_release: *core.pre_release(),
            remote_base_node_address: core.remote_base_node_address().clone(),
            node_type: format!("{:?}", core.node_type()),
            mmproxy_use_monero_failover: *core.mmproxy_use_monero_failover(),
            cpu_mining_enabled: *mining.cpu_mining_enabled(),
            gpu_mining_enabled: *mining.gpu_mining_enabled(),
            mine_on_app_start: *mining.mine_on_app_start(),
            selected_mining_mode: mining.selected_mining_mode().clone(),
            available_mining_modes,
            is_lolminer_tested: *mining.is_lolminer_tested(),
            is_gpu_mining_recommended: *mining.is_gpu_mining_recommended(),
            cpu_pool_enabled: *pools.cpu_pool_enabled(),
            cpu_pool_name: cpu_pool.pool_name.clone(),
            cpu_pool_url: cpu_pool.pool_url.clone(),
            gpu_pool_enabled: *pools.gpu_pool_enabled(),
            gpu_pool_name: gpu_pool.pool_name.clone(),
            gpu_pool_url: gpu_pool.pool_url.clone(),
            application_language: ui.application_language().clone(),
            should_always_use_system_language: *ui.should_always_use_system_language(),
            display_mode: format!("{:?}", ui.display_mode()),
            visual_mode: *ui.visual_mode(),
            show_experimental_settings: *ui.show_experimental_settings(),
            wallet_ui_mode: format!("{:?}", ui.wallet_ui_mode()),
            has_internal_wallet: wallet.tari_wallet_details().is_some(),
            tari_wallets_count: wallet.tari_wallets().len(),
            credential_store_accessed: *wallet.keyring_accessed(),
            wallet_backed_up: *wallet.seed_backed_up(),
            wallet_migration_nonce: *wallet.wallet_migration_nonce(),
            monero_address_is_generated: *wallet.monero_address_is_generated(),
        }
    }

    /// File name of the archive built for this user.
    fn archive_file_name(&self) -> String {
        format!("logs_config_{}.zip", self.anon_id)
    }
}

/// Builds the support archive: the log files plus `configs/diagnostics.json`.
///
/// Deliberately free of config singletons and network access so it can be
/// tested in isolation. No file from the app config directory is ever read
/// here - the only thing shipped about the configuration is the allowlisted
/// `diagnostics` value.
///
/// Returns the path of the archive and its file name.
pub fn create_support_archive(
    logs_dir: &Path,
    diagnostics: &SupportDiagnostics,
) -> Result<(PathBuf, String)> {
    let zip_filename = diagnostics.archive_file_name();
    let archive_file = logs_dir.join(&zip_filename);
    let diagnostics_json = serde_json::to_string_pretty(diagnostics)?;

    // Only log files. `.zip` is deliberately not matched: a bundle left behind
    // by a failed upload must not be nested into the next one, and the archive
    // being written must not match its own walk.
    let log_regex_filter =
        Regex::new(r"^.*\.log$").map_err(|e| anyhow!("Failed to create log file filter: {}", e))?;

    let directories_and_filters =
        vec![(logs_dir.to_path_buf(), log_regex_filter, "logs".to_string())];

    zip_create_from_directories(&archive_file, &directories_and_filters, &diagnostics_json)?;

    Ok((archive_file, zip_filename))
}

fn zip_create_from_directories(
    archive_file: &Path,
    directories_and_filters: &[(PathBuf, Regex, String)],
    diagnostics_json: &str,
) -> Result<(), Error> {
    let file_options = SimpleFileOptions::default();

    let zip_file_name = archive_file
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| anyhow!("Failed to get archive file name"))?
        .to_string();

    let file = File::create(archive_file)?;

    let mut zip = ZipWriter::new(file);
    let mut buffer = Vec::new();

    zip.start_file(DIAGNOSTICS_ARCHIVE_PATH, file_options)?;
    zip.write_all(diagnostics_json.as_bytes())?;

    for (directory, regex_filter, folder_name) in directories_and_filters {
        if !directory.exists() {
            continue; // Skip non-existent directories
        }

        let mut paths_queue: Vec<PathBuf> = vec![];
        paths_queue.push(directory.to_path_buf());

        while let Some(next) = paths_queue.pop() {
            let directory_entry_iterator = std::fs::read_dir(next)?;

            for entry in directory_entry_iterator {
                let entry_path = entry?.path();
                let entry_metadata = std::fs::metadata(entry_path.clone())?;
                let entry_file_name_as_str = entry_path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .ok_or_else(|| anyhow!("Failed to get file name"))?;

                if entry_metadata.is_file()
                    && regex_filter.is_match(entry_file_name_as_str)
                    && !entry_file_name_as_str.eq(&zip_file_name)
                    && entry_path != archive_file
                {
                    // Skip files larger than 100MB
                    if entry_metadata.len() > MAX_FILE_SIZE {
                        info!(target: LOG_TARGET_APP_LOGIC, "Skipping file {} (size: {} bytes) - exceeds 100MB limit",
                              entry_file_name_as_str, entry_metadata.len());
                        continue;
                    }

                    let mut f = File::open(&entry_path)?;
                    f.read_to_end(&mut buffer)?;
                    let relative_path = make_relative_path(directory, &entry_path);
                    let prefixed_path =
                        format!("{}/{}", folder_name, path_as_string(&relative_path));
                    zip.start_file(prefixed_path, file_options)?;
                    zip.write_all(&scrub_user_paths_bytes(&buffer))?;
                    buffer.clear();
                } else if entry_metadata.is_dir() {
                    let relative_path = make_relative_path(directory, &entry_path);
                    let prefixed_path =
                        format!("{}/{}", folder_name, path_as_string(&relative_path));
                    zip.add_directory(prefixed_path, file_options)?;
                    paths_queue.push(entry_path.clone());
                } else {
                    info!(target: LOG_TARGET_APP_LOGIC, "Skipping file {} - does not match filter",
                          entry_file_name_as_str);
                }
            }
        }
    }

    zip.finish()?;
    Ok(())
}

pub struct Feedback {
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
}

impl Feedback {
    pub fn new(in_memory_config: Arc<RwLock<AppInMemoryConfig>>) -> Self {
        Self { in_memory_config }
    }

    pub async fn send_feedback(
        &self,
        feedback_message: String,
        include_logs: bool,
        app_log_dir: PathBuf,
    ) -> Result<String> {
        if feedback_message.is_empty() {
            return Err(anyhow!("Feedback not sent. No message provided"));
        }

        let feedback_url = format!(
            "{}/feedback",
            self.in_memory_config.read().await.airdrop_api_url.clone()
        );

        // Create a multipart form
        let anon_id = ConfigCore::content().await.anon_id().clone();
        let mut form = multipart::Form::new()
            .text("feedback", feedback_message.clone())
            .text("appId", anon_id.clone());

        let upload_zip_path = if include_logs {
            let diagnostics = SupportDiagnostics::collect().await;
            let (archive_file, zip_filename) = create_support_archive(&app_log_dir, &diagnostics)?;
            let metadata = std::fs::metadata(&archive_file)?;
            let file_size = metadata.len();
            info!(target: LOG_TARGET_APP_LOGIC, "Uploading {} ({} bytes)", zip_filename.clone(), file_size);
            let mut file = File::open(&archive_file)?;
            let mut file_contents = Vec::new();
            file.read_to_end(&mut file_contents)?;
            form = form.part(
                "logs",
                multipart::Part::bytes(file_contents)
                    .file_name(zip_filename.clone())
                    .mime_str("application/x-compressed")?,
            );
            Some(archive_file)
        } else {
            None
        };

        let airdrop_tokens = ConfigCore::content().await.airdrop_tokens().clone();
        let jwt = airdrop_tokens.map(|tokens| tokens.token);

        // Send the POST request
        let mut req = reqwest::Client::new().post(feedback_url).multipart(form);
        if let Some(jwt) = jwt {
            req = req.header("Authorization", format!("Bearer {jwt}"));
        }
        let response = req.send().await?;

        // Delete the ZIP file
        if let Some(archive_file) = upload_zip_path {
            std::fs::remove_file(archive_file)?;
        }
        if response.status().is_success() {
            info!(target: LOG_TARGET_APP_LOGIC, "Feedback sent successfully");
            Ok(response.text().await?)
        } else {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to upload file: {}", response.status());
            Err(anyhow!("Failed to upload file: {}", response.status()))
        }
    }
}
