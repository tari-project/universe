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
    CreateTappletAudit, CreateTappletVersion, DevTapplet, InstalledTapplet, Tapplet,
    UpdateDevTapplet, UpdateInstalledTapplet,
};

use crate::database::store::{DatabaseConnection, SqliteStore, Store};
use crate::tapplets::error::Error;
use crate::tapplets::interface::{
    ActiveTapplet, AssetServer, InstalledTappletWithAssets, InstalledTappletWithName, TappletAssets,
};
use crate::tapplets::tapplet_installer::{
    check_files_and_validate_checksum, delete_tapplet, download_asset,
    fetch_tapp_registry_manifest, get_tapp_download_path,
};
use crate::tapplets::tapplet_manager::TappletManager;
use crate::tapplets::tapplet_server::get_tapp_config;
use crate::UniverseAppState;
use axum::http::HeaderValue;
use log::{error, info, warn};
use tauri::ipc::InvokeError;

const LOG_TARGET: &str = "tari::universe::tapplets";

#[tauri::command]
pub async fn update_csp_policy(
    csp: String,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    info!(target: LOG_TARGET, "👉👉👉 Update csp command {:?}", &csp);
    match HeaderValue::from_str(&csp) {
        Ok(header_value) => {
            // let mut write_lock = state.tapplet_csp_header.write().await;
            // *write_lock = header_value;
            // TODO restart tapplet with the new csp
            info!(target: LOG_TARGET, "👉👉👉 Updated success");
            Ok(())
        }
        Err(e) => Err(format!("Invalid CSP header string: {:?}", e)),
    }
}

