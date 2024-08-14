use std::sync::Arc;
use tokio::sync::RwLock;
use crate::p2pool_adapter::P2poolAdapter;
use crate::process_watcher::ProcessWatcher;

pub struct P2poolManager {
    watcher: Arc<RwLock<ProcessWatcher<P2poolAdapter>>>,
}