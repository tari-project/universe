use std::time::Duration;

use tokio::{
    sync::{RwLock, RwLockReadGuard, RwLockWriteGuard},
    time::sleep,
};

const LOCK_RETRY_DELAY: Duration = Duration::from_millis(100);

pub async fn try_read_with_retry<T>(
    lock: &RwLock<T>,
    retries: u32,
) -> Result<RwLockReadGuard<T>, String> {
    for i in 0..retries {
        match lock.try_read() {
            Ok(guard) => return Ok(guard),
            Err(_) => {
                if i == retries - 1 {
                    return Err(format!(
                        "Failed to acquire read lock after {} retries",
                        retries
                    ));
                }
                sleep(LOCK_RETRY_DELAY).await;
            }
        }
    }
    Err("Failed to acquire read lock".to_string())
}

pub async fn try_write_with_retry<T>(
    lock: &RwLock<T>,
    retries: u32,
) -> Result<RwLockWriteGuard<T>, String> {
    for i in 0..retries {
        match lock.try_write() {
            Ok(guard) => return Ok(guard),
            Err(_) => {
                if i == retries - 1 {
                    return Err(format!(
                        "Failed to acquire write lock after {} retries",
                        retries
                    ));
                }
                sleep(LOCK_RETRY_DELAY).await;
            }
        }
    }
    Err("Failed to acquire write lock".to_string())
}
