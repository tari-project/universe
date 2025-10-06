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

#![allow(dead_code, unused_variables, unused_must_use)]

use croner::{self, parser::CronParser};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fmt::Display,
    sync::{
        atomic::{AtomicU64, Ordering},
        LazyLock,
    },
    time::{Duration},
};
use tokio::{
    sync::{mpsc, RwLock, RwLockReadGuard, RwLockWriteGuard},
    time::sleep,
};

use crate::{
    configs::{
        config_core::{ConfigCore, ConfigCoreContent}, config_mining::{MiningMode, MiningModeType}, trait_config::ConfigImpl
    },
    tasks_tracker::TasksTrackers,
};

static LOG_TARGET: &str = "tari::universe::event_scheduler";
static INSTANCE: LazyLock<RwLock<EventScheduler>> =
    LazyLock::new(|| RwLock::new(EventScheduler::new()));
static EVENT_ID_COUNTER: AtomicU64 = AtomicU64::new(1);

// Internal message types for the scheduler
#[derive(Debug)]
enum SchedulerMessage {
    AddEvent {
        event_type: EventType,
        timing: EventTiming,
        event_id: String,
        response: tokio::sync::oneshot::Sender<Result<String, SchedulerError>>,
    },
    RemoveEvent {
        event_id: String,
        response: tokio::sync::oneshot::Sender<Result<(), SchedulerError>>,
    },
    PauseEvent {
        event_id: String,
        response: tokio::sync::oneshot::Sender<Result<(), SchedulerError>>,
    },
    ResumeEvent {
        event_id: String,
        response: tokio::sync::oneshot::Sender<Result<(), SchedulerError>>,
    },
    TriggerEvent {
        event_id: String,
    },
}


#[derive(Debug, Clone)]
pub enum SchedulerError {
    InvalidCronPattern(String),
    EventNotFound(String),
    EventAlreadyPaused(String),
    EventAlreadyRunning(String),
    SchedulerNotRunning,
    InternalError(String),
}

impl Display for SchedulerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidCronPattern(pattern) => write!(f, "Invalid cron pattern: {}", pattern),
            Self::EventNotFound(id) => write!(f, "Event not found: {:?}", id),
            Self::EventAlreadyPaused(id) => write!(f, "Event already paused: {:?}", id),
            Self::EventAlreadyRunning(id) => write!(f, "Event already running: {:?}", id),
            Self::SchedulerNotRunning => write!(f, "Scheduler is not running"),
            Self::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for SchedulerError {}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum EventTiming {
    In(Duration),            // e.g., In(2 hours) - triggers once after the duration
    Between(String, String), // e.g., Between("0 22 * * *", "0 6 * * *") (10PM to 6AM every day)
}

impl EventTiming {
    // It will parse two cases:
    // 1. In X hours => EventTiming::In(Duration::from_secs(X * 3600))
    // 2. Between X and Y => EventTiming::Between("cron_pattern_for_X", "cron_pattern_for_Y") Where X and Y are 12-hour times like "10 PM" and "6 AM"
    pub fn from_string(s: String) -> Result<Self, SchedulerError> {
        let s = s.trim();
        if s.to_lowercase().starts_with("in ") {
            let parts: Vec<&str> = s[3..].trim().split_whitespace().collect();
            if parts.len() == 2 {
                let value: u64 = parts[0].parse().map_err(|_| SchedulerError::InternalError("Invalid duration value".to_string()))?;
                let unit = parts[1].to_lowercase();
                let duration = match unit.as_str() {
                    "hour" | "hours" => Duration::from_secs(value * 3600),
                    _ => return Err(SchedulerError::InternalError("Invalid duration unit".to_string())),
                };
                Ok(EventTiming::In(duration))
            } else {
                Err(SchedulerError::InternalError("Invalid 'In' format".to_string()))
            }
        } else if s.to_lowercase().starts_with("between ") {
            let parts: Vec<&str> = s[8..].trim().split(" and ").collect();
            if parts.len() == 2 {
                let start = parts[0].trim();
                let end = parts[1].trim();
                // Convert to cron patterns
                let start_cron = Self::time_to_cron(start)?;
                let end_cron = Self::time_to_cron(end)?;
                Ok(EventTiming::Between(start_cron, end_cron))
            } else {
                Err(SchedulerError::InternalError("Invalid 'Between' format".to_string()))
            }
        } else {
            Err(SchedulerError::InternalError("Invalid timing format".to_string()))
        }
    }

