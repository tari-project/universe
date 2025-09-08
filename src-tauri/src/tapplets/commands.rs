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

use std::path::PathBuf;

use crate::binaries::{Binaries, BinaryResolver};
use crate::database::models::{
    CreateDevTapplet, CreateInstalledTapplet, CreateTapplet, CreateTappletAsset,
    CreateTappletVersion, DevTapplet, Tapplet, UpdateDevTapplet, UpdateInstalledTapplet,
};

use crate::database::store::{DatabaseConnection, SqliteStore};
use crate::tapplets::error::Error;
use crate::tapplets::interface::{
    ActiveTapplet, AssetServer, InstalledTappletWithAssets, InstalledTappletWithName,
    TappletAssets, TappletRegistryManifest,
};
use crate::tapplets::tapplet_installer::{
    check_files_and_validate_checksum, delete_tapplet_folder, download_asset,
    fetch_tapp_registry_manifest, get_tapp_download_path,
};
use crate::tapplets::tapplet_manager::TappletManager;
use crate::tapplets::tapplet_server::get_tapp_config;
use log::{error, info, warn};
use tauri::ipc::InvokeError;
use tauri::Manager;

const LOG_TARGET: &str = "tari::universe::tapplets";
const BRIDGE_TAPPLET_ID: i32 = 1000; // Fixed ID for bridge tapplet

type CommandResult<T> = Result<T, InvokeError>;

struct PermissionUpdateResult {
    should_update: bool,
    updated_csp: String,
    updated_permissions: String,
}

async fn check_and_update_permissions(
    source: &str,
    current_csp: &str,
    current_permissions: &str,
    app_handle: tauri::AppHandle,
) -> CommandResult<PermissionUpdateResult> {
    let result = TappletManager::check_permissions_config(
        source,
        current_csp,
        current_permissions,
        app_handle,
    )
    .await
    .map_err(|e| InvokeError::from_anyhow(e))?;

    Ok(PermissionUpdateResult {
        should_update: result.should_update,
        updated_csp: result.updated_csp,
        updated_permissions: result.updated_permissions,
    })
}

async fn start_tapplet_server(
    tapplet_id: i32,
    tapplet_path: PathBuf,
    csp: &str,
    tapplet_manager: &TappletManager,
) -> CommandResult<String> {
    let csp_string = csp.to_string();
    let addr = tapplet_manager
        .start_server(tapplet_id, tapplet_path, &csp_string)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to start tapplet with id {}: {}", tapplet_id, &e);
            InvokeError::from_error(e)
        })?;

    let is_running = tapplet_manager.is_server_running(tapplet_id).await;
    info!(target: LOG_TARGET, "🎉🎉🎉 TAPP IS RUNNING: {:?} at address {:?}", is_running, addr);

    Ok(addr)
}

async fn create_tapplet_assets(
    store: &SqliteStore,
    app_handle: tauri::AppHandle,
    inserted_tapplet: &Tapplet,
) -> CommandResult<()> {
    let tapplet_assets = download_asset(app_handle, inserted_tapplet.package_name.clone())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not download tapplet assets: {}", e);
            InvokeError::from_error(Error::DatabaseError(
                crate::tapplets::error::DatabaseError::FailedToCreate {
                    entity_name: "tapplet_asset".to_string(),
                },
            ))
        })?;

    store
        .create_tapplet_asset(&CreateTappletAsset {
            tapplet_id: inserted_tapplet.id,
            icon_url: tapplet_assets.icon_url,
            background_url: tapplet_assets.background_url,
        })
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    // Verify asset was created
    store.get_tapplet_asset_by_id(inserted_tapplet.id.unwrap()).await
        .map(|asset| {
            info!(target: LOG_TARGET, "Tapplet assets added successfully for tapplet id: {:?}", asset.id);
        })
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not fetch tapplet asset after creation: {:?}", e);
            InvokeError::from_error(e)
        })?;

    Ok(())
}

