use diesel::prelude::*;
use diesel::SqliteConnection;
use std::ops::DerefMut;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::MutexGuard;

use crate::database::models::TappletAudit;
use crate::database::models::TappletVersion;
use crate::database::models::{
    CreateInstalledTapplet, CreateTapplet, InstalledTapplet, Tapplet, UpdateTapplet,
};
use crate::interface::InstalledTappletWithName;
use crate::interface::TappletSemver;
use crate::ootle::error::{
    DatabaseError::*,
    Error::{self, DatabaseError},
};

use super::models::CreateDevTapplet;
use super::models::CreateTappletAsset;
use super::models::CreateTappletAudit;
use super::models::CreateTappletVersion;
use super::models::DevTapplet;
use super::models::TappletAsset;
use super::models::UpdateDevTapplet;
use super::models::UpdateInstalledTapplet;
use super::models::UpdateTappletAsset;
use super::models::UpdateTappletAudit;
use super::models::UpdateTappletVersion;

pub struct SqliteStore {
    connection: Arc<Mutex<SqliteConnection>>,
}

impl SqliteStore {
    pub fn new(connection: Arc<Mutex<SqliteConnection>>) -> Self {
        Self { connection }
    }

    pub fn get_connection(&self) -> MutexGuard<SqliteConnection> {
        self.connection.lock().unwrap()
    }
}

pub trait Store<T, U, G> {
    fn get_all(&mut self) -> Result<Vec<T>, Error>;
    fn get_by_id(&mut self, id: i32) -> Result<T, Error>;
    fn create(&mut self, item: &U) -> Result<T, Error>;
    fn delete(&mut self, entity: T) -> Result<usize, Error>;
    fn update(&mut self, old: T, new: &G) -> Result<usize, Error>;
}

impl SqliteStore {
    pub fn get_installed_tapplets_with_display_name(
        &mut self,
    ) -> Result<Vec<InstalledTappletWithName>, Error> {
        use crate::database::schema::installed_tapplet::dsl::*;
        use crate::database::schema::tapplet::dsl::*;
        use crate::database::schema::tapplet_version::dsl::*;

        let tapplets: Vec<(InstalledTapplet, Tapplet, TappletVersion)> = installed_tapplet
            .inner_join(tapplet)
            .inner_join(tapplet_version)
            .select((
                installed_tapplet::all_columns(),
                tapplet::all_columns(),
                tapplet_version::all_columns(),
            ))
            .load::<(InstalledTapplet, Tapplet, TappletVersion)>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "installed tapplet".to_string(),
                })
            })?;

        let result = tapplets
            .into_iter()
            .map(|(installed_tapp, tapp, tapp_version)| {
                let test1 = self
                    .get_registered_tapplet_with_version(tapp.id.unwrap())
                    .unwrap();

                return InstalledTappletWithName {
                    installed_tapplet: installed_tapp,
                    display_name: tapp.display_name,
                    installed_version: tapp_version.version,
                    latest_version: test1.1.version,
                };
            })
            .collect();

        Ok(result)
    }

    pub fn get_installed_tapplet_full_by_id(
        &mut self,
        installed_tapplet_id: i32,
    ) -> Result<(InstalledTapplet, Tapplet, TappletVersion), Error> {
        use crate::database::schema::installed_tapplet::dsl::id;
        use crate::database::schema::installed_tapplet::dsl::*;
        use crate::database::schema::tapplet::dsl::*;
        use crate::database::schema::tapplet_version::dsl::*;

        installed_tapplet
            .filter(id.eq(installed_tapplet_id))
            .inner_join(tapplet)
            .inner_join(tapplet_version)
            .select((
                installed_tapplet::all_columns(),
                tapplet::all_columns(),
                tapplet_version::all_columns(),
            ))
            .first::<(InstalledTapplet, Tapplet, TappletVersion)>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "installed tapplet".to_string(),
                })
            })
    }

    pub fn get_registered_tapplet_with_version(
        &mut self,
        registered_tapplet_id: i32,
    ) -> Result<(Tapplet, TappletVersion), Error> {
        use crate::database::schema::tapplet::dsl::id;
        use crate::database::schema::tapplet::dsl::*;
        use crate::database::schema::tapplet_version::dsl::*;

        let boxed_tapplet = tapplet
            .filter(id.eq(registered_tapplet_id))
            .first::<Tapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "tapplet".to_string(),
                })
            })?;

        let versions: Vec<TappletVersion> = tapplet_version
            .filter(tapplet_id.eq(registered_tapplet_id))
            .load::<TappletVersion>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "tapplet version".to_string(),
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

        return Ok((boxed_tapplet, latest_version.tapplet_version));
    }

    pub fn get_tapplet_assets_by_tapplet_id(
        &mut self,
        tapp_id: i32,
    ) -> Result<Option<TappletAsset>, Error> {
        use crate::database::schema::tapplet_asset::dsl::*;

        tapplet_asset
            .filter(tapplet_id.eq(tapp_id))
            .first::<TappletAsset>(self.get_connection().deref_mut())
            .optional()
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "tapplet asset".to_string(),
                })
            })
    }
}