    fn time_to_cron(time_str: &str) -> Result<String, SchedulerError> {
        // Expecting format like "10 PM" or "6 AM"
        let parts: Vec<&str> = time_str.split_whitespace().collect();
        if parts.len() != 2 {
            return Err(SchedulerError::InternalError("Invalid time format".to_string()));
        }
        let hour: u32 = parts[0].parse().map_err(|_| SchedulerError::InternalError("Invalid hour value".to_string()))?;
        let period = parts[1].to_uppercase();
        if hour < 1 || hour > 12 || (period != "AM" && period != "PM") {
            return Err(SchedulerError::InternalError("Invalid time value".to_string()));
        }
        let hour_24 = if period == "AM" {
            if hour == 12 { 0 } else { hour }
        } else {
            if hour == 12 { 12 } else { hour + 12 }
        };
        // Cron pattern for every day at the specified hour
        Ok(format!("0 {} * * *", hour_24))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledEventInfo {
    pub id: String,
    pub event_type: EventType,
    pub timing: EventTiming,
}

impl EventTiming {
    pub fn is_persistent(&self) -> bool {
        matches!(self, EventTiming::Between(_, _))
    }

    /// Validates cron patterns for Between timing
    pub fn validate(&self) -> Result<(), SchedulerError> {
        match self {
            EventTiming::In(_) => Ok(()),
            EventTiming::Between(start, end) => {
                // Validate both cron patterns
                CronParser::builder()
                    .build()
                    .parse(start)
                    .map_err(|_| SchedulerError::InvalidCronPattern(start.clone()))?;
                CronParser::builder()
                    .build()
                    .parse(end)
                    .map_err(|_| SchedulerError::InvalidCronPattern(end.clone()))?;
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub enum EventType {
    PauseMining,
    Mine { mining_mode: MiningMode }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EventState {
    Active,
    Paused,
    Completed,
}

impl EventType {
    pub fn is_unique(&self) -> bool {
        matches!(self, EventType::PauseMining)
    }
}

impl Display for EventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventType::PauseMining => write!(f, "Pause Mining"),
            EventType::Mine { mining_mode } => write!(f, "Mine ({})", mining_mode.mode_name),
        }
    }
}

// Internal representation of a scheduled event
#[derive(Debug)]
struct ScheduledEvent {
    id: String,
    event_type: EventType,
    timing: EventTiming,
    state: EventState,
    task_handle: Option<tokio::task::JoinHandle<()>>,
}

pub struct EventScheduler {
    scheduled_events: HashMap<String, ScheduledEvent>,  // Store events with their scheduling details
    message_sender: Option<mpsc::UnboundedSender<SchedulerMessage>>, // Channel for sending messages to the scheduler task
    is_running: bool, // Flag to track if the listener is running
}

impl EventScheduler {
    pub fn new() -> Self {
        EventScheduler {
            scheduled_events: HashMap::new(),
            message_sender: None,
            is_running: false,
        }
    }

    pub async fn write() -> RwLockWriteGuard<'static, EventScheduler> {
        INSTANCE.write().await
    }

    pub async fn read() -> RwLockReadGuard<'static, EventScheduler> {
        INSTANCE.read().await
    }

    pub async fn schedule_event(&self, event_type: EventType,event_id:String, timing: EventTiming) -> Result<String, SchedulerError> {
        timing.validate()?;

        if let Some(sender) = &self.message_sender {
            let (response_tx, response_rx) = tokio::sync::oneshot::channel();
            
            sender.send(SchedulerMessage::AddEvent {
                event_type,
                timing,
                event_id,
                response: response_tx,
            }).map_err(|_| SchedulerError::SchedulerNotRunning)?;

            response_rx.await.map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
        } else {
            Err(SchedulerError::SchedulerNotRunning)
        }
    }

    pub async fn remove_event(&self, event_id: String) -> Result<(), SchedulerError> {
        if let Some(sender) = &self.message_sender {
            let (response_tx, response_rx) = tokio::sync::oneshot::channel();
            
            sender.send(SchedulerMessage::RemoveEvent {
                event_id,
                response: response_tx,
            }).map_err(|_| SchedulerError::SchedulerNotRunning)?;

            response_rx.await.map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
        } else {
            Err(SchedulerError::SchedulerNotRunning)
        }
    }

    pub async fn pause_event(&self, event_id: String) -> Result<(), SchedulerError> {
        if let Some(sender) = &self.message_sender {
            let (response_tx, response_rx) = tokio::sync::oneshot::channel();
            
            sender.send(SchedulerMessage::PauseEvent {
                event_id,
                response: response_tx,
            }).map_err(|_| SchedulerError::SchedulerNotRunning)?;

            response_rx.await.map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
        } else {
            Err(SchedulerError::SchedulerNotRunning)
        }
    }

    pub async fn resume_event(&self, event_id: String) -> Result<(), SchedulerError> {
        if let Some(sender) = &self.message_sender {
            let (response_tx, response_rx) = tokio::sync::oneshot::channel();
            
            sender.send(SchedulerMessage::ResumeEvent {
                event_id,
                response: response_tx,
            }).map_err(|_| SchedulerError::SchedulerNotRunning)?;

            response_rx.await.map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
        } else {
            Err(SchedulerError::SchedulerNotRunning)
        }
    }

    async fn save_persistent_events_to_config(&self) {
        let persistent_events: HashMap<String, ScheduledEventInfo> = HashMap::from_iter(
            self.scheduled_events.iter()
                .filter(|(_, event)| event.timing.is_persistent())
                .map(|(id, event)| (id.clone(), ScheduledEventInfo {
                    id: id.clone(),
                    event_type: event.event_type.clone(),
                    timing: event.timing.clone(),
                }))
        );

        ConfigCore::update_field(ConfigCoreContent::set_scheduler_events, persistent_events).await.unwrap_or_else(|e| {
            error!(target: LOG_TARGET, "Failed to save persistent events to config: {}", e);
        });
    }
    async fn execute_event_callback(&self, event_type: &EventType, event_id: String) {
        info!(target: LOG_TARGET, "Executing event callback for {:?} (ID: {:?})", event_type, event_id);
        
        match event_type {
            EventType::PauseMining => {
                info!(target: LOG_TARGET, "Event callback: Pausing mining...");
                // TODO: Add your pause mining logic here
            },
            EventType::Mine { mining_mode } => {
                info!(target: LOG_TARGET, "Event callback: Mining operation...");
                // TODO: Add your mining operation logic here
            },
        }
    }

    async fn load_persistent_events(&mut self) -> Result<HashMap<String, ScheduledEvent>, SchedulerError> {
        let persistent_events_from_config = ConfigCore::content().await.scheduler_events().clone();
        let scheduled_events = HashMap::from_iter(
            persistent_events_from_config.into_iter().map(|(id, info)| {
                (id, ScheduledEvent {
                    id: info.id,
                    event_type: info.event_type,
                    timing: info.timing,
                    state: EventState::Active,
                    task_handle: None,
                })
            })
        );
        Ok(scheduled_events)
    }

    pub async fn spawn_listener(&mut self) -> Result<(), SchedulerError> {
        if self.is_running {
            return Ok(());
        }

        let (message_tx, mut message_rx) = mpsc::unbounded_channel::<SchedulerMessage>();
        self.message_sender = Some(message_tx);
        self.is_running = true;

        let persistent_events_from_config = self.load_persistent_events().await?;

        let task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        info!(target: LOG_TARGET, "Starting Event Scheduler Listener");

        task_tracker.spawn(async move {
            let mut internal_events: HashMap<String, ScheduledEvent> = persistent_events_from_config;
            
            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Event Scheduler Listener received shutdown signal");
                        
                        for (_, mut event) in internal_events.drain() {
                            if let Some(handle) = event.task_handle.take() {
                                handle.abort();
                            }
                        }
                        
                        let scheduler = INSTANCE.read().await;
                        scheduler.save_persistent_events_to_config().await;
                        break;
                    },
                    
                    message = message_rx.recv() => {
                        match message {
                            Some(SchedulerMessage::AddEvent { event_type, timing, event_id,response }) => {
                                let result = Self::handle_add_event(&mut internal_events, event_type, event_id, timing).await;
                                let _ = response.send(result);
                            },
                            
                            Some(SchedulerMessage::RemoveEvent { event_id, response }) => {
                                let result = Self::handle_remove_event(&mut internal_events, event_id);
                                let _ = response.send(result);
                            },
                            
                            Some(SchedulerMessage::PauseEvent { event_id, response }) => {
                                let result = Self::handle_pause_event(&mut internal_events, event_id);
                                let _ = response.send(result);
                            },
                            
                            Some(SchedulerMessage::ResumeEvent { event_id, response }) => {
                                let result = Self::handle_resume_event(&mut internal_events, event_id).await;
                                let _ = response.send(result);
                            },
                            
                            Some(SchedulerMessage::TriggerEvent { event_id }) => {
                                Self::handle_trigger_event(&internal_events, event_id).await;
                            },
                            
                            
                            None => {
                                warn!(target: LOG_TARGET, "Message channel closed, stopping scheduler");
                                break;
                            }
                        }
                    }
                }
            }

            info!(target: LOG_TARGET, "Event Scheduler Listener stopped");
        });