#[tauri::command]
pub async fn emit_tapplet_notification(
    receiver_tapp_id: i32,
    notification: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, InvokeError> {
    info!(target: LOG_TARGET, "👉👉👉 nofitication {:?} for the tapp {}", &notification, receiver_tapp_id);
    let resp = TappletManager::emit_tapplet_notification(notification, &app_handle)
        .await
        .map_err(|e| InvokeError::from_anyhow(e))?;
    Ok(resp)
}

// the tapplet is not a binary, it's a compressed dir, but the process of downloading
// the appropriate version and checking the checksum is the same as for the binary
#[tauri::command]
pub async fn start_tari_tapplet_binary(
    binary_name: &str,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<ActiveTapplet, InvokeError> {
    let binaries_resolver = BinaryResolver::current();

    let binary = Binaries::from_name(binary_name);
    let tapp_path = binaries_resolver
        .resolve_path_to_binary_files(binary)
        .await
        .map_err(|e| InvokeError::from_anyhow(e))?;

    info!(target: LOG_TARGET, "💥 Built-in tapplet start: {:?}", &tapp_path);
    let csp_bridge = String::from("default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    let tapp_id = 0; //TODO get from installed_tapp db

    // TODO csp should be taken from the tapplet config, the bridge tapplet is exception because is 'built-in' by us
    // let config = get_tapp_config(&tapp_path.to_string_lossy())
    //     .await
    //     .map_err(|e| {
    //         error!(target: LOG_TARGET, "Failed to start tapplet with id {}: {}", tapp_id, &e);
    //         e.to_string()
    //     })?;
    // let csp_header = HeaderValue::from_str(&config.csp).unwrap();

    // TODO only our tapplet should get by default 'insafe-inline'
    // see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy#unsafe-inline
    // const DEFAULT_TARI_BINARY_TAPPLET_CSP: &str =
    //     "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
    // let handle_start = tauri::async_runtime::spawn(async move {
    //     start_tapplet_server(tapp_dest_dir, &DEFAULT_TARI_BINARY_TAPPLET_CSP.to_string()).await
    // });

    let addr = tapplet_manager
        .start_server(tapp_id, tapp_path, &csp_bridge)
        .await
        .map_err(|e| InvokeError::from_error(e))?;

    let is_running = tapplet_manager.is_server_running(tapp_id).await;
    info!(target: LOG_TARGET, "🎉🎉🎉 TAPP IS RUNNING: {:?} at address {:?}", is_running, addr);
    // TODO
    Ok(ActiveTapplet {
        tapplet_id: 1000,
        display_name: binary_name.to_string(),
        source: format!("http://{addr}"),
        version: "0.1.0".to_string(), //TODO
    })
}

#[tauri::command]
pub async fn start_dev_tapplet(
    dev_tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<ActiveTapplet, InvokeError> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    info!(target: LOG_TARGET, "💥 Try to launch dev id: {:?}", &dev_tapplet_id);

    let mut dev_tapplet: DevTapplet = tapplet_store
        .get_by_id(dev_tapplet_id)
        .map_err(|e| InvokeError::from_error(e))?;

    let result = TappletManager::check_permissions_config(
        &dev_tapplet.source,
        &dev_tapplet.csp,
        &dev_tapplet.tari_permissions,
        app_handle,
    )
    .await
    .map_err(|e| InvokeError::from_anyhow(e))?;

    if result.should_update {
        dev_tapplet.csp = result.updated_csp;
        dev_tapplet.tari_permissions = result.updated_permissions;
        let updated_tapp = UpdateDevTapplet::from(&dev_tapplet);

        let _ = tapplet_store
            .update(dev_tapplet, &updated_tapp)
            .map_err(|e| e.to_string())?;
        dev_tapplet = tapplet_store
            .get_by_id(dev_tapplet_id)
            .map_err(|e| e.to_string())?;
    }

    let tapplet_path = PathBuf::from(&dev_tapplet.source);

    let addr = tapplet_manager
        .start_server(dev_tapplet_id, tapplet_path, &dev_tapplet.csp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to start tapplet with id {}: {}", dev_tapplet_id, &e);
           InvokeError::from_error(e);
        })?;

    let is_running = tapplet_manager.is_server_running(dev_tapplet_id).await;
    info!(target: LOG_TARGET, "🎉🎉🎉 IS RUNNING: {:?} at address {:?}", is_running, addr);
    Ok(ActiveTapplet {
        tapplet_id: dev_tapplet_id,
        display_name: dev_tapplet.display_name,
        source: format!("http://{addr}"),
        version: "0.1.0".to_string(), //TODO
    })
}

#[tauri::command]
pub async fn start_tapplet(
    tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<ActiveTapplet, InvokeError> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    info!(target: LOG_TARGET, "💥 Try to run tapplet id: {:?}", &tapplet_id);

    let mut installed_tapp: InstalledTapplet = tapplet_store
        .get_by_id(tapplet_id)
        .map_err(|e| InvokeError::from_error(e))?;
    let tapplet_path = PathBuf::from(&installed_tapp.source);

    let result = TappletManager::check_permissions_config(
        &installed_tapp.source,
        &installed_tapp.csp,
        &installed_tapp.tari_permissions,
        app_handle,
    )
    .await
    .map_err(|e| InvokeError::from_anyhow(e))?;

    if result.should_update {
        installed_tapp.csp = result.updated_csp;
        installed_tapp.tari_permissions = result.updated_permissions;
        let updated_tapp = UpdateInstalledTapplet::from(&installed_tapp);

        let _ = tapplet_store
            .update(installed_tapp, &updated_tapp)
            .map_err(|e| InvokeError::from_error(e))?;
        installed_tapp = tapplet_store
            .get_by_id(tapplet_id)
            .map_err(|e| InvokeError::from_error(e))?;
    }

    let addr = tapplet_manager
        .start_server(tapplet_id, tapplet_path, &installed_tapp.csp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to start tapplet with id {}: {}", tapplet_id, &e);
            InvokeError::from_error(e)
        })?;
    let is_running = tapplet_manager.is_server_running(tapplet_id).await;
    info!(target: LOG_TARGET, "🎉🎉🎉 IS RUNNING: {:?} at address {:?}", is_running, addr);
    Ok(ActiveTapplet {
        tapplet_id: tapplet_id,
        display_name: "display_name".to_string(), //TODO,
        source: format!("http://{addr}"),
        version: "0.1.0".to_string(), //TODO
    })
}

#[tauri::command]
pub async fn stop_tapplet(
    tapplet_id: i32,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<String, InvokeError> {
    info!(target: LOG_TARGET, "👉👉👉 stop tapp id: {:?}", &tapplet_id);

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
) -> Result<String, InvokeError> {
    info!(target: LOG_TARGET, "👉👉👉 restart tapp id: {:?}", &tapplet_id);
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    let dev_tapplet: DevTapplet = tapplet_store
        .get_by_id(tapplet_id)
        .map_err(InvokeError::from_error)?;

    let tapplet_path = PathBuf::from(&dev_tapplet.source);

    let address = tapplet_manager
        .restart_server(tapplet_id, tapplet_path, &dev_tapplet.csp)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to restart tapplet with id {}: {}", tapplet_id, &e);
            InvokeError::from_error(e)
        })?;

    Ok(address) // Return Ok result wrapping the address string
}

