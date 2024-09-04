use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize, Clone)]
pub struct SetupStatusEvent {
    pub event_type: String,
    pub title: String,
    pub title_params: Option<HashMap<String, String>>,
    pub progress: f64,
}
