use serde::Serialize;

use crate::{
    database::models::{InstalledTapplet, Tapplet, TappletVersion},
    error::Error,
};

#[derive(Serialize)]
pub struct InstalledTappletWithName {
    pub installed_tapplet: InstalledTapplet,
    pub display_name: String,
    pub installed_version: String,
    pub latest_version: String,
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

#[derive(Serialize)]
pub struct RegisteredTappletWithVersion {
    pub registered_tapp: Tapplet,
    pub tapp_version: TappletVersion,
}

#[derive(Serialize)]
pub struct TappletAssets {
    pub icon_url: String,
    pub background_url: String,
}
