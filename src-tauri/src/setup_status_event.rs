use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct SetupStatusEvent {
    pub event_type: String,
    pub title: String,
    pub progress: f64,
}
