use crate::database::schema::*;
use crate::interface::TappletRegistryManifest;
use diesel::prelude::*;
use serde::{ Deserialize, Serialize };

#[derive(Queryable, Selectable, Debug, Serialize)]
#[diesel(table_name = installed_tapplet)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct InstalledTapplet {
  pub id: Option<i32>,
  pub tapplet_id: Option<i32>,
  pub tapplet_version_id: Option<i32>,
}

#[derive(Insertable, Debug, Deserialize)]
#[diesel(table_name = installed_tapplet)]
pub struct CreateInstalledTapplet {
  pub tapplet_id: Option<i32>,
  pub tapplet_version_id: Option<i32>,
}

impl From<&CreateInstalledTapplet> for UpdateInstalledTapplet {
  fn from(create_installed_tapplet: &CreateInstalledTapplet) -> Self {
    UpdateInstalledTapplet {
      tapplet_id: create_installed_tapplet.tapplet_id,
      tapplet_version_id: create_installed_tapplet.tapplet_version_id,
    }
  }
}

#[derive(Debug, AsChangeset, Deserialize)]
#[diesel(table_name = installed_tapplet)]
pub struct UpdateInstalledTapplet {
  pub tapplet_id: Option<i32>,
  pub tapplet_version_id: Option<i32>,
}

#[derive(Queryable, Selectable, Debug, Serialize)]
#[diesel(table_name = tapplet)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Tapplet {
  pub id: Option<i32>,
  pub registry_id: String,
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

#[derive(Insertable, Debug, Deserialize)]
#[diesel(table_name = tapplet)]
pub struct CreateTapplet<'a> {
  pub registry_id: &'a str,
  pub package_name: &'a str,
  pub display_name: &'a str,
  pub logo_url: &'a str,
  pub background_url: &'a str,
  pub author_name: &'a str,
  pub author_website: &'a str,
  pub about_summary: &'a str,
  pub about_description: &'a str,
  pub category: &'a str,
}

impl<'a> From<&'a TappletRegistryManifest> for CreateTapplet<'a> {
  fn from(tapplet_manifest: &'a TappletRegistryManifest) -> Self {
    CreateTapplet {
      registry_id: &tapplet_manifest.id,
      package_name: &tapplet_manifest.id,
      display_name: &tapplet_manifest.metadata.display_name,
      logo_url: &tapplet_manifest.metadata.logo_url,
      background_url: &tapplet_manifest.metadata.background_url,
      author_name: &tapplet_manifest.metadata.author.name,
      author_website: &tapplet_manifest.metadata.author.website,
      about_summary: &tapplet_manifest.metadata.about.summary,
      about_description: &tapplet_manifest.metadata.about.description,
      category: &tapplet_manifest.metadata.category,
    }
  }
}

impl<'a> From<&CreateTapplet<'a>> for UpdateTapplet {
  fn from(create_tapplet: &CreateTapplet) -> Self {
    UpdateTapplet {
      registry_id: create_tapplet.registry_id.to_string(),
      package_name: create_tapplet.package_name.to_string(),
      display_name: create_tapplet.display_name.to_string(),
      logo_url: create_tapplet.logo_url.to_string(),
      background_url: create_tapplet.background_url.to_string(),
      author_name: create_tapplet.author_name.to_string(),
      author_website: create_tapplet.author_website.to_string(),
      about_summary: create_tapplet.about_summary.to_string(),
      about_description: create_tapplet.about_description.to_string(),
      category: create_tapplet.category.to_string(),
    }
  }
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = tapplet)]
pub struct UpdateTapplet {
  pub registry_id: String,
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

#[derive(Queryable, Selectable, Debug, Serialize)]
#[diesel(table_name = tapplet_version)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct TappletVersion {
  pub id: Option<i32>,
  pub tapplet_id: Option<i32>,
  pub version: String,
  pub integrity: String,
  pub registry_url: String,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = tapplet_version)]