#[tauri::command]
pub async fn is_tapplet_server_running(
    tapplet_id: i32,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<bool, InvokeError> {
    info!(target: LOG_TARGET, "👉👉👉 stop tapp id: {:?}", &tapplet_id);
    let is_running = tapplet_manager.is_server_running(tapplet_id).await;
    Ok(is_running)
}

#[tauri::command]
pub async fn fetch_registered_tapplets(
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<(), InvokeError> {
    let tapplets = fetch_tapp_registry_manifest().await.map_err(|e| {
        InvokeError::from_error(e);
    })?;
    let mut store = SqliteStore::new(db_connection.0.clone());

    for tapplet_manifest in tapplets.registered_tapplets.values() {
        let inserted_tapplet = store
            .create(&CreateTapplet::from(tapplet_manifest))
            .map_err(|e| e.to_string())?;

        // TODO uncomment if audit data in manifest
        for audit_data in tapplet_manifest.metadata.audits.iter() {
            let _ = store
                .create(
                    &(CreateTappletAudit {
                        tapplet_id: inserted_tapplet.id,
                        auditor: &audit_data.auditor,
                        report_url: &audit_data.report_url,
                    }),
                )
                .map_err(|e| InvokeError::from_error(e))?;
        }

        for (version, version_data) in tapplet_manifest.versions.iter() {
            let _ = store
                .create(
                    &(CreateTappletVersion {
                        tapplet_id: inserted_tapplet.id,
                        version: &version,
                        integrity: &version_data.integrity,
                        registry_url: &version_data.registry_url,
                    }),
                )
                .map_err(|e| InvokeError::from_error(e))?;
        }
        match store.get_tapplet_assets_by_tapplet_id(inserted_tapplet.id.unwrap()) {
            Ok(Some(_)) => {}
            Ok(None) => {
                match download_asset(app_handle.clone(), inserted_tapplet.tapp_registry_id).await {
                    Ok(tapplet_assets) => {
                        let _ = store
                            .create(
                                &(CreateTappletAsset {
                                    tapplet_id: inserted_tapplet.id,
                                    icon_url: &tapplet_assets.icon_url,
                                    background_url: &tapplet_assets.background_url,
                                }),
                            )
                            .map_err(|e| e.to_string());
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Could not download tapplet assets: {}", e);
                    }
                }
            }
            Err(e) => {
                return Err(InvokeError::from_error(e));
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn insert_tapp_registry_db(
    tapplet: CreateTapplet,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Tapplet, InvokeError> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store
        .create(&tapplet)
        .map_err(|e| InvokeError::from_error(e))
}

#[tauri::command]
pub fn read_tapp_registry_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Vec<Tapplet>, InvokeError> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store
        .get_all()
        .map_err(|e| InvokeError::from_error(e))
}

#[tauri::command]
pub fn get_assets_server_addr(state: tauri::State<'_, AssetServer>) -> String {
    format!("http://{}", state.addr)
}

#[tauri::command]
pub async fn download_and_extract_tapp(
    tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
    app: tauri::AppHandle,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<InstalledTappletWithAssets, InvokeError> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    // let (tapp, tapp_version) = tapplet_store.get_registered_tapplet_with_version(tapplet_id);
    let (tapp, tapp_version) = match tapplet_store.get_registered_tapplet_with_version(tapplet_id) {
        Ok((tapp, tapp_version)) => (tapp, tapp_version),
        Err(e) => {
            return Err(InvokeError::from_error(e));
        }
    };

    // get download path
    let dest_dir = get_tapp_download_path(
        tapp.tapp_registry_id.clone(),
        tapp_version.version.clone(),
        app.clone(),
    )
    .unwrap_or_default();
    // download tarball
    let download_url = tapp_version.registry_url.clone();
    let fallback_url = tapp_version.registry_url.clone(); //TODO change if fallback available

    let archive_dest_path = match tapplet_manager
        .download_selected_version(download_url, fallback_url, dest_dir.clone())
        .await
    {
        Ok(path) => path,
        Err(e) => {
            return Err(InvokeError::from_anyhow(e));
        }
    };

    //TODO should compare integrity field with the one stored in db or from github manifest?
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

    info!(target: LOG_TARGET, "✅ Checksum validation successfully with test result: {:?}", is_valid);
    let source = dest_dir.join("package").to_string_lossy().to_string();

    let tapp_config = get_tapp_config(&source).await.map_err(|e| e.to_string())?;

    let tapp_created = CreateInstalledTapplet {
        tapplet_id: tapp.id,
        tapplet_version_id: tapp_version.id,
        source: source,
        csp: tapp_config.csp,
        tari_permissions: tapp_config.permissions.all_permissions_to_string(),
    };
    let installed_tapp = tapplet_store
        .create(&tapp_created)
        .map_err(|e| e.to_string())?;

    Ok(InstalledTappletWithAssets {
        installed_tapplet: InstalledTappletWithName {
            installed_tapplet: installed_tapp,
            display_name: tapp.display_name,
            installed_version: tapp_version.version.clone(),
            latest_version: tapp_version.version, //TODO at the moment only latest version can be installed
        },
        tapplet_assets: TappletAssets {
            icon_url: tapp.logo_url,
            background_url: tapp.background_url,
        },
    })
}

#[tauri::command]
pub fn read_installed_tapp_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Vec<InstalledTappletWithName>, Error> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store.get_installed_tapplets_with_display_name()
}

#[tauri::command]
pub fn update_installed_tapp_db(
    tapplet: UpdateInstalledTapplet,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<usize, Error> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    let tapplets: Vec<InstalledTapplet> = tapplet_store.get_all()?;
    let first: InstalledTapplet = tapplets.into_iter().next().unwrap();
    tapplet_store.update(first, &tapplet)
}

#[tauri::command]
pub async fn delete_installed_tapplet(
    tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<usize, Error> {
    let mut store = SqliteStore::new(db_connection.0.clone());
    let (_installed_tapp, registered_tapp, tapp_version) =
        store.get_installed_tapplet_full_by_id(tapplet_id)?;
    let tapplet_path = get_tapp_download_path(
        registered_tapp.tapp_registry_id,
        tapp_version.version,
        app_handle,
    )
    .unwrap();
    let _ = stop_tapplet(tapplet_id, tapplet_manager).await;
    delete_tapplet(tapplet_path)?;

    let installed_tapplet: InstalledTapplet = store.get_by_id(tapplet_id)?;
    store.delete(installed_tapplet)
}

#[tauri::command]
pub async fn update_installed_tapplet(
    tapplet_id: i32,
    installed_tapplet_id: i32,
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<Vec<InstalledTappletWithName>, Error> {
    let _ = delete_installed_tapplet(
        installed_tapplet_id,
        app_handle,
        db_connection.clone(),
        tapplet_manager,
    )
    .await
    .inspect_err(|e| {
        error!(
            "❌ Delete installed tapplet (id: {:?}) from db error: {:?}",
            tapplet_id, e
        )
    });

    // TODO
    // let _ = download_and_extract_tapp(tapplet_id, db_connection.clone(), app_handle.clone())
    //     .await
    //     .inspect_err(|e| error!("❌ Download and extract tapplet process error: {:?}", e));

    // let _ = insert_installed_tapp_db(tapplet_id, db_connection.clone())
    //     .inspect_err(|e| error!("❌ Insert installed tapplet to db error: {:?}", e));

    let mut store = SqliteStore::new(db_connection.0.clone());
    let installed_tapplets = store.get_installed_tapplets_with_display_name().unwrap();

    return Ok(installed_tapplets);
}

#[tauri::command]
pub async fn add_dev_tapplet(
    source: String,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<DevTapplet, Error> {
    let tapp_config = get_tapp_config(&source).await?;

    info!("🌟 Add dev tapplet config: {:?}", &tapp_config);
    info!(
        "🌟 Add dev tapp permissions: {:?}",
        &tapp_config.permissions.all_permissions_to_string()
    );
    let mut store = SqliteStore::new(db_connection.0.clone());
    let new_dev_tapplet = CreateDevTapplet {
        source: &source,
        package_name: &tapp_config.package_name,
        display_name: &tapp_config.display_name,
        csp: "default-src 'self';", //set default csp and then ask to allow from config
        tari_permissions: "requiredPermissions:[], optionalPermissions:[]", //set default permissions and then ask to allow from config
    };
    match store.create(&new_dev_tapplet) {
        Ok(dev_tapplet) => {
            info!(target: LOG_TARGET,"✅ Dev tapplet added to db successfully: {:?}", new_dev_tapplet);
            Ok(dev_tapplet)
        }
        Err(e) => {
            warn!(target: LOG_TARGET, "❌ Error while adding dev tapplet (source {:?}) to db: {:?}", source, e);
            return Err(e);
        }
    }
}

#[tauri::command]
pub fn read_dev_tapplets_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Vec<DevTapplet>, InvokeError> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store.get_all_dev_tapplets().map_err(|e| {
        warn!(target: LOG_TARGET, "❌ Error while reading db: {:?}", e);
        InvokeError::from_error(e)
    })
}

#[tauri::command]
pub async fn delete_dev_tapplet(
    dev_tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
    tapplet_manager: tauri::State<'_, TappletManager>,
) -> Result<usize, InvokeError> {
    let mut store = SqliteStore::new(db_connection.0.clone());

    let dev_tapplet: DevTapplet = store.get_by_id(dev_tapplet_id).map_err(|e| {
        warn!(target: LOG_TARGET, "❌ Error fetching dev tapplet id {:?}: {:?}", dev_tapplet_id, e);
        InvokeError::from_error(e)
    })?;

    let _ = stop_tapplet(dev_tapplet_id, tapplet_manager).await;

    store.delete(dev_tapplet)
        .map(|deleted_rows| {
            info!(target: LOG_TARGET, "✅ Dev tapplet with id {:?} deleted from db successfully", dev_tapplet_id);
            deleted_rows
        })
        .map_err(|e| {
            warn!(target: LOG_TARGET, "❌ Error while deleting dev tapplet id {:?} from db: {:?}", dev_tapplet_id, e);
            InvokeError::from_error(e)
        })
}
