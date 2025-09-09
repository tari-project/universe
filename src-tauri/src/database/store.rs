use sqlx::SqlitePool;
use std::sync::Arc;

use crate::database::models::*;
use crate::tapplets::error::{
    DatabaseError::*,
    Error::{self, DatabaseError},
};
use crate::tapplets::interface::{
    InstalledTappletJoinRow, InstalledTappletWithName, TappletSemver,
};
use log::{error, warn};
const LOG_TARGET: &str = "tari::universe::database";
#[derive(Clone)]
pub struct DatabaseConnection(pub Arc<SqlitePool>);

#[derive(Clone)]
pub struct SqliteStore {
    pool: Arc<SqlitePool>,
}

impl SqliteStore {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub fn get_pool(&self) -> &SqlitePool {
        &self.pool
    }

    // --- DevTapplet ---
    pub async fn get_all_dev_tapplets(&self) -> Result<Vec<DevTapplet>, Error> {
        sqlx::query_as::<_, DevTapplet>(
            "SELECT id, package_name, source, display_name, csp, tari_permissions FROM dev_tapplet",
        )
        .fetch_all(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching all dev_tapplets: {:?}", e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "dev_tapplet".to_string(),
            })
        })
    }

    pub async fn get_dev_tapplet_by_id(&self, dev_tapplet_id: i32) -> Result<DevTapplet, Error> {
        sqlx::query_as::<_, DevTapplet>(
            "SELECT id, package_name, source, display_name, csp, tari_permissions FROM dev_tapplet WHERE id = ?"
        )
        .bind(dev_tapplet_id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching dev_tapplet by id {}: {:?}", dev_tapplet_id, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "dev_tapplet".to_string(),
            })
        })
    }

    pub async fn create_dev_tapplet(&self, item: &CreateDevTapplet) -> Result<DevTapplet, Error> {
        sqlx::query_as::<_, DevTapplet>(
            r#"
            INSERT INTO dev_tapplet (package_name, source, display_name, csp, tari_permissions)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, package_name, source, display_name, csp, tari_permissions
            "#,
        )
        .bind(&item.package_name)
        .bind(&item.source)
        .bind(&item.display_name)
        .bind(&item.csp)
        .bind(&item.tari_permissions)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error creating dev_tapplet {:?}: {:?}", &item.package_name, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "dev_tapplet".to_string(),
            })
        })
    }

    pub async fn update_dev_tapplet(&self, id: i32, item: &UpdateDevTapplet) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            UPDATE dev_tapplet SET
                package_name = ?,
                source = ?,
                display_name = ?,
                csp = ?,
                tari_permissions = ?
            WHERE id = ?
            "#,
        )
        .bind(&item.package_name)
        .bind(&item.source)
        .bind(&item.display_name)
        .bind(&item.csp)
        .bind(&item.tari_permissions)
        .bind(id)
        .execute(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error updating dev_tapplet id {}: {:?}", id, e);
            DatabaseError(FailedToUpdate {
                entity_name: item.display_name.clone(),
            })
        })?;
        Ok(result.rows_affected())
    }

    pub async fn delete_dev_tapplet(&self, id: i32) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM dev_tapplet WHERE id = ?")
            .bind(id)
            .execute(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error deleting dev_tapplet id {}: {:?}", id, e);
                DatabaseError(FailedToDelete {
                    entity_name: "dev_tapplet".to_string(),
                })
            })?;
        Ok(result.rows_affected())
    }

    // --- Tapplet ---
    pub async fn get_all_tapplets(&self) -> Result<Vec<Tapplet>, Error> {
        sqlx::query_as::<_, Tapplet>(
            "SELECT id, package_name, display_name, logo_url, background_url, author_name, author_website, about_summary, about_description, category FROM tapplet"
        )
        .fetch_all(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching all tapplets: {:?}", e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet".to_string(),
            })
        })
    }

    pub async fn get_tapplet_by_id(&self, tapplet_id: i32) -> Result<Tapplet, Error> {
        sqlx::query_as::<_, Tapplet>(
            "SELECT id, package_name, display_name, logo_url, background_url, author_name, author_website, about_summary, about_description, category FROM tapplet WHERE id = ?"
        )
        .bind(tapplet_id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching tapplet by id {}: {:?}", tapplet_id, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet".to_string(),
            })
        })
    }

    pub async fn create_tapplet(&self, item: &CreateTapplet) -> Result<Tapplet, Error> {
        let result = sqlx::query_as::<_, Tapplet>(
        r#"
        INSERT OR IGNORE INTO tapplet (package_name, display_name, logo_url, background_url, author_name, author_website, about_summary, about_description, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id, package_name, display_name, logo_url, background_url, author_name, author_website, about_summary, about_description, category
        "#
    )
    .bind(&item.package_name)
    .bind(&item.display_name)
    .bind(&item.logo_url)
    .bind(&item.background_url)
    .bind(&item.author_name)
    .bind(&item.author_website)
    .bind(&item.about_summary)
    .bind(&item.about_description)
    .bind(&item.category)
    .fetch_optional(self.get_pool())
    .await;

        match result {
            Ok(Some(tapplet)) => Ok(tapplet),
            Ok(None) => {
                sqlx::query_as::<_, Tapplet>(
                "SELECT id, package_name, display_name, logo_url, background_url, author_name, author_website, about_summary, about_description, category FROM tapplet WHERE package_name = ?"
            )
            .bind(&item.package_name)
            .fetch_one(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error fetching existing tapplet {:?}: {:?}", &item.package_name, e);
                DatabaseError(FailedToRetrieveData {
                    entity_name: item.display_name.clone(),
                })
            })
        }
        Err(e) => {
            error!(target: LOG_TARGET, "Failed to create DB error for tapplet {:?}: {:?}", &item.package_name, e);
            Err(DatabaseError(FailedToCreate {
                entity_name: item.display_name.clone(),
            }))
        }
    }
    }

    pub async fn update_tapplet(&self, id: i32, item: &UpdateTapplet) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            UPDATE tapplet SET
                package_name = ?,
                display_name = ?,
                logo_url = ?,
                background_url = ?,
                author_name = ?,
                author_website = ?,
                about_summary = ?,
                about_description = ?,
                category = ?
            WHERE id = ?
            "#,
        )
        .bind(&item.package_name)
        .bind(&item.display_name)
        .bind(&item.logo_url)
        .bind(&item.background_url)
        .bind(&item.author_name)
        .bind(&item.author_website)
        .bind(&item.about_summary)
        .bind(&item.about_description)
        .bind(&item.category)
        .bind(id)
        .execute(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error updating tapplet id {}: {:?}", id, e);
            DatabaseError(FailedToUpdate {
                entity_name: item.display_name.clone(),
            })
        })?;
        Ok(result.rows_affected())
    }

    pub async fn delete_tapplet(&self, id: i32) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM tapplet WHERE id = ?")
            .bind(id)
            .execute(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error deleting tapplet id {}: {:?}", id, e);
                DatabaseError(FailedToDelete {
                    entity_name: "tapplet".to_string(),
                })
            })?;
        Ok(result.rows_affected())
    }

    // --- InstalledTapplet ---
    pub async fn get_all_installed_tapplets(&self) -> Result<Vec<InstalledTapplet>, Error> {
        sqlx::query_as::<_, InstalledTapplet>(
            "SELECT id, tapplet_id, tapplet_version_id, source, csp, tari_permissions FROM installed_tapplet"
        )
        .fetch_all(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching all installed_tapplets: {:?}", e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "installed_tapplet".to_string(),
            })
        })
    }

    pub async fn get_installed_tapplet_by_id(&self, id: i32) -> Result<InstalledTapplet, Error> {
        sqlx::query_as::<_, InstalledTapplet>(
            "SELECT id, tapplet_id, tapplet_version_id, source, csp, tari_permissions FROM installed_tapplet WHERE id = ?"
        )
        .bind(id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching installed_tapplet by id {}: {:?}", id, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "installed_tapplet".to_string(),
            })
        })
    }

    pub async fn create_installed_tapplet(
        &self,
        item: &CreateInstalledTapplet,
    ) -> Result<InstalledTapplet, Error> {
        let result = sqlx::query_as::<_, InstalledTapplet>(
            r#"
            INSERT OR IGNORE INTO installed_tapplet (tapplet_id, tapplet_version_id, source, csp, tari_permissions)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, tapplet_id, tapplet_version_id, source, csp, tari_permissions
            "#
        )
        .bind(item.tapplet_id)
        .bind(item.tapplet_version_id)
        .bind(&item.source)
        .bind(&item.csp)
        .bind(&item.tari_permissions)
        .fetch_optional(self.get_pool())
        .await;

        match result {
            Ok(Some(installed_tapplet)) => Ok(installed_tapplet),
            Ok(None) => {
                // Already exists, fetch and return the existing row
                sqlx::query_as::<_, InstalledTapplet>(
                    "SELECT id, tapplet_id, tapplet_version_id, source, csp, tari_permissions FROM installed_tapplet WHERE tapplet_id = ? AND tapplet_version_id = ? AND source = ?"
                )
                .bind(item.tapplet_id)
                .bind(item.tapplet_version_id)
                .bind(&item.source)
                .fetch_one(self.get_pool())
                .await
                .map_err(|e| {
                    error!(target: LOG_TARGET, "DB error fetching existing installed_tapplet for tapplet_id {:?}, version_id {:?}, source {:?}: {:?}", item.tapplet_id, item.tapplet_version_id, item.source, e);
                    DatabaseError(FailedToRetrieveData {
                        entity_name: "installed_tapplet".to_string(),
                    })
                })
            }
            Err(e) => {
                error!(target: LOG_TARGET, "DB error creating installed_tapplet: {:?}", e);
                Err(DatabaseError(FailedToCreate {
                    entity_name: "installed_tapplet".to_string(),
                }))
            }
        }
    }

    pub async fn create_installed_tapplet_with_id(
        &self,
        id: i32,
        item: &CreateInstalledTapplet,
    ) -> Result<InstalledTapplet, Error> {
        sqlx::query_as::<_, InstalledTapplet>(
            r#"
            INSERT INTO installed_tapplet (id, tapplet_id, tapplet_version_id, source, csp, tari_permissions)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id, tapplet_id, tapplet_version_id, source, csp, tari_permissions
            "#
        )
        .bind(id)
        .bind(item.tapplet_id)
        .bind(item.tapplet_version_id)
        .bind(&item.source)
        .bind(&item.csp)
        .bind(&item.tari_permissions)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error creating installed_tapplet with id: {:?}", e);
            DatabaseError(FailedToCreate {
                entity_name: "installed_tapplet".to_string(),
            })
        })
    }

    pub async fn update_installed_tapplet(
        &self,
        id: i32,
        item: &UpdateInstalledTapplet,
    ) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            UPDATE installed_tapplet SET
                tapplet_id = ?,
                tapplet_version_id = ?,
                source = ?,
                csp = ?,
                tari_permissions = ?
            WHERE id = ?
            "#,
        )
        .bind(item.tapplet_id)
        .bind(item.tapplet_version_id)
        .bind(&item.source)
        .bind(&item.csp)
        .bind(&item.tari_permissions)
        .bind(id)
        .execute(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error updating installed_tapplet id {}: {:?}", id, e);
            DatabaseError(FailedToUpdate {
                entity_name: "installed_tapplet".to_string(),
            })
        })?;
        Ok(result.rows_affected())
    }

    pub async fn delete_installed_tapplet(&self, id: i32) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM installed_tapplet WHERE id = ?")
            .bind(id)
            .execute(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error deleting installed_tapplet id {}: {:?}", id, e);
                DatabaseError(FailedToDelete {
                    entity_name: "installed_tapplet".to_string(),
                })
            })?;
        Ok(result.rows_affected())
    }

    // --- TappletVersion ---
    pub async fn get_all_tapplet_versions(&self) -> Result<Vec<TappletVersion>, Error> {
        sqlx::query_as::<_, TappletVersion>(
            "SELECT id, tapplet_id, version, integrity, registry_url FROM tapplet_version",
        )
        .fetch_all(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching all tapplet_versions: {:?}", e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet_version".to_string(),
            })
        })
    }

    pub async fn get_tapplet_version_by_id(&self, id: i32) -> Result<TappletVersion, Error> {
        sqlx::query_as::<_, TappletVersion>(
            "SELECT id, tapplet_id, version, integrity, registry_url FROM tapplet_version WHERE id = ?"
        )
        .bind(id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching tapplet_version by id {}: {:?}", id, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet_version".to_string(),
            })
        })
    }

    pub async fn create_tapplet_version(
        &self,
        item: &CreateTappletVersion,
    ) -> Result<TappletVersion, Error> {
        let result = sqlx::query_as::<_, TappletVersion>(
            r#"
        INSERT OR IGNORE INTO tapplet_version (tapplet_id, version, integrity, registry_url)
        VALUES (?, ?, ?, ?)
        RETURNING id, tapplet_id, version, integrity, registry_url
        "#,
        )
        .bind(item.tapplet_id)
        .bind(&item.version)
        .bind(&item.integrity)
        .bind(&item.registry_url)
        .fetch_optional(self.get_pool())
        .await;

        match result {
            Ok(Some(tapplet_version)) => Ok(tapplet_version),
            Ok(None) => {
                // Already exists, fetch and return the existing row
                sqlx::query_as::<_, TappletVersion>(
                "SELECT id, tapplet_id, version, integrity, registry_url FROM tapplet_version WHERE tapplet_id = ? AND version = ?"
            )
            .bind(item.tapplet_id)
            .bind(&item.version)
            .fetch_one(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error fetching existing tapplet_version for tapplet_id {:?} ver {:?}: {:?}", &item.tapplet_id, &item.version, e);
                DatabaseError(FailedToRetrieveData {
                    entity_name: "tapplet_version".to_string(),
                })
            })
            }
            Err(e) => {
                error!(target: LOG_TARGET, "DB error creating tapplet_version for tapplet_id {:?} ver {:?}: {:?}", &item.tapplet_id, &item.version, e);
                Err(DatabaseError(FailedToCreate {
                    entity_name: "tapplet_version".to_string(),
                }))
            }
        }
    }

    pub async fn update_tapplet_version(
        &self,
        id: i32,
        item: &UpdateTappletVersion,
    ) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            UPDATE tapplet_version SET
                tapplet_id = ?,
                version = ?,
                integrity = ?,
                registry_url = ?
            WHERE id = ?
            "#,
        )
        .bind(item.tapplet_id)
        .bind(&item.version)
        .bind(&item.integrity)
        .bind(&item.registry_url)
        .bind(id)
        .execute(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error updating tapplet_version id {}: {:?}", id, e);
            DatabaseError(FailedToUpdate {
                entity_name: "tapplet_version".to_string(),
            })
        })?;
        Ok(result.rows_affected())
    }

    pub async fn delete_tapplet_version(&self, id: i32) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM tapplet_version WHERE id = ?")
            .bind(id)
            .execute(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error deleting tapplet_version id {}: {:?}", id, e);
                DatabaseError(FailedToDelete {
                    entity_name: "tapplet_version".to_string(),
                })
            })?;
        Ok(result.rows_affected())
    }

    // --- TappletAudit ---
    pub async fn get_all_tapplet_audits(&self) -> Result<Vec<TappletAudit>, Error> {
        sqlx::query_as::<_, TappletAudit>(
            "SELECT id, tapplet_id, auditor, report_url FROM tapplet_audit",
        )
        .fetch_all(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching all tapplet_audits: {:?}", e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet_audit".to_string(),
            })
        })
    }

    pub async fn get_tapplet_audit_by_id(&self, id: i32) -> Result<TappletAudit, Error> {
        sqlx::query_as::<_, TappletAudit>(
            "SELECT id, tapplet_id, auditor, report_url FROM tapplet_audit WHERE id = ?",
        )
        .bind(id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching tapplet_audit by id {}: {:?}", id, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet_audit".to_string(),
            })
        })
    }

    pub async fn create_tapplet_audit(
        &self,
        item: &CreateTappletAudit,
    ) -> Result<TappletAudit, Error> {
        let result = sqlx::query_as::<_, TappletAudit>(
            r#"
        INSERT OR IGNORE INTO tapplet_audit (tapplet_id, auditor, report_url)
        VALUES (?, ?, ?)
        RETURNING id, tapplet_id, auditor, report_url
        "#,
        )
        .bind(item.tapplet_id)
        .bind(&item.auditor)
        .bind(&item.report_url)
        .fetch_optional(self.get_pool())
        .await;

        match result {
            Ok(Some(tapplet_audit)) => Ok(tapplet_audit),
            Ok(None) => {
                // Already exists, fetch and return the existing row
                sqlx::query_as::<_, TappletAudit>(
                "SELECT id, tapplet_id, auditor, report_url FROM tapplet_audit WHERE tapplet_id = ? AND auditor = ? AND report_url = ?"
            )
            .bind(item.tapplet_id)
            .bind(&item.auditor)
            .bind(&item.report_url)
            .fetch_one(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error fetching existing tapplet_audit for tapplet_id {:?}, auditor {:?}: {:?}", item.tapplet_id, item.auditor, e);
                DatabaseError(FailedToRetrieveData {
                    entity_name: "tapplet_audit".to_string(),
                })
            })
            }
            Err(e) => {
                error!(target: LOG_TARGET, "DB error creating tapplet_audit for tapplet_id {:?}, auditor {:?}: {:?}", item.tapplet_id, item.auditor, e);
                Err(DatabaseError(FailedToCreate {
                    entity_name: "tapplet_audit".to_string(),
                }))
            }
        }
    }
    pub async fn update_tapplet_audit(
        &self,
        id: i32,
        item: &UpdateTappletAudit,
    ) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            UPDATE tapplet_audit SET
                tapplet_id = ?,
                auditor = ?,
                report_url = ?
            WHERE id = ?
            "#,
        )
        .bind(item.tapplet_id)
        .bind(&item.auditor)
        .bind(&item.report_url)
        .bind(id)
        .execute(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error updating tapplet_audit id {}: {:?}", id, e);
            DatabaseError(FailedToUpdate {
                entity_name: "tapplet_audit".to_string(),
            })
        })?;
        Ok(result.rows_affected())
    }

    pub async fn delete_tapplet_audit(&self, id: i32) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM tapplet_audit WHERE id = ?")
            .bind(id)
            .execute(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error deleting tapplet_audit id {}: {:?}", id, e);
                DatabaseError(FailedToDelete {
                    entity_name: "tapplet_audit".to_string(),
                })
            })?;
        Ok(result.rows_affected())
    }

    // --- TappletAsset ---
    pub async fn get_all_tapplet_assets(&self) -> Result<Vec<TappletAsset>, Error> {
        sqlx::query_as::<_, TappletAsset>(
            "SELECT id, tapplet_id, icon_url, background_url FROM tapplet_asset",
        )
        .fetch_all(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching all tapplet_assets: {:?}", e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet_asset".to_string(),
            })
        })
    }

    pub async fn get_tapplet_asset_by_id(&self, id: i32) -> Result<TappletAsset, Error> {
        sqlx::query_as::<_, TappletAsset>(
            "SELECT id, tapplet_id, icon_url, background_url FROM tapplet_asset WHERE id = ?",
        )
        .bind(id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error fetching tapplet_asset by id {}: {:?}", id, e);
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet_asset".to_string(),
            })
        })
    }

    pub async fn create_tapplet_asset(
        &self,
        item: &CreateTappletAsset,
    ) -> Result<TappletAsset, Error> {
        let result = sqlx::query_as::<_, TappletAsset>(
            r#"
        INSERT OR IGNORE INTO tapplet_asset (tapplet_id, icon_url, background_url)
        VALUES (?, ?, ?)
        RETURNING id, tapplet_id, icon_url, background_url
        "#,
        )
        .bind(item.tapplet_id)
        .bind(&item.icon_url)
        .bind(&item.background_url)
        .fetch_optional(self.get_pool())
        .await;

        match result {
            Ok(Some(tapplet_asset)) => Ok(tapplet_asset),
            Ok(None) => {
                // Already exists, fetch and return the existing row
                sqlx::query_as::<_, TappletAsset>(
                "SELECT id, tapplet_id, icon_url, background_url FROM tapplet_asset WHERE tapplet_id = ? AND icon_url = ? AND background_url = ?"
            )
            .bind(item.tapplet_id)
            .bind(&item.icon_url)
            .bind(&item.background_url)
            .fetch_one(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error fetching existing tapplet_asset for tapplet_id {:?}: {:?}", item.tapplet_id, e);
                DatabaseError(FailedToRetrieveData {
                    entity_name: "tapplet_asset".to_string(),
                })
            })
            }
            Err(e) => {
                error!(target: LOG_TARGET, "DB error creating tapplet_asset for tapplet_id {:?}: {:?}", item.tapplet_id, e);
                Err(DatabaseError(FailedToCreate {
                    entity_name: "tapplet_asset".to_string(),
                }))
            }
        }
    }

    pub async fn update_tapplet_asset(
        &self,
        id: i32,
        item: &UpdateTappletAsset,
    ) -> Result<u64, Error> {
        let result = sqlx::query(
            r#"
            UPDATE tapplet_asset SET
                tapplet_id = ?,
                icon_url = ?,
                background_url = ?
            WHERE id = ?
            "#,
        )
        .bind(item.tapplet_id)
        .bind(&item.icon_url)
        .bind(&item.background_url)
        .bind(id)
        .execute(self.get_pool())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error updating tapplet_asset id {}: {:?}", id, e);
            DatabaseError(FailedToUpdate {
                entity_name: "tapplet_asset".to_string(),
            })
        })?;
        Ok(result.rows_affected())
    }

    pub async fn delete_tapplet_asset(&self, id: i32) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM tapplet_asset WHERE id = ?")
            .bind(id)
            .execute(self.get_pool())
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "DB error deleting tapplet_asset id {}: {:?}", id, e);
                DatabaseError(FailedToDelete {
                    entity_name: "tapplet_asset".to_string(),
                })
            })?;
        Ok(result.rows_affected())
    }

    /// Returns a Tapplet from either installed_tapplet or dev_tapplet by package_name (package_name).
    pub async fn get_tapplet_by_name(
        &self,
        package_name: String,
    ) -> Result<Option<Tapplet>, Error> {
        // First, try to find in installed_tapplet joined with tapplet
        if let Ok(tapplet) = sqlx::query_as::<_, Tapplet>(
            r#"
            SELECT t.id, t.package_name, t.display_name, t.logo_url, t.background_url, t.author_name, t.author_website, t.about_summary, t.about_description, t.category
            FROM tapplet t
            INNER JOIN installed_tapplet it ON it.tapplet_id = t.id
            WHERE t.package_name = ?
            LIMIT 1
            "#
        )
        .bind(&package_name)
        .fetch_one(self.get_pool())
        .await
        {
            return Ok(Some(tapplet));
        }

        // If not found, try to find in dev_tapplet
        if let Ok(dev) = sqlx::query_as::<_, DevTapplet>(
            r#"
            SELECT id, package_name, source, display_name, csp, tari_permissions
            FROM dev_tapplet
            WHERE package_name = ?
            LIMIT 1
            "#,
        )
        .bind(&package_name)
        .fetch_one(self.get_pool())
        .await
        {
            // Convert DevTapplet to Tapplet (fill with dummy/defaults for missing fields)
            let tapplet = Tapplet {
                id: dev.id,
                package_name: dev.package_name,
                display_name: dev.display_name,
                logo_url: String::new(),
                background_url: String::new(),
                author_name: String::new(),
                author_website: String::new(),
                about_summary: String::new(),
                about_description: String::new(),
                category: String::from("dev"),
            };
            return Ok(Some(tapplet));
        }

        Ok(None)
    }

    pub async fn get_registered_tapplet_with_version(
        &self,
        registered_tapplet_id: i32,
    ) -> Result<(Tapplet, TappletVersion), Error> {
        // Fetch the tapplet
        let registered_tapplet = sqlx::query_as::<_, Tapplet>(
        "SELECT id, package_name, display_name, logo_url, background_url, author_name, author_website, about_summary, about_description, category FROM tapplet WHERE id = ?"
    )
    .bind(registered_tapplet_id)
    .fetch_one(self.get_pool())
    .await
    .map_err(|_| {
        DatabaseError(FailedToRetrieveData {
            entity_name: "tapplet".to_string(),
        })
    })?;

        // Fetch all versions for this tapplet
        let versions: Vec<TappletVersion> = sqlx::query_as::<_, TappletVersion>(
        "SELECT id, tapplet_id, version, integrity, registry_url FROM tapplet_version WHERE tapplet_id = ?"
    )
    .bind(registered_tapplet_id)
    .fetch_all(self.get_pool())
    .await
    .map_err(|_| {
        DatabaseError(FailedToRetrieveData {
            entity_name: "tapplet_version".to_string(),
        })
    })?;

        let versions = versions
            .into_iter()
            .map(|tapp_version| TappletSemver::try_from(tapp_version))
            .collect::<Result<Vec<TappletSemver>, Error>>()?;

        let latest_version = versions
            .into_iter()
            .max_by_key(|ver| ver.semver.clone())
            .ok_or(Error::VersionNotFound)?;

        Ok((registered_tapplet, latest_version.tapplet_version))
    }

    pub async fn get_installed_tapplets_with_display_name(
        &self,
    ) -> Result<Vec<InstalledTappletWithName>, Error> {
        let rows = sqlx::query_as::<_, InstalledTappletJoinRow>(
        r#"
        SELECT 
            it.id as it_id, it.tapplet_id as it_tapplet_id, it.tapplet_version_id as it_tapplet_version_id, it.source as it_source, it.csp as it_csp, it.tari_permissions as it_tari_permissions,
            t.id as t_id, t.package_name as t_package_name, t.display_name as t_display_name, t.logo_url as t_logo_url, t.background_url as t_background_url, t.author_name as t_author_name, t.author_website as t_author_website, t.about_summary as t_about_summary, t.about_description as t_about_description, t.category as t_category,
            tv.id as tv_id, tv.tapplet_id as tv_tapplet_id, tv.version as tv_version, tv.integrity as tv_integrity, tv.registry_url as tv_registry_url
        FROM installed_tapplet it
        INNER JOIN tapplet t ON it.tapplet_id = t.id
        INNER JOIN tapplet_version tv ON it.tapplet_version_id = tv.id
        "#
    )
    .fetch_all(self.get_pool())
    .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "DB error: {e:?}");
            DatabaseError(FailedToRetrieveData {
                entity_name: "installed_tapplet".to_string(),
            })
        })?;

        let mut result = Vec::new();

        for row in rows {
            let installed_tapplet = InstalledTapplet {
                id: row.it_id,
                tapplet_id: row.it_tapplet_id,
                tapplet_version_id: row.it_tapplet_version_id,
                source: row.it_source,
                csp: row.it_csp,
                tari_permissions: row.it_tari_permissions,
            };

            let tapp = Tapplet {
                id: row.t_id,
                package_name: row.t_package_name,
                display_name: row.t_display_name.clone(),
                logo_url: row.t_logo_url,
                background_url: row.t_background_url,
                author_name: row.t_author_name,
                author_website: row.t_author_website,
                about_summary: row.t_about_summary,
                about_description: row.t_about_description,
                category: row.t_category,
            };

            let tapp_version = TappletVersion {
                id: row.tv_id,
                tapplet_id: row.tv_tapplet_id,
                version: row.tv_version.clone(),
                integrity: row.tv_integrity,
                registry_url: row.tv_registry_url,
            };

            let latest_version_string = match self
                .get_registered_tapplet_with_version(tapp.id.unwrap())
                .await
            {
                Ok((_, latest_version)) => latest_version.version,
                Err(e) => {
                    warn!(target: LOG_TARGET, "⚠️ Could not get latest version for tapplet {}: {:?}, using installed version", tapp.display_name, e);
                    tapp_version.version.clone()
                }
            };

            result.push(InstalledTappletWithName {
                installed_tapplet,
                display_name: tapp.display_name,
                installed_version: tapp_version.version,
                latest_version: latest_version_string,
            });
        }

        Ok(result)
    }

    /// Get (package_name, version) for an installed_tapplet_id directly from the DB with a join query.
    pub async fn get_installed_tapplet_package_and_version(
        &self,
        installed_tapplet_id: i32,
    ) -> Result<(String, String), Error> {
        let row = sqlx::query_as::<_, (String, String)>(
            r#"
        SELECT t.package_name, tv.version
        FROM installed_tapplet it
        INNER JOIN tapplet t ON it.tapplet_id = t.id
        INNER JOIN tapplet_version tv ON it.tapplet_version_id = tv.id
        WHERE it.id = ?
        "#,
        )
        .bind(installed_tapplet_id)
        .fetch_one(self.get_pool())
        .await
        .map_err(|_| {
            DatabaseError(FailedToRetrieveData {
                entity_name: "tapplet".to_string(),
            })
        })?;

        Ok(row)
    }
}
