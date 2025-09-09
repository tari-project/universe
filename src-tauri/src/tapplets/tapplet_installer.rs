use crate::{
    consts::{TAPPLETS_ASSETS_DIR, TAPPLETS_INSTALLED_DIR},
    tapplets::{
        error::{
            Error::{self, IOError, JsonParsingError, RequestError},
            IOError::*,
            RequestError::*,
        },
        hash_calculator::calculate_checksum,
        interface::{RegisteredTapplets, TappletAssets, TappletConfig, TappletPermissions},
    },
};
use log::{error, info, warn};
use std::{
    fs::{self},
    io::Write,
    path::PathBuf,
};
use tauri::Manager;
pub const LOG_TARGET: &str = "tari::universe";
pub const REGISTRY_URL: &str = env!("TAPP_REGISTRY_URL");
pub const DOWNLOAD_ASSETS: bool = false; //TODO temporarly disable assets download

pub fn delete_tapplet_folder(
    package_name: String,
    version: String,
    app_handle: tauri::AppHandle,
) -> Result<(), Error> {
    let tapplet_path = get_tapp_download_path(package_name.clone(), version, app_handle)?;

    let path = tapplet_path
        .clone()
        .into_os_string()
        .into_string()
        .map_err(|_| IOError(FailedToGetFilePath))?;

    fs::remove_dir_all(&tapplet_path).map_err(|_| IOError(FailedToDeleteTapplet { path }))?;

    if let Some(package_dir) = tapplet_path.parent() {
        // Check if the package directory is empty (no other versions remain)
        match fs::read_dir(package_dir) {
            Ok(mut entries) => {
                if entries.next().is_none() {
                    let package_path = package_dir
                        .to_path_buf()
                        .into_os_string()
                        .into_string()
                        .map_err(|_| IOError(FailedToGetFilePath))?;

                    fs::remove_dir(package_dir)
                        .map_err(|_| IOError(FailedToDeleteTapplet { path: package_path }))?;

                    info!(target: LOG_TARGET, "Removed empty package directory: {}", package_name);
                }
            }
            Err(_) => {
                // If we can't read the directory, it might not exist or we don't have permissions
                // This is not a critical error, so we'll just log a warning
                warn!(target: LOG_TARGET, "Could not read package directory to check if empty: {}", package_name);
            }
        }
    }

    Ok(())
}

pub fn check_extracted_files(tapplet_path: PathBuf) -> Result<bool, Error> {
    // TODO define all needed files
    // universe.tari/tapplets_installed/<tapplet_name>/<version>/package
    info!(target: LOG_TARGET, "Checking extracted files: {:?}", &tapplet_path);

    let tapp_dir: PathBuf = tapplet_path.join("package");
    let pkg_json_file = tapp_dir.join("package.json");
    // let manifest_file = tapp_dir.join("dist").join("tapplet.manifest.json");
    let path = tapplet_path
        .into_os_string()
        .into_string()
        .map_err(|_| IOError(FailedToGetFilePath))?;

    if pkg_json_file.exists() {
        Ok(true)
    } else {
        Err(IOError(InvalidUnpackedFiles { path }))
    }
}

pub fn get_tapp_download_path(
    package_name: String,
    version: String,
    app_handle: tauri::AppHandle,
) -> Result<PathBuf, Error> {
    // app_path = /home/user/.local/share/universe.tari
    let app_path = app_handle
        .path()
        .app_data_dir()
        .expect("Could not get data dir");

    let tapplet_path = app_path
        .join(TAPPLETS_INSTALLED_DIR)
        .join(package_name)
        .join(version);

    Ok(tapplet_path)
}

async fn download_asset_file(url: &str, dest: PathBuf) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let mut response = client.get(url).send().await.map_err(|_| {
        RequestError(FailedToDownload {
            url: url.to_string(),
        })
    })?;

    if response.status().is_success() {
        let dest_parent = dest.parent().unwrap();
        let path = dest
            .clone()
            .into_os_string()
            .into_string()
            .map_err(|_| IOError(FailedToGetFilePath))?;
        fs::create_dir_all(&dest_parent).map_err(|_| {
            IOError(FailedToCreateDir {
                path: dest_parent.to_str().unwrap().to_owned(),
            })
        })?;

        let mut file = fs::File::create(dest)
            .map_err(|_| IOError(FailedToCreateFile { path: path.clone() }))?;

        while let Some(chunk) = response.chunk().await.map_err(|_| {
            RequestError(FailedToDownload {
                url: url.to_string(),
            })
        })? {
            file.write_all(&chunk)
                .map_err(|_| IOError(FailedToWriteFile { path: path.clone() }))?;
        }
    } else if response.status().is_server_error() {
        error!(target: LOG_TARGET, "❌ Download server error! Status: {:?}", response.status());
    } else {
        error!(target: LOG_TARGET, "❌ Download failed! Unknown status. Server response: {:?}", response);
    }

    Ok(())
}