impl<'a> Store<Tapplet, CreateTapplet<'a>, UpdateTapplet> for SqliteStore {
    fn get_all(&mut self) -> Result<Vec<Tapplet>, Error> {
        use crate::database::schema::tapplet::dsl::*;

        tapplet
            .load::<Tapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet".to_string(),
                })
            })
    }

    fn get_by_id(&mut self, tapplet_id: i32) -> Result<Tapplet, Error> {
        use crate::database::schema::tapplet::dsl::*;

        tapplet
            .filter(id.eq(tapplet_id))
            .first::<Tapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet".to_string(),
                })
            })
    }

    fn create(&mut self, item: &CreateTapplet) -> Result<Tapplet, Error> {
        use crate::database::schema::tapplet;

        diesel::insert_into(tapplet::table)
            .values(item)
            .on_conflict(tapplet::package_name)
            .do_update()
            .set(UpdateTapplet::from(item))
            .get_result(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToCreate {
                    entity_name: "Tapplet".to_string(),
                })
            })
    }

    fn delete(&mut self, entity: Tapplet) -> Result<usize, Error> {
        use crate::database::schema::tapplet::dsl::*;

        diesel::delete(tapplet.filter(id.eq(entity.id)))
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToDelete {
                    entity_name: "Tapplet".to_string(),
                })
            })
    }

    fn update(&mut self, old: Tapplet, new: &UpdateTapplet) -> Result<usize, Error> {
        use crate::database::schema::tapplet::dsl::*;

        diesel::update(tapplet.filter(id.eq(old.id)))
            .set(new)
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToUpdate {
                    entity_name: "Tapplet".to_string(),
                })
            })
    }
}

impl Store<InstalledTapplet, CreateInstalledTapplet, UpdateInstalledTapplet> for SqliteStore {
    fn get_all(&mut self) -> Result<Vec<InstalledTapplet>, Error> {
        use crate::database::schema::installed_tapplet::dsl::*;

        installed_tapplet
            .load::<InstalledTapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Installed Tapplet".to_string(),
                })
            })
    }

    fn get_by_id(&mut self, installed_tapplet_id: i32) -> Result<InstalledTapplet, Error> {
        use crate::database::schema::installed_tapplet::dsl::*;

        installed_tapplet
            .filter(id.eq(installed_tapplet_id))
            .first::<InstalledTapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "installed Tapplet".to_string(),
                })
            })
    }

    fn create(&mut self, item: &CreateInstalledTapplet) -> Result<InstalledTapplet, Error> {
        use crate::database::schema::installed_tapplet;

        diesel::insert_into(installed_tapplet::table)
            .values(item)
            .on_conflict((
                installed_tapplet::tapplet_id,
                installed_tapplet::tapplet_version_id,
            ))
            .do_update()
            .set(UpdateInstalledTapplet::from(item))
            .get_result(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToCreate {
                    entity_name: "Installed Tapplet".to_string(),
                })
            })
    }

    fn update(
        &mut self,
        old: InstalledTapplet,
        new: &UpdateInstalledTapplet,
    ) -> Result<usize, Error> {
        use crate::database::schema::installed_tapplet::dsl::*;

        diesel::update(installed_tapplet.filter(id.eq(old.id)))
            .set(new)
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToUpdate {
                    entity_name: "installed Tapplet".to_string(),
                })
            })
    }

    fn delete(&mut self, entity: InstalledTapplet) -> Result<usize, Error> {
        use crate::database::schema::installed_tapplet::dsl::*;

        diesel::delete(installed_tapplet.filter(id.eq(entity.id)))
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToDelete {
                    entity_name: "installed Tapplet".to_string(),
                })
            })
    }
}

