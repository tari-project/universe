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
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, serde::Serialize)]
pub struct ActiveTapplet {
    pub tapplet_id: i32,
    pub package_name: String,
    pub display_name: String,
    pub source: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct TappletPermissions {
    #[serde(rename = "requiredPermissions")]
    pub required_permissions: Vec<TariPermission>,
    #[serde(rename = "optionalPermissions")]
    pub optional_permissions: Vec<TariPermission>,
}

impl Default for TappletPermissions {
    fn default() -> Self {
        TappletPermissions {
            required_permissions: Vec::new(),
            optional_permissions: Vec::new(),
        }
    }
}

use std::fmt;
impl fmt::Display for TappletPermissions {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "Required Permissions:")?;
        if self.required_permissions.is_empty() {
            writeln!(f, "  None")?;
        } else {
            for perm in &self.required_permissions {
                writeln!(f, "  - {:?}", perm)?;
            }
        }

        writeln!(f, "Optional Permissions:")?;
        if self.optional_permissions.is_empty() {
            writeln!(f, "  None")?;
        } else {
            for perm in &self.optional_permissions {
                writeln!(f, "  - {:?}", perm)?;
            }
        }

        Ok(())
    }
}

impl TappletPermissions {
    pub fn all_permissions_to_string(&self) -> String {
        let mut parts = Vec::new();

        if !self.required_permissions.is_empty() {
            let req = self
                .required_permissions
                .iter()
                .map(|p| format!("{:?}", p))
                .collect::<Vec<_>>()
                .join(", ");
            parts.push(format!("requiredPermissions: {}", req));
        }

        if !self.optional_permissions.is_empty() {
            let opt = self
                .optional_permissions
                .iter()
                .map(|p| format!("{:?}", p))
                .collect::<Vec<_>>()
                .join(", ");
            parts.push(format!("optionalPermissions: {}", opt));
        }

        if parts.is_empty() {
            "No permissions".to_string()
        } else {
            parts.join(" | ")
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct TappletConfig {
    #[serde(rename = "packageName")]
    pub package_name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub version: String,
    #[serde(rename = "supportedChain")]
    pub supported_chain: Vec<String>,
    pub permissions: TappletPermissions,
    pub csp: String,
}

impl Default for TappletConfig {
    fn default() -> Self {
        TappletConfig {
            package_name: String::from("package_name"),
            display_name: String::from("display_name"),
            version: String::from("0.1.0"),
            supported_chain: vec![],
            permissions: TappletPermissions::default(),
            csp: String::from("default-src 'self';"),
        }
    }
}

#[derive(Debug, Clone, serde::Deserialize, Serialize)]
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
    TariPermissionTransactionsGet,
}

#[derive(Debug, serde::Deserialize)]
pub struct TappletManifest {
    #[serde(rename = "packageName")]
    pub package_name: String,
    pub version: String,
    #[serde(rename = "supportedChain")]
    pub supported_chain: Vec<String>,
    pub permissions: TappletPermissions,
    pub csp: String,
}

#[derive(Debug, Deserialize)]
pub struct Package {
    #[serde(rename = "packageName")]
    pub package_name: String,
    pub version: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub status: String,
    pub category: String,
    pub author: Author,
    pub about: About,
    pub audits: Vec<Audit>,
    pub design: Design,
    pub repository: Repository,
    pub source: Source,
    #[serde(rename = "supportedChain")]
    pub supported_chain: Vec<String>,
    pub permissions: Permissions,
    #[serde(rename = "manifestVersion")]
    pub manifest_version: String,
}

#[derive(Debug, Deserialize)]
pub struct Author {
    pub name: String,
    pub website: String,
}

#[derive(Debug, Deserialize)]
pub struct About {
    pub summary: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct Audit {
    pub auditor: String,
    #[serde(rename = "reportUrl")]
    pub report_url: String,
}

#[derive(Debug, Deserialize)]
pub struct Design {
    #[serde(rename = "logoPath")]
    pub logo_path: String,
    #[serde(rename = "backgroundPath")]
    pub background_path: String,
}

#[derive(Debug, Deserialize)]
pub struct Repository {
    #[serde(rename = "type")]
    pub repo_type: String,
    pub url: String,
    pub codeowners: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Source {
    pub location: String,
}

#[derive(Debug, Deserialize)]
pub struct Permissions {
    #[serde(rename = "requiredPermissions")]
    pub required_permissions: Vec<String>,
    #[serde(rename = "optionalPermissions")]
    pub optional_permissions: Vec<String>,
}
