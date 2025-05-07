use std::num::ParseIntError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
  #[error(transparent)] DatabaseError(#[from] DatabaseError),
  #[error(transparent)] IOError(#[from] IOError),
  #[error(transparent)] RequestError(#[from] RequestError),
  #[error(transparent)] TappletServerError(#[from] TappletServerError),
  #[error("tauri-error")] TauriError(#[from] tauri::Error),
  #[error(transparent)] JsonParsingError(#[from] serde_json::Error),
  #[error("failed-to-parse-tapplet-version")] VersionParseError,
  #[error("failed-to-find-tapplet-version")] VersionNotFound,
  #[error("failed-to-obtain-permission-token-lock")] FailedToObtainPermissionTokenLock,
  #[error("failed-to-obtain-auth-token-lock")] FailedToObtainAuthTokenLock,
  #[error("failed-to-call-provider | method-{method} & params-{params}")] ProviderError {
    method: String,
    params: String,
  },
  #[error("tapplet-invalid-checksum | version-{version}")] InvalidChecksum {
    version: String,
  },
  #[error("tapplet-package-incomplete | version-{version}")] TappletIncomplete {
    version: String,
  },
  #[error("failed-to-request | message-{message}")] RequestFailed {
    message: String,
  },
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::ser::Serializer {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

#[derive(Debug, Error)]
pub enum TappletServerError {
  #[error("failed-to-obtain-local-address")] FailedToObtainLocalAddress,
  #[error("failed-to-start-tapplet-server")] FailedToStart,
  #[error("tapplet-server-already-running")] AlreadyRunning,
  #[error("token-for-tapplet-server-is-invalid")] TokenInvalid,
  #[error("failed-to-bind-port | port-{port}")] BindPortError {
    port: String,
  },
}

#[derive(Debug, Error)]
pub enum DatabaseError {
  #[error("already-exists | entity_name-{entity_name} & field_name-{field_name}")] AlreadyExists {
    entity_name: String,
    field_name: String,
  },
  #[error("failed-to-retrieve-data | entity_name-{entity_name}")] FailedToRetrieveData {
    entity_name: String,
  },
  #[error("failed-to-delete | entity_name-{entity_name}")] FailedToDelete {
    entity_name: String,
  },
  #[error("failed-to-update | entity_name-{entity_name}")] FailedToUpdate {
    entity_name: String,
  },
  #[error("failed-to-create | entity_name-{entity_name}")] FailedToCreate {
    entity_name: String,
  },
}

#[derive(Debug, Error)]
pub enum IOError {
  #[error("failed-to-copy-file | from-{from} & to-{to}")] FailedToCopyFile {
    from: String,
    to: String,
  },
  #[error("failed-to-read-dir | path-{path}")] FailedToReadDir {
    path: String,
  },
  #[error("failed-to-read-file | path-{path}")] FailedToReadFile {
    path: String,
  },
  #[error("failed-to-create-dir | path-{path}")] FailedToCreateDir {
    path: String,
  },
  #[error("failed-to-create-file | path-{path}")] FailedToCreateFile {
    path: String,
  },
  #[error("failed-to-write-file | path-{path}")] FailedToWriteFile {
    path: String,
  },
  #[error("failed-to-parse-int")] ParseIntError(#[from] ParseIntError),
  #[error("failed-to-unpack-file | path-{path}")] FailedToUnpackFile {
    path: String,
  },
  #[error("missing-package-json-or-tapplet-manifest-json | path-{path}")] InvalidUnpackedFiles {
    path: String,
  },
  #[error("failed-to-delete-tapplet | path-{path}")] FailedToDeleteTapplet {
    path: String,
  },
  #[error("failed-to-get-file-path")] FailedToGetFilePath,
}

#[derive(Debug, Error)]
pub enum RequestError {
  #[error("fetch-manifest-error | endpoint-{endpoint}")] FetchManifestError {
    endpoint: String,
  },
  #[error("manifest-response-error | endpoint-{endpoint}")] ManifestResponseError {
    endpoint: String,
  },
  #[error("failed-to-download | url-{url}")] FailedToDownload {
    url: String,
  },
}