impl<'a> Store<TappletVersion, CreateTappletVersion<'a>, UpdateTappletVersion> for SqliteStore {
    fn get_all(&mut self) -> Result<Vec<TappletVersion>, Error> {
        use crate::database::schema::tapplet_version::dsl::*;

        tapplet_version
            .load::<TappletVersion>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet version".to_string(),
                })
            })
    }

    fn get_by_id(&mut self, tapplet_version_id: i32) -> Result<TappletVersion, Error> {
        use crate::database::schema::tapplet_version::dsl::*;

        tapplet_version
            .filter(id.eq(tapplet_version_id))
            .first::<TappletVersion>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet version".to_string(),
                })
            })
    }

    fn create(&mut self, item: &CreateTappletVersion) -> Result<TappletVersion, Error> {
        use crate::database::schema::tapplet_version;

        diesel::insert_into(tapplet_version::table)
            .values(item)
            .on_conflict((tapplet_version::version, tapplet_version::tapplet_id))
            .do_update()
            .set(UpdateTappletVersion::from(item))
            .get_result(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToCreate {
                    entity_name: "Tapplet version".to_string(),
                })
            })
    }

    fn update(&mut self, old: TappletVersion, new: &UpdateTappletVersion) -> Result<usize, Error> {
        use crate::database::schema::tapplet_version::dsl::*;

        diesel::update(tapplet_version.filter(id.eq(old.id)))
            .set(new)
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToUpdate {
                    entity_name: "Tapplet version".to_string(),
                })
            })
    }

    fn delete(&mut self, entity: TappletVersion) -> Result<usize, Error> {
        use crate::database::schema::tapplet_version::dsl::*;

        diesel::delete(tapplet_version.filter(id.eq(entity.id)))
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToDelete {
                    entity_name: "Tapplet version".to_string(),
                })
            })
    }
}

impl<'a> Store<TappletAudit, CreateTappletAudit<'a>, UpdateTappletAudit> for SqliteStore {
    fn get_all(&mut self) -> Result<Vec<TappletAudit>, Error> {
        use crate::database::schema::tapplet_audit::dsl::*;

        tapplet_audit
            .load::<TappletAudit>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet audit".to_string(),
                })
            })
    }

    fn get_by_id(&mut self, tapplet_audit_id: i32) -> Result<TappletAudit, Error> {
        use crate::database::schema::tapplet_audit::dsl::*;

        tapplet_audit
            .filter(id.eq(tapplet_audit_id))
            .first::<TappletAudit>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet audit".to_string(),
                })
            })
    }

    fn create(&mut self, item: &CreateTappletAudit) -> Result<TappletAudit, Error> {
        use crate::database::schema::tapplet_audit;

        diesel::insert_into(tapplet_audit::table)
            .values(item)
            .on_conflict((tapplet_audit::auditor, tapplet_audit::tapplet_id))
            .do_update()
            .set(UpdateTappletAudit::from(item))
            .get_result(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToCreate {
                    entity_name: "Tapplet audit".to_string(),
                })
            })
    }

    fn update(&mut self, old: TappletAudit, new: &UpdateTappletAudit) -> Result<usize, Error> {
        use crate::database::schema::tapplet_audit::dsl::*;

        diesel::update(tapplet_audit.filter(id.eq(old.id)))
            .set(new)
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToUpdate {
                    entity_name: "Tapplet audit".to_string(),
                })
            })
    }

    fn delete(&mut self, entity: TappletAudit) -> Result<usize, Error> {
        use crate::database::schema::tapplet_audit::dsl::*;

        diesel::delete(tapplet_audit.filter(id.eq(entity.id)))
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToDelete {
                    entity_name: "Tapplet audit".to_string(),
                })
            })
    }
}

