use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use diesel::SqliteConnection;
use tokio_util::sync::CancellationToken;

#[derive(Default)]
pub struct ShutdownTokens(Arc<tokio::sync::Mutex<HashMap<i32, CancellationToken>>>);
pub struct DatabaseConnection(Arc<Mutex<SqliteConnection>>);
pub struct AssetServer {
    pub addr: String,
    pub cancel_token: CancellationToken,
}