fn get_or_create_tapp_asset_dir(
    tapp_root_dir: PathBuf,
    tapplet_name: &str,
) -> Result<PathBuf, Error> {
    let tapp_asset_dir = tapp_root_dir.join(TAPPLETS_ASSETS_DIR).join(tapplet_name);
    let path = tapp_asset_dir
        .clone()
        .into_os_string()
        .into_string()
        .map_err(|_| IOError(FailedToGetFilePath))?;
    fs::create_dir_all(path.clone()).map_err(|_| IOError(FailedToCreateDir { path }))?;
    return Ok(tapp_asset_dir);
}

pub async fn download_asset(
    app_handle: tauri::AppHandle,
    tapplet_name: String,
) -> Result<TappletAssets, Error> {
    let tapp_root_dir: PathBuf = app_handle
        .path()
        .app_data_dir()
        .expect("Could not get data dir");
    let tapp_asset_dir = get_or_create_tapp_asset_dir(tapp_root_dir, &tapplet_name)?;
    let assets = get_asset_urls(tapplet_name)?;

    let icon_dest = tapp_asset_dir.join("logo.svg");
    let background_dest = tapp_asset_dir.join("background.svg");

    // TODO fix downloading tapp assest
    if DOWNLOAD_ASSETS && !assets.background_url.is_empty() && !assets.icon_url.is_empty() {
        download_asset_file(&assets.icon_url, icon_dest.clone()).await?;
        download_asset_file(&assets.background_url, background_dest.clone()).await?;
    }

    Ok(TappletAssets {
        icon_url: icon_dest.into_os_string().into_string().unwrap(),
        background_url: background_dest.into_os_string().into_string().unwrap(),
    })
}

pub fn get_asset_urls(tapplet_name: String) -> Result<TappletAssets, Error> {
    let icon = format!("{}/src/{}/images/logo.svg", REGISTRY_URL, tapplet_name);
    let background = format!(
        "{}/src/{}/images/background.svg",
        REGISTRY_URL, tapplet_name
    );
    Ok(TappletAssets {
        icon_url: icon,
        background_url: background,
    })
}

pub async fn fetch_tapp_registry_manifest() -> Result<RegisteredTapplets, Error> {
    let manifest_endpoint = format!("{}/dist/tapplets-registry.manifest.json", REGISTRY_URL);

    let response = reqwest::get(&manifest_endpoint).await.map_err(|_| {
        RequestError(FetchManifestError {
            endpoint: manifest_endpoint.clone(),
        })
    })?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(RequestError(ManifestResponseError {
            endpoint: manifest_endpoint,
            e: "Manifest not found".to_string(),
        }));
    }

    let manifest_res = response.text().await.map_err(|error| {
        RequestError(ManifestResponseError {
            endpoint: manifest_endpoint.clone(),
            e: error.to_string(),
        })
    })?;

    let tapplets: RegisteredTapplets =
        serde_json::from_str(&manifest_res).map_err(|e| JsonParsingError(e))?;
    info!(target: LOG_TARGET, "📋 Tapplet Registry manifest v{} fetched: {:?}", &tapplets.manifest_version, &manifest_endpoint);
    Ok(tapplets)
}

pub fn check_files_and_validate_checksum(
    tapplet_version: String,
    expected_integrity: String,
    archieve_dir: PathBuf,
    dest_dir: PathBuf,
) -> Result<bool, Error> {
    let is_package_complete = check_extracted_files(dest_dir.clone())?;
    if !is_package_complete {
        return Err(Error::TappletIncomplete {
            version: tapplet_version.clone(),
        });
    }
    // calculate `integrity` from downloaded archieve file
    let integrity = calculate_checksum(archieve_dir)?;
    match expected_integrity == integrity {
        true => Ok(true),
        false => Err(Error::InvalidChecksum {
            version: tapplet_version,
        }),
    }
}

pub fn _get_tapp_permissions(tapp_path: PathBuf) -> Result<TappletPermissions, Error> {
    // tapp_dir = universe.tari/tapplets_installed/<tapplet_name>/<version>/package
    let tapp_dir: PathBuf = tapp_path.join("package");
    let tapp_config = tapp_dir.join("dist").join("tapplet.config.json");
    if !tapp_config.exists() {
        warn!(target: LOG_TARGET, "❌ Failed to get Tapplet permissions. Config file not found.");
        return Ok(TappletPermissions {
            required_permissions: vec![],
            optional_permissions: vec![],
        });
    }

    let config = fs::read_to_string(tapp_config.clone()).unwrap_or_default();
    let tapplet: TappletConfig = serde_json::from_str(&config).map_err(|e| JsonParsingError(e))?;
    Ok(TappletPermissions {
        required_permissions: tapplet.permissions.required_permissions,
        optional_permissions: tapplet.permissions.optional_permissions,
    })
}