impl<'a> Store<DevTapplet, CreateDevTapplet<'a>, UpdateDevTapplet> for SqliteStore {
    fn get_all(&mut self) -> Result<Vec<DevTapplet>, Error> {
        use crate::database::schema::dev_tapplet::dsl::*;

        dev_tapplet
            .load::<DevTapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Dev Tapplet".to_string(),
                })
            })
    }

    fn get_by_id(&mut self, dev_tapplet_id: i32) -> Result<DevTapplet, Error> {
        use crate::database::schema::dev_tapplet::dsl::*;

        dev_tapplet
            .filter(id.eq(dev_tapplet_id))
            .first::<DevTapplet>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Dev Tapplet".to_string(),
                })
            })
    }

    fn create(&mut self, item: &CreateDevTapplet) -> Result<DevTapplet, Error> {
        use crate::database::schema::dev_tapplet;

        diesel::insert_into(dev_tapplet::table)
            .values(item)
            .get_result(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(AlreadyExists {
                    entity_name: "Dev Tapplet".to_string(),
                    field_name: "endpoint".to_string(),
                })
            })
    }

    fn update(&mut self, old: DevTapplet, new: &UpdateDevTapplet) -> Result<usize, Error> {
        use crate::database::schema::dev_tapplet::dsl::*;

        diesel::update(dev_tapplet.filter(id.eq(old.id)))
            .set(new)
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToUpdate {
                    entity_name: "Dev Tapplet".to_string(),
                })
            })
    }

    fn delete(&mut self, entity: DevTapplet) -> Result<usize, Error> {
        use crate::database::schema::dev_tapplet::dsl::*;

        diesel::delete(dev_tapplet.filter(id.eq(entity.id)))
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToDelete {
                    entity_name: "Dev Tapplet".to_string(),
                })
            })
    }
}

impl<'a> Store<TappletAsset, CreateTappletAsset<'a>, UpdateTappletAsset> for SqliteStore {
    fn get_all(&mut self) -> Result<Vec<TappletAsset>, Error> {
        use crate::database::schema::tapplet_asset::dsl::*;

        tapplet_asset
            .load::<TappletAsset>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet asset".to_string(),
                })
            })
    }

    fn get_by_id(&mut self, tapplet_asset_id: i32) -> Result<TappletAsset, Error> {
        use crate::database::schema::tapplet_asset::dsl::*;

        tapplet_asset
            .filter(id.eq(tapplet_asset_id))
            .first::<TappletAsset>(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToRetrieveData {
                    entity_name: "Tapplet asset".to_string(),
                })
            })
    }

    fn create(&mut self, item: &CreateTappletAsset) -> Result<TappletAsset, Error> {
        use crate::database::schema::tapplet_asset;

        diesel::insert_into(tapplet_asset::table)
            .values(item)
            .get_result(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToCreate {
                    entity_name: "Tapplet asset".to_string(),
                })
            })
    }

    fn update(&mut self, old: TappletAsset, new: &UpdateTappletAsset) -> Result<usize, Error> {
        use crate::database::schema::tapplet_asset::dsl::*;

        diesel::update(tapplet_asset.filter(id.eq(old.id)))
            .set(new)
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToUpdate {
                    entity_name: "Tapplet asset".to_string(),
                })
            })
    }

    fn delete(&mut self, entity: TappletAsset) -> Result<usize, Error> {
        use crate::database::schema::tapplet_asset::dsl::*;

        diesel::delete(tapplet_asset.filter(id.eq(entity.id)))
            .execute(self.get_connection().deref_mut())
            .map_err(|_| {
                DatabaseError(FailedToDelete {
                    entity_name: "Tapplet asset".to_string(),
                })
            })
    }
}