pub struct CreateTappletVersion<'a> {
  pub tapplet_id: Option<i32>,
  pub version: &'a str,
  pub integrity: &'a str,
  pub registry_url: &'a str,
}

impl<'a> From<&CreateTappletVersion<'a>> for UpdateTappletVersion {
  fn from(create_tapplet_version: &CreateTappletVersion) -> Self {
    UpdateTappletVersion {
      tapplet_id: create_tapplet_version.tapplet_id,
      version: create_tapplet_version.version.to_string(),
      integrity: create_tapplet_version.integrity.to_string(),
      registry_url: create_tapplet_version.registry_url.to_string(),
    }
  }
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = tapplet_version)]
pub struct UpdateTappletVersion {
  pub tapplet_id: Option<i32>,
  pub version: String,
  pub integrity: String,
  pub registry_url: String,
}

#[derive(Queryable, Selectable, Debug, Serialize)]
#[diesel(table_name = dev_tapplet)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct DevTapplet {
  pub id: Option<i32>,
  pub package_name: String,
  pub endpoint: String,
  pub display_name: String,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = dev_tapplet)]
pub struct CreateDevTapplet<'a> {
  pub endpoint: &'a str,
  pub package_name: &'a str,
  pub display_name: &'a str,
}

impl<'a> From<&CreateDevTapplet<'a>> for UpdateDevTapplet {
  fn from(create_dev_tapplet: &CreateDevTapplet) -> Self {
    UpdateDevTapplet {
      endpoint: create_dev_tapplet.endpoint.to_string(),
      package_name: create_dev_tapplet.package_name.to_string(),
      display_name: create_dev_tapplet.display_name.to_string(),
    }
  }
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = dev_tapplet)]
pub struct UpdateDevTapplet {
  pub endpoint: String,
  pub package_name: String,
  pub display_name: String,
}

#[derive(Queryable, Selectable, Debug, Serialize)]
#[diesel(table_name = tapplet_audit)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct TappletAudit {
  pub id: Option<i32>,
  pub tapplet_id: Option<i32>,
  pub auditor: String,
  pub report_url: String,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = tapplet_audit)]
pub struct CreateTappletAudit<'a> {
  pub tapplet_id: Option<i32>,
  pub auditor: &'a str,
  pub report_url: &'a str,
}

impl<'a> From<&CreateTappletAudit<'a>> for UpdateTappletAudit {
  fn from(create_tapplet_audit: &CreateTappletAudit) -> Self {
    UpdateTappletAudit {
      tapplet_id: create_tapplet_audit.tapplet_id,
      auditor: create_tapplet_audit.auditor.to_string(),
      report_url: create_tapplet_audit.report_url.to_string(),
    }
  }
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = tapplet_audit)]
pub struct UpdateTappletAudit {
  pub tapplet_id: Option<i32>,
  pub auditor: String,
  pub report_url: String,
}

#[derive(Queryable, Selectable, Debug, Serialize)]
#[diesel(table_name = tapplet_asset)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct TappletAsset {
  pub id: Option<i32>,
  pub tapplet_id: Option<i32>,
  pub icon_url: String,
  pub background_url: String,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = tapplet_asset)]
pub struct CreateTappletAsset<'a> {
  pub tapplet_id: Option<i32>,
  pub icon_url: &'a str,
  pub background_url: &'a str,
}

impl<'a> From<&CreateTappletAsset<'a>> for UpdateTappletAsset {
  fn from(create_tapplet_asset: &CreateTappletAsset) -> Self {
    UpdateTappletAsset {
      tapplet_id: create_tapplet_asset.tapplet_id,
      icon_url: create_tapplet_asset.icon_url.to_string(),
      background_url: create_tapplet_asset.background_url.to_string(),
    }
  }
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = tapplet_asset)]
pub struct UpdateTappletAsset {
  pub tapplet_id: Option<i32>,
  pub icon_url: String,
  pub background_url: String,
}
