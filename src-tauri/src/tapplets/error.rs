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

use std::num::ParseIntError;
use thiserror::Error;

#[allow(clippy::enum_variant_names)]
#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    DatabaseError(#[from] DatabaseError),
    #[error(transparent)]
    IOError(#[from] IOError),
    #[error(transparent)]
    RequestError(#[from] RequestError),
    #[error(transparent)]
    TappletServerError(#[from] TappletServerError),
    #[error("tauri-error")]
    TauriError(#[from] tauri::Error),
    #[error(transparent)]
    JsonParsingError(#[from] serde_json::Error),
    #[error("failed-to-find-tapplet-config")]
    TappletConfigNotFound,
    #[error("failed-to-parse-tapplet-version")]
    VersionParseError,
    #[error("failed-to-find-tapplet-version")]
    VersionNotFound,
    #[error("failed-to-call-provider | method-{method} & params-{params}")]
    ProviderError { method: String, params: String },
    #[error("tapplet-invalid-checksum | version-{version}")]
    InvalidChecksum { version: String },
    #[error("tapplet-package-incomplete | version-{version}")]
    TappletIncomplete { version: String },
    #[error("failed-to-request | message-{message}")]
    RequestFailed { message: String },
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[derive(Debug, Error)]
pub enum TappletServerError {
    #[error("failed-to-obtain-local-address")]
    FailedToObtainLocalAddress,
    #[error("failed-to-start-tapplet-server")]
    FailedToStart,
    #[error("tapplet-server-already-running")]
    AlreadyRunning,
    #[error("token-for-tapplet-server-is-invalid")]
    TokenInvalid,
    #[error("failed-to-bind-port | port-{port}")]
    BindPortError { port: String },
    #[error("failed-to-stop-tapplet-server")]
    FailedToStop,
}

#[derive(Debug, Error)]
pub enum DatabaseError {
    #[error("already-exists | entity_name-{entity_name} & field_name-{field_name}")]
    AlreadyExists {
        entity_name: String,
        field_name: String,
    },
    #[error("failed-to-retrieve-data | entity_name-{entity_name}")]
    FailedToRetrieveData { entity_name: String },
    #[error("failed-to-delete | entity_name-{entity_name}")]
    FailedToDelete { entity_name: String },
    #[error("failed-to-update | entity_name-{entity_name}")]
    FailedToUpdate { entity_name: String },
    #[error("failed-to-create | entity_name-{entity_name}")]
    FailedToCreate { entity_name: String },
}

#[derive(Debug, Error)]
pub enum IOError {
    #[error("failed-to-copy-file | from-{from} & to-{to}")]
    FailedToCopyFile { from: String, to: String },
    #[error("failed-to-read-dir | path-{path}")]
    FailedToReadDir { path: String },
    #[error("failed-to-read-file | path-{path}")]
    FailedToReadFile { path: String },
    #[error("failed-to-create-dir | path-{path}")]
    FailedToCreateDir { path: String },
    #[error("failed-to-create-file | path-{path}")]
    FailedToCreateFile { path: String },
    #[error("failed-to-write-file | path-{path}")]
    FailedToWriteFile { path: String },
    #[error("failed-to-parse-int")]
    ParseIntError(#[from] ParseIntError),
    #[error("failed-to-unpack-file | path-{path}")]
    FailedToUnpackFile { path: String },
    #[error("missing-package-json-or-tapplet-manifest-json | path-{path}")]
    InvalidUnpackedFiles { path: String },
    #[error("failed-to-delete-tapplet | path-{path}")]
    FailedToDeleteTapplet { path: String },
    #[error("failed-to-get-file-path")]
    FailedToGetFilePath,
}

#[derive(Debug, Error)]
pub enum RequestError {
    #[error("fetch-manifest-error | {endpoint}")]
    FetchManifestError { endpoint: String },
    #[error("fetch-config-error | {endpoint}")]
    FetchConfigError { endpoint: String },
    #[error("manifest-response-error | {endpoint}: {e}")]
    ManifestResponseError { endpoint: String, e: String },
    #[error("failed-to-download | url-{url}")]
    FailedToDownload { url: String },
}
