use crate::tapplets::interface::TappletRegistryManifest;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// ========== InstalledTapplet ==========

#[derive(Debug, Serialize, FromRow)]
pub struct InstalledTapplet {
    pub id: Option<i32>,
    pub tapplet_id: Option<i32>,
    pub tapplet_version_id: Option<i32>,
    pub source: String,
    pub csp: String,
    pub tari_permissions: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateInstalledTapplet {
    pub tapplet_id: Option<i32>,
    pub tapplet_version_id: Option<i32>,
    pub source: String,
    pub csp: String,
    pub tari_permissions: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateInstalledTapplet {
    pub tapplet_id: Option<i32>,
    pub tapplet_version_id: Option<i32>,
    pub source: String,
    pub csp: String,
    pub tari_permissions: String,
}

impl From<&CreateInstalledTapplet> for UpdateInstalledTapplet {
    fn from(create: &CreateInstalledTapplet) -> Self {
        UpdateInstalledTapplet {
            tapplet_id: create.tapplet_id,
            tapplet_version_id: create.tapplet_version_id,
            source: create.source.clone(),
            csp: create.csp.clone(),
            tari_permissions: create.tari_permissions.clone(),
        }
    }
}

impl From<&InstalledTapplet> for UpdateInstalledTapplet {
    fn from(inst: &InstalledTapplet) -> Self {
        UpdateInstalledTapplet {
            tapplet_id: inst.tapplet_id,
            tapplet_version_id: inst.tapplet_version_id,
            source: inst.source.clone(),
            csp: inst.csp.clone(),
            tari_permissions: inst.tari_permissions.clone(),
        }
    }
}

// ========== Tapplet ==========

#[derive(Debug, Serialize, FromRow)]
pub struct Tapplet {
    pub id: Option<i32>,
    pub package_name: String,
    pub display_name: String,
    pub logo_url: String,
    pub background_url: String,
    pub author_name: String,
    pub author_website: String,
    pub about_summary: String,
    pub about_description: String,
    pub category: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTapplet {
    pub package_name: String,
    pub display_name: String,
    pub logo_url: String,
    pub background_url: String,
    pub author_name: String,
    pub author_website: String,
    pub about_summary: String,
    pub about_description: String,
    pub category: String,
}

impl From<&TappletRegistryManifest> for CreateTapplet {
    fn from(manifest: &TappletRegistryManifest) -> Self {
        CreateTapplet {
            package_name: manifest.id.clone(),
            display_name: manifest.metadata.display_name.clone(),
            logo_url: manifest.metadata.logo_url.clone(),
            background_url: manifest.metadata.background_url.clone(),
            author_name: manifest.metadata.author.name.clone(),
            author_website: manifest.metadata.author.website.clone(),
            about_summary: manifest.metadata.about.summary.clone(),
            about_description: manifest.metadata.about.description.clone(),
            category: manifest.metadata.category.clone(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateTapplet {
    pub package_name: String,
    pub display_name: String,
    pub logo_url: String,
    pub background_url: String,
    pub author_name: String,
    pub author_website: String,
    pub about_summary: String,
    pub about_description: String,
    pub category: String,
}

impl From<&CreateTapplet> for UpdateTapplet {
    fn from(create: &CreateTapplet) -> Self {
        UpdateTapplet {
            package_name: create.package_name.clone(),
            display_name: create.display_name.clone(),
            logo_url: create.logo_url.clone(),
            background_url: create.background_url.clone(),
            author_name: create.author_name.clone(),
            author_website: create.author_website.clone(),
            about_summary: create.about_summary.clone(),
            about_description: create.about_description.clone(),
            category: create.category.clone(),
        }
    }
}

// ========== TappletVersion ==========

#[derive(Debug, Serialize, Clone, FromRow)]
pub struct TappletVersion {
    pub id: Option<i32>,
    pub tapplet_id: Option<i32>,
    pub version: String,
    pub integrity: String,
    pub registry_url: String,
}

#[derive(Debug)]
pub struct CreateTappletVersion {
    pub tapplet_id: Option<i32>,
    pub version: String,
    pub integrity: String,
    pub registry_url: String,
}

#[derive(Debug)]
pub struct UpdateTappletVersion {
    pub tapplet_id: Option<i32>,
    pub version: String,
    pub integrity: String,
    pub registry_url: String,
}

impl From<&CreateTappletVersion> for UpdateTappletVersion {
    fn from(create: &CreateTappletVersion) -> Self {
        UpdateTappletVersion {
            tapplet_id: create.tapplet_id,
            version: create.version.clone(),
            integrity: create.integrity.clone(),
            registry_url: create.registry_url.clone(),
        }
    }
}

// ========== DevTapplet ==========

#[derive(Debug, Serialize, Clone, FromRow)]
pub struct DevTapplet {
    pub id: Option<i32>,
    pub package_name: String,
    pub source: String,
    pub display_name: String,
    pub csp: String,
    pub tari_permissions: String,
}

#[derive(Debug)]
pub struct CreateDevTapplet {
    pub source: String,
    pub package_name: String,
    pub display_name: String,
    pub csp: String,
    pub tari_permissions: String,
}

#[derive(Debug)]
pub struct UpdateDevTapplet {
    pub source: String,
    pub package_name: String,
    pub display_name: String,
    pub csp: String,
    pub tari_permissions: String,
}

impl From<&CreateDevTapplet> for UpdateDevTapplet {
    fn from(create: &CreateDevTapplet) -> Self {
        UpdateDevTapplet {
            source: create.source.clone(),
            package_name: create.package_name.clone(),
            display_name: create.display_name.clone(),
            csp: create.csp.clone(),
            tari_permissions: create.tari_permissions.clone(),
        }
    }
}

impl From<&DevTapplet> for UpdateDevTapplet {
    fn from(dev: &DevTapplet) -> Self {
        UpdateDevTapplet {
            source: dev.source.clone(),
            package_name: dev.package_name.clone(),
            display_name: dev.display_name.clone(),
            csp: dev.csp.clone(),
            tari_permissions: dev.tari_permissions.clone(),
        }
    }
}

// ========== TappletAudit ==========

#[derive(Debug, Serialize, FromRow)]
pub struct TappletAudit {
    pub id: Option<i32>,
    pub tapplet_id: Option<i32>,
    pub auditor: String,
    pub report_url: String,
}

#[derive(Debug)]
pub struct CreateTappletAudit {
    pub tapplet_id: Option<i32>,
    pub auditor: String,
    pub report_url: String,
}

#[derive(Debug)]
pub struct UpdateTappletAudit {
    pub tapplet_id: Option<i32>,
    pub auditor: String,
    pub report_url: String,
}

impl From<&CreateTappletAudit> for UpdateTappletAudit {
    fn from(create: &CreateTappletAudit) -> Self {
        UpdateTappletAudit {
            tapplet_id: create.tapplet_id,
            auditor: create.auditor.clone(),
            report_url: create.report_url.clone(),
        }
    }
}

// ========== TappletAsset ==========

#[derive(Debug, Serialize, FromRow)]
pub struct TappletAsset {
    pub id: Option<i32>,
    pub tapplet_id: Option<i32>,
    pub icon_url: String,
    pub background_url: String,
}

#[derive(Debug)]
pub struct CreateTappletAsset {
    pub tapplet_id: Option<i32>,
    pub icon_url: String,
    pub background_url: String,
}

#[derive(Debug)]
pub struct UpdateTappletAsset {
    pub tapplet_id: Option<i32>,
    pub icon_url: String,
    pub background_url: String,
}

impl From<&CreateTappletAsset> for UpdateTappletAsset {
    fn from(create: &CreateTappletAsset) -> Self {
        UpdateTappletAsset {
            tapplet_id: create.tapplet_id,
            icon_url: create.icon_url.clone(),
            background_url: create.background_url.clone(),
        }
    }
}
