use std::sync::{Arc, Mutex};
use tokio::time::{sleep, Duration};

#[derive(Debug)]
pub struct AutoRollback<T> {
    value: Arc<Mutex<T>>,
    initial_value: T,
}

impl<T> AutoRollback<T>
where
    T: Clone + Send + 'static,
{
    pub fn new(value: T) -> Self {
        AutoRollback {
            value: Arc::new(Mutex::new(value.clone())),
            initial_value: value,
        }
    }

    pub async fn set_value(&self, new_value: T, rollback_delay: Duration) {
        // Update the value
        {
            let mut val = self.value.lock().unwrap();
            *val = new_value;
        }

        // Spawn a task that will rollback the value after the delay
        let value_clone = Arc::clone(&self.value);
        let initial_value = self.initial_value.clone();
        tokio::spawn(async move {
            sleep(rollback_delay).await;

            println!("Rollback finished after {:?}", rollback_delay);
            // Rollback to the initial value
            let mut val = value_clone.lock().unwrap();
            *val = initial_value;
        });
    }

    pub fn get_value(&self) -> T
    where
        T: Clone,
    {
        let val = self.value.lock().unwrap();
        val.clone()
    }
}
