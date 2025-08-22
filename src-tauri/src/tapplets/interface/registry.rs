use std::collections::HashMap;

use serde::Serialize;
use tokio_util::sync::CancellationToken;

use crate::{
    database::models::{InstalledTapplet, TappletVersion},
    tapplets::error::Error,
};

#[derive(Debug, serde::Deserialize)]
pub struct RegisteredTapplets {
    #[serde(rename = "manifestVersion")]
    pub manifest_version: String,
    #[serde(rename = "registeredTapplets")]
    pub registered_tapplets: HashMap<String, TappletRegistryManifest>,
}

#[derive(Debug, serde::Deserialize)]
pub struct TappletRegistryManifest {
    pub id: String,
    pub metadata: Metadata,
    pub versions: HashMap<String, Version>,
}

#[derive(Debug, serde::Deserialize, Clone)]
pub struct Metadata {
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "logoPath")]
    #[serde(default)]
    pub logo_url: String,
    #[serde(rename = "backgroundUrl")]
    #[serde(default)]
    pub background_url: String,
    #[serde(default)]
    pub author: Author,
    #[serde(default)]
    pub about: About,
    #[serde(default)]
    pub audits: Vec<Audit>,
    #[serde(default)]
    pub category: String,
}

impl Default for Metadata {
    fn default() -> Self {
        Metadata {
            display_name: "".to_string(),
            logo_url: "".to_string(),
            background_url: "".to_string(),
            author: Author::default(),
            about: About::default(),
            audits: vec![],
            category: "".to_string(),
        }
    }
}

#[derive(Debug, serde::Deserialize, Clone)]
pub struct Version {
    pub integrity: String,
    #[serde(rename = "registryUrl")]
    pub registry_url: String,
}

#[derive(Debug, serde::Deserialize, Clone)]
pub struct Author {
    pub name: String,
    pub website: String,
}

impl Default for Author {
    fn default() -> Self {
        Author {
            name: "".to_string(),
            website: "".to_string(),
        }
    }
}

#[derive(Debug, serde::Deserialize, Clone)]
pub struct About {
    pub summary: String,
    pub description: String,
}

impl Default for About {
    fn default() -> Self {
        About {
            summary: "".to_string(),
            description: "".to_string(),
        }
    }
}

#[derive(Debug, serde::Deserialize, Clone)]
pub struct Audit {
    pub auditor: String,
    #[serde(rename = "reportUrl")]
    pub report_url: String,
}

impl Default for Audit {
    fn default() -> Self {
        Audit {
            auditor: "".to_string(),
            report_url: "".to_string(),
        }
    }
}

#[derive(Serialize)]
pub struct InstalledTappletWithName {
    pub installed_tapplet: InstalledTapplet,
    pub display_name: String,
    pub installed_version: String,
    pub latest_version: String,
}

#[derive(Serialize)]
pub struct TappletAssets {
    pub icon_url: String,
    pub background_url: String,
}

#[derive(Serialize)]
pub struct InstalledTappletWithAssets {
    #[serde(flatten)]
    pub installed_tapplet: InstalledTappletWithName,
    #[serde(flatten)]
    pub tapplet_assets: TappletAssets,
}

#[derive(Debug)]
pub struct TappletSemver {
    pub tapplet_version: TappletVersion,
    pub semver: semver::Version,
}

impl TryFrom<TappletVersion> for TappletSemver {
    type Error = Error;
    fn try_from(value: TappletVersion) -> Result<Self, Self::Error> {
        let semver =
            semver::Version::parse(&value.version).map_err(|_| Error::VersionParseError)?;
        Ok(Self {
            tapplet_version: value,
            semver,
        })
    }
}

pub struct AssetServer {
    pub addr: String,
    pub cancel_token: CancellationToken,
}
