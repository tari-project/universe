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
    #[serde(rename = "logoUrl")]
    pub logo_url: String,
    #[serde(rename = "backgroundUrl")]
    pub background_url: String,
    pub author: Author,
    pub about: About,
    // pub audits: Vec<Audit>,
    pub category: String,
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

#[derive(Debug, serde::Deserialize, Clone)]
pub struct About {
    pub summary: String,
    pub description: String,
}

#[derive(Debug, serde::Deserialize, Clone)]
pub struct Audit {
    pub auditor: String,
    #[serde(rename = "reportUrl")]
    pub report_url: String,
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