        Ok(())
    }

    async fn handle_add_event(
        events: &mut HashMap<String, ScheduledEvent>,
        event_type: EventType,
        event_id: String,
        timing: EventTiming,
    ) -> Result<String, SchedulerError> {
        if event_type.is_unique() {
            let to_remove: Vec<String> = events
                .iter()
                .filter(|(_, event)| event.event_type == event_type)
                .map(|(id, _)| id.clone())
                .collect();
                
            for id in to_remove {
                if let Err(e) = Self::handle_remove_event(events, id.clone()) {
                    warn!(target: LOG_TARGET, "Failed to remove duplicate event {:?}: {}", id, e);
                }
            }
        }

        let mut scheduled_event = ScheduledEvent {
            id: event_id.clone(),
            event_type: event_type.clone(),
            timing: timing.clone(),
            state: EventState::Active,
            task_handle: None,
        };

        let task_handle = Self::create_scheduling_task(event_id.clone(), event_type, timing).await?;
        scheduled_event.task_handle = Some(task_handle);

        info!(target: LOG_TARGET, "Added event {:?} with ID {:?}", scheduled_event.event_type, event_id.clone());
        events.insert(event_id.clone(), scheduled_event);
        
        Ok(event_id)
    }

    fn handle_remove_event(
        events: &mut HashMap<String, ScheduledEvent>,
        event_id: String,
    ) -> Result<(), SchedulerError> {
        if let Some(mut event) = events.remove(&event_id) {
            if let Some(handle) = event.task_handle.take() {
                handle.abort();
            }
            info!(target: LOG_TARGET, "Removed event with ID {:?}", event_id);
            Ok(())
        } else {
            Err(SchedulerError::EventNotFound(event_id))
        }
    }

    fn handle_pause_event(
        events: &mut HashMap<String, ScheduledEvent>,
        event_id: String,
    ) -> Result<(), SchedulerError> {
        if let Some(event) = events.get_mut(&event_id) {
            if event.state == EventState::Paused {
                return Err(SchedulerError::EventAlreadyPaused(event_id));
            }
            
            event.state = EventState::Paused;
            if let Some(handle) = event.task_handle.take() {
                handle.abort();
            }
            
            info!(target: LOG_TARGET, "Paused event with ID {:?}", event_id);
            Ok(())
        } else {
            Err(SchedulerError::EventNotFound(event_id))
        }
    }

    async fn handle_resume_event(
        events: &mut HashMap<String, ScheduledEvent>,
        event_id: String,
    ) -> Result<(), SchedulerError> {
        if let Some(event) = events.get_mut(&event_id) {
            if event.state != EventState::Paused {
                return Err(SchedulerError::EventAlreadyRunning(event_id));
            }
            
            event.state = EventState::Active;
            
            let task_handle = Self::create_scheduling_task(
                event_id.clone(),
                event.event_type.clone(),
                event.timing.clone(),
            ).await?;
            
            event.task_handle = Some(task_handle);
            
            info!(target: LOG_TARGET, "Resumed event with ID {:?}", event_id);
            Ok(())
        } else {
            Err(SchedulerError::EventNotFound(event_id))
        }
    }

    async fn handle_trigger_event(events: &HashMap<String, ScheduledEvent>, event_id: String) {
        if let Some(event) = events.get(&event_id) {
            if event.state == EventState::Active {
                let scheduler = INSTANCE.read().await;
                scheduler.execute_event_callback(&event.event_type, event_id).await;
            }
        }
    }

    // Create a scheduling task for different timing types
    async fn create_scheduling_task(
        event_id: String,
        _event_type: EventType, // Not used in scheduling logic, only for identification
        timing: EventTiming,
    ) -> Result<tokio::task::JoinHandle<()>, SchedulerError> {
        let handle = match timing {
            EventTiming::In(duration) => {
                tokio::spawn(async move {
                    sleep(duration).await;
                    
                    if let Some(sender) = &INSTANCE.read().await.message_sender {
                        let _ = sender.send(SchedulerMessage::TriggerEvent { event_id });
                    }
                })
            },
            
            EventTiming::Between(start_cron, end_cron) => {
                let start_cron_parsed = CronParser::builder()
                    .build()
                    .parse(&start_cron)
                    .map_err(|_| SchedulerError::InvalidCronPattern(start_cron.clone()))?;
                let end_cron_parsed = CronParser::builder()
                    .build()
                    .parse(&end_cron)
                    .map_err(|_| SchedulerError::InvalidCronPattern(end_cron.clone()))?;
                
                tokio::spawn(async move {
                    loop {
                        if let Ok(next_start) = start_cron_parsed.find_next_occurrence(&chrono::Utc::now(), false) {
                            // Wait until start time
                            let now = chrono::Utc::now();
                            if next_start > now {
                                let wait_duration = (next_start - now).to_std().unwrap_or(Duration::from_secs(0));
                                sleep(wait_duration).await;
                            }
                            
                            if let Some(sender) = &INSTANCE.read().await.message_sender {
                                let _ = sender.send(SchedulerMessage::TriggerEvent { event_id: event_id.clone() });
                            }
                            
                            if let Ok(next_end) = end_cron_parsed.find_next_occurrence(&next_start, false) {
                                let end_wait = (next_end - chrono::Utc::now()).to_std().unwrap_or(Duration::from_secs(0));
                                if end_wait > Duration::from_secs(0) {
                                    sleep(end_wait).await;
                                }
                            }
                        } else {
                            break;
                        }
                    }
                })
            }
        };
        
        Ok(handle)
    }

    fn calculate_next_execution(timing: &EventTiming) -> Option<chrono::DateTime<chrono::Utc>> {
        match timing {
            EventTiming::In(duration) => {
                Some(chrono::Utc::now() + chrono::Duration::from_std(*duration).ok()?)
            },
            EventTiming::Between(start_cron, _) => {
                let cron = CronParser::builder().build().parse(start_cron).ok()?;
                cron.find_next_occurrence(&chrono::Utc::now(), false).ok()
            }
        }
    }
}