async fn process_tapplet_manifest(
    store: &SqliteStore,
    app_handle: tauri::AppHandle,
    tapplet_manifest: &TappletRegistryManifest,
) -> CommandResult<()> {
    info!(target: LOG_TARGET, "🪧 fetched tapp manifest for: {:?}", &tapplet_manifest.id);

    let inserted_tapplet = store
        .create_tapplet(&CreateTapplet::from(tapplet_manifest))
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    // Create tapplet versions
    for (version, version_data) in tapplet_manifest.versions.iter() {
        store
            .create_tapplet_version(&CreateTappletVersion {
                tapplet_id: inserted_tapplet.id,
                version: version.to_string(),
                integrity: version_data.integrity.to_string(),
                registry_url: version_data.registry_url.to_string(),
            })
            .await
            .map_err(|e| InvokeError::from_error(e))?;
    }

    // TODO uncomment if assets available
    // Create tapplet assets
    // create_tapplet_assets(store, app_handle, &inserted_tapplet).await?;

    Ok(())
}

#[tauri::command]
pub async fn emit_tapplet_notification(
    _receiver_tapp_id: i32,
    notification: String,
    app_handle: tauri::AppHandle,
) -> CommandResult<bool> {
    TappletManager::emit_tapplet_notification(notification, &app_handle)
        .await
        .map_err(|e| InvokeError::from_anyhow(e))
}

