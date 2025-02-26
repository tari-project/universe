use std::collections::HashMap;

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

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TappletPermissions {
    #[serde(rename = "requiredPermissions")]
    pub required_permissions: Vec<TariPermission>,
    #[serde(rename = "optionalPermissions")]
    pub optional_permissions: Vec<TariPermission>,
}

#[derive(Debug, serde::Deserialize)]
pub struct TappletConfig {
    #[serde(rename = "packageName")]
    pub package_name: String,
    pub version: String,
    #[serde(rename = "supportedChain")]
    pub supported_chain: Vec<String>,
    pub permissions: TappletPermissions,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub enum TariPermission {
    TariPermissionNftGetOwnershipProof,
    TariPermissionAccountBalance,
    TariPermissionAccountInfo,
    TariPermissionAccountList,
    TariPermissionKeyList,
    TariPermissionTransactionGet,
    TariPermissionTransactionSend,
    TariPermissionGetNft,
    TariPermissionSubstatesRead,
    TariPermissionTemplatesRead,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ActiveTapplet {
    pub tapplet_id: i32,
    pub display_name: String,
    pub source: String,
    pub version: String,
    pub permissions: TappletPermissions,
}