#[tauri::command]
pub async fn start_tari_tapplet_binary(
    binary_name: &str,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<ActiveTapplet> {
    let binaries_resolver = BinaryResolver::current();
    let binary = Binaries::from_name(binary_name);
    let tapp_path = binaries_resolver
        .get_binary_path(binary)
        .await
        .map_err(|e| InvokeError::from_anyhow(e))?;

    let csp_bridge = "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
    let tapp_id = 0; // TODO: get from installed_tapp db

    let addr = start_tapplet_server(tapp_id, tapp_path, csp_bridge, &tapplet_manager).await?;

    Ok(ActiveTapplet {
        tapplet_id: 1000, // TODO: fix hardcoded value
        package_name: binary_name.to_string(),
        display_name: binary_name.to_string(),
        source: format!("http://{addr}"),
        version: "0.1.0".to_string(), // TODO: get actual version
    })
}

#[tauri::command]
pub async fn start_dev_tapplet(
    dev_tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<ActiveTapplet> {
    let store = SqliteStore::new(db_connection.0.clone());
    let mut dev_tapplet = store
        .get_dev_tapplet_by_id(dev_tapplet_id)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    // Check and update permissions if needed
    let permission_result = check_and_update_permissions(
        &dev_tapplet.source,
        &dev_tapplet.csp,
        &dev_tapplet.tari_permissions,
        app_handle,
    )
    .await?;

    if permission_result.should_update {
        dev_tapplet.csp = permission_result.updated_csp;
        dev_tapplet.tari_permissions = permission_result.updated_permissions;
        let updated_tapp = UpdateDevTapplet::from(&dev_tapplet);

        store
            .update_dev_tapplet(dev_tapplet_id, &updated_tapp)
            .await
            .map_err(|e| InvokeError::from_error(e))?;
        dev_tapplet = store
            .get_dev_tapplet_by_id(dev_tapplet_id)
            .await
            .map_err(|e| InvokeError::from_error(e))?;
    }

    let tapplet_path = PathBuf::from(&dev_tapplet.source);
    let addr = start_tapplet_server(
        dev_tapplet_id,
        tapplet_path,
        &dev_tapplet.csp,
        &tapplet_manager,
    )
    .await?;

    Ok(ActiveTapplet {
        tapplet_id: dev_tapplet_id,
        package_name: dev_tapplet.package_name,
        display_name: dev_tapplet.display_name,
        source: format!("http://{addr}"),
        version: "0.1.0".to_string(), // TODO: get actual version
    })
}

#[tauri::command]
pub async fn start_tapplet(
    tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<ActiveTapplet> {
    let store = SqliteStore::new(db_connection.0.clone());
    let mut installed_tapp = store
        .get_installed_tapplet_by_id(tapplet_id)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    let registered_tapplet_id = installed_tapp.tapplet_id.ok_or_else(|| {
        InvokeError::from_error(Error::DatabaseError(
            crate::tapplets::error::DatabaseError::FailedToRetrieveData {
                entity_name: "installed_tapplet.tapplet_id is None".to_string(),
            },
        ))
    })?;

    let (tapp, tapp_version) = store
        .get_registered_tapplet_with_version(registered_tapplet_id)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    // Check and update permissions if needed
    let permission_result = check_and_update_permissions(
        &installed_tapp.source,
        &installed_tapp.csp,
        &installed_tapp.tari_permissions,
        app_handle,
    )
    .await?;

    if permission_result.should_update {
        installed_tapp.csp = permission_result.updated_csp;
        installed_tapp.tari_permissions = permission_result.updated_permissions;
        let updated_tapp = UpdateInstalledTapplet::from(&installed_tapp);

        store
            .update_installed_tapplet(tapplet_id, &updated_tapp)
            .await
            .map_err(|e| InvokeError::from_error(e))?;
        installed_tapp = store
            .get_installed_tapplet_by_id(tapplet_id)
            .await
            .map_err(|e| InvokeError::from_error(e))?;
    }

    let tapplet_path = PathBuf::from(&installed_tapp.source);
    let addr = start_tapplet_server(
        tapplet_id,
        tapplet_path,
        &installed_tapp.csp,
        &tapplet_manager,
    )
    .await?;

    Ok(ActiveTapplet {
        tapplet_id,
        package_name: tapp.package_name,
        display_name: tapp.display_name,
        source: format!("http://{addr}"),
        version: tapp_version.version,
    })
}

#[tauri::command]
pub async fn stop_tapplet(
    tapplet_id: i32,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<String> {
    tapplet_manager.stop_server(tapplet_id).await.map_err(|e| {
        error!(target: LOG_TARGET, "Failed to stop tapplet with id {}: {}", tapplet_id, &e);
        InvokeError::from_error(e)
    })
}

#[tauri::command]
pub async fn restart_tapplet(
    tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<String> {
    let store = SqliteStore::new(db_connection.0.clone());
    let dev_tapplet = store
        .get_dev_tapplet_by_id(tapplet_id)
        .await
        .map_err(|e| InvokeError::from_error(e))?;
    let tapplet_path = PathBuf::from(&dev_tapplet.source);

    tapplet_manager
        .restart_server(tapplet_id, tapplet_path, &dev_tapplet.csp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to restart tapplet with id {}: {}", tapplet_id, &e);
            InvokeError::from_error(e)
        })
}

#[tauri::command]
pub async fn is_tapplet_server_running(
    tapplet_id: i32,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<bool> {
    Ok(tapplet_manager.is_server_running(tapplet_id).await)
}

#[tauri::command]
pub async fn fetch_registered_tapplets(
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> CommandResult<()> {
    let tapplets = fetch_tapp_registry_manifest()
        .await
        .map_err(|e| InvokeError::from_error(e))?;
    let store = SqliteStore::new(db_connection.0.clone());

    for tapplet_manifest in tapplets.registered_tapplets.values() {
        process_tapplet_manifest(&store, app_handle.clone(), tapplet_manifest).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn insert_tapp_registry_db(
    tapplet: CreateTapplet,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> CommandResult<Tapplet> {
    let store = SqliteStore::new(db_connection.0.clone());
    store
        .create_tapplet(&tapplet)
        .await
        .map_err(|e| InvokeError::from_error(e))
}

#[tauri::command]
pub async fn read_tapp_registry_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> CommandResult<Vec<Tapplet>> {
    let store = SqliteStore::new(db_connection.0.clone());
    store
        .get_all_tapplets()
        .await
        .map_err(|e| InvokeError::from_error(e))
}

#[tauri::command]
pub fn get_assets_server_addr(state: tauri::State<'_, AssetServer>) -> String {
    format!("http://{}", state.addr)
}

#[tauri::command]
pub async fn download_and_extract_tapp(
    tapplet_id: i32,
    app: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<InstalledTappletWithAssets> {
    let store = SqliteStore::new(db_connection.0.clone());
    let (tapp, tapp_version) = store
        .get_registered_tapplet_with_version(tapplet_id)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    // Get download path and download tarball
    let dest_dir = get_tapp_download_path(
        tapp.package_name.clone(),
        tapp_version.version.clone(),
        app.clone(),
    )
    .unwrap_or_default();

    let download_url = tapp_version.registry_url.clone();
    let fallback_url = tapp_version.registry_url.clone(); // TODO: change if fallback available

    let archive_dest_path = tapplet_manager
        .download_selected_version(download_url, fallback_url, dest_dir.clone())
        .await
        .map_err(|e| InvokeError::from_anyhow(e))?;

    // Validate checksum
    let is_valid = check_files_and_validate_checksum(
        tapp_version.version.clone(),
        tapp_version.integrity.clone(),
        archive_dest_path,
        dest_dir.clone(),
    )
    .map_err(|e| {
        error!(target: LOG_TARGET, "🚨 Error validating checksum: {:?}", e);
        InvokeError::from_error(e)
    })?;

    info!(target: LOG_TARGET, "✅ Checksum validation successful: {:?}", is_valid);

    let source = dest_dir.join("package").to_string_lossy().to_string();
    let tapp_config = get_tapp_config(&source).await.map_err(|e| e.to_string())?;

    let tapp_created = CreateInstalledTapplet {
        tapplet_id: tapp.id,
        tapplet_version_id: tapp_version.id,
        source,
        csp: tapp_config.csp,
        tari_permissions: tapp_config.permissions.all_permissions_to_string(),
    };

    let installed_tapp = store
        .create_installed_tapplet(&tapp_created)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    Ok(InstalledTappletWithAssets {
        installed_tapplet: InstalledTappletWithName {
            installed_tapplet: installed_tapp,
            display_name: tapp.display_name,
            installed_version: tapp_version.version.clone(),
            latest_version: tapp_version.version, // TODO: only latest version can be installed
        },
        tapplet_assets: TappletAssets {
            icon_url: tapp.logo_url,
            background_url: tapp.background_url,
        },
    })
}

#[tauri::command]
pub async fn read_installed_tapp_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> CommandResult<Vec<InstalledTappletWithName>> {
    let store = SqliteStore::new(db_connection.0.clone());
    store
        .get_installed_tapplets_with_display_name()
        .await
        .map_err(|e| InvokeError::from_error(e))
}

#[tauri::command]
pub async fn delete_installed_tapplet(
    tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<u64> {
    let store = SqliteStore::new(db_connection.0.clone());
    let (package_name, version) = store
        .get_installed_tapplet_package_and_version(tapplet_id)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    // Stop the tapplet first (ignore errors)
    let _ = stop_tapplet(tapplet_id, tapplet_manager).await;

    delete_tapplet_folder(package_name, version, app_handle)?;

    store.delete_installed_tapplet(tapplet_id).await.map_err(|e| {
        warn!(target: LOG_TARGET, "❌ Error while deleting tapplet id {:?} from db: {:?}", tapplet_id, e);
        InvokeError::from_error(e)
    })
}

#[tauri::command]
pub async fn update_installed_tapplet(
    tapplet_id: i32,
    installed_tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<Vec<InstalledTappletWithName>> {
    // Delete old installation (log errors but continue)
    let _ = delete_installed_tapplet(
        installed_tapplet_id,
        app_handle.clone(),
        db_connection.clone(),
        tapplet_manager.clone(),
    )
    .await
    .inspect_err(|e| {
        error!(
            "❌ Delete installed tapplet (id: {:?}) from db error: {:?}",
            tapplet_id, e
        )
    });

    // Download and extract new version
    let _ = download_and_extract_tapp(
        tapplet_id,
        app_handle,
        db_connection.clone(),
        tapplet_manager,
    )
    .await
    .inspect_err(|e| error!("❌ Download and extract tapplet process error: {:?}", e))?;

    // Return updated list
    let store = SqliteStore::new(db_connection.0.clone());
    store
        .get_installed_tapplets_with_display_name()
        .await
        .map_err(|e| InvokeError::from_error(e))
}

#[tauri::command]
pub async fn add_dev_tapplet(
    source: String,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> CommandResult<DevTapplet> {
    let tapp_config = get_tapp_config(&source).await?;

    info!("🌟 Add dev tapplet config: {:?}", &tapp_config);
    info!(
        "🌟 Add dev tapp permissions: {:?}",
        &tapp_config.permissions.all_permissions_to_string()
    );

    let store = SqliteStore::new(db_connection.0.clone());
    let new_dev_tapplet = CreateDevTapplet {
        source,
        package_name: tapp_config.package_name,
        display_name: tapp_config.display_name,
        csp: "default-src 'self';".to_string(), // Set default CSP and ask to allow from config
        tari_permissions: "requiredPermissions:[], optionalPermissions:[]".to_string(), // Set default permissions
    };

    store
        .create_dev_tapplet(&new_dev_tapplet)
        .await
        .map_err(|e| {
            warn!(target: LOG_TARGET, "❌ Error while adding dev tapplet to db: {:?}", e);
            InvokeError::from_error(e)
        })
}

#[tauri::command]
pub async fn read_dev_tapplets_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> CommandResult<Vec<DevTapplet>> {
    let store = SqliteStore::new(db_connection.0.clone());
    store.get_all_dev_tapplets().await.map_err(|e| {
        warn!(target: LOG_TARGET, "❌ Error while reading db: {:?}", e);
        InvokeError::from_error(e)
    })
}

#[tauri::command]
pub async fn delete_dev_tapplet(
    dev_tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> CommandResult<u64> {
    let store = SqliteStore::new(db_connection.0.clone());

    // Stop the tapplet first (ignore errors)
    let _ = stop_tapplet(dev_tapplet_id, tapplet_manager).await;

    store.delete_dev_tapplet(dev_tapplet_id).await.map_err(|e| {
        warn!(target: LOG_TARGET, "❌ Error while deleting dev tapplet id {:?} from db: {:?}", dev_tapplet_id, e);
        InvokeError::from_error(e)
    })
}

/// Registers the Bridge Tapplet as an installed tapplet in the database
pub async fn register_bridge_tapplet_in_database(
    app_handle: tauri::AppHandle,
) -> Result<(), anyhow::Error> {
    let db_connection = app_handle.state::<DatabaseConnection>();
    let store = SqliteStore::new(db_connection.0.clone());

    // Check if bridge tapplet is already registered
    if let Ok(Some(_)) = store.get_tapplet_by_name("wxtm-bridge".to_string()).await {
        info!(target: LOG_TARGET, "💎💎 Bridge tapplet already registered in database");
        return Ok(());
    }

    let binary_resolver = BinaryResolver::current();
    let tapp_path = binary_resolver
        .get_binary_path(Binaries::BridgeTapplet)
        .await?;

    let version = binary_resolver
        .get_binary_version(Binaries::BridgeTapplet)
        .await;
    // let tapp_version_id = store.get_tapplet_version_by_id(id)

    // Create the bridge tapplet entry
    let create_tapp = CreateTapplet {
        package_name: "wxtm-bridge".to_string(),
        display_name: "WXTM Bridge".to_string(),
        logo_url: "".to_string(),
        background_url: "".to_string(),
        author_name: "".to_string(),
        author_website: "".to_string(),
        about_summary: "".to_string(),
        about_description: "".to_string(),
        category: "".to_string(),
    };

    // Insert with specific ID - you'll need to add this method to SqliteStore
    let tapp_registered = store
        // .create_installed_tapplet_with_id(BRIDGE_TAPPLET_ID, &bridge_tapplet) // TODO does tapp_id need to be fixed in this case?
        .create_tapplet(&create_tapp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to register bridge tapplet: {}", e);
            anyhow::anyhow!("Failed to register bridge tapplet: {}", e)
        })?;
    info!(target: LOG_TARGET, "💎💎 Bridge tapplet registered successfully with ID: {:?}", tapp_registered.id.unwrap());
    // Create the bridge tapplet entry
    let ver_tapp = CreateTappletVersion {
        tapplet_id: tapp_registered.id,
        version: version,
        integrity: "".to_string(),
        registry_url: "".to_string(),
    };

    // Insert with specific ID - you'll need to add this method to SqliteStore
    let tapp_version = store
        // .create_installed_tapplet_with_id(BRIDGE_TAPPLET_ID, &bridge_tapplet) // TODO does tapp_id need to be fixed in this case?
        .create_tapplet_version(&ver_tapp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to register bridge tapplet: {}", e);
            anyhow::anyhow!("Failed to register bridge tapplet: {}", e)
        })?;
    info!(target: LOG_TARGET, "💎💎 Bridge tapplet version successfully with ID: {:?}", tapp_version.id.unwrap());

    // Create the bridge tapplet entry
    let install_tapp = CreateInstalledTapplet {
        tapplet_id: tapp_registered.id, // No registry entry for bridge tapplet
        tapplet_version_id: tapp_version.id, // No version entry for bridge tapplet
        source: tapp_path.to_string_lossy().to_string(),
        csp: "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'".to_string(),
        tari_permissions: "requiredPermissions:[], optionalPermissions:[]".to_string(),
    };
    // Insert with specific ID - you'll need to add this method to SqliteStore
    let installed_tapp = store
        // .create_installed_tapplet_with_id(BRIDGE_TAPPLET_ID, &install_tapp) // TODO does tapp_id need to be fixed in this case?
        .create_installed_tapplet(&install_tapp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to insert installed bridge tapplet: {}", e);
            anyhow::anyhow!("Failed to insert installed bridge tapplet: {}", e)
        })?;

    info!(target: LOG_TARGET, "💎💎 Installed Bridge tapplet inserted successfully with ID: {:?}", installed_tapp.id.unwrap());
    Ok(())
}
