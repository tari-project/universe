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

use chrono::{DateTime, Duration, Local};
use croner::{self, parser::CronParser, Cron};
use log::{error, info, warn};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fmt::Display,
    sync::{
        atomic::{AtomicBool, AtomicU64},
        LazyLock,
    },
};
use tokio::{
    sync::{mpsc, RwLock},
    time::sleep,
};

use crate::{
    configs::{
        config_core::{ConfigCore, ConfigCoreContent},
        config_mining::{ConfigMining, ConfigMiningContent, MiningMode},
        trait_config::ConfigImpl,
    },
    mining::{cpu::manager::CpuManager, gpu::manager::GpuManager},
    tasks_tracker::TasksTrackers,
};

static IN_PATTERN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^in\s+(\d+)\s+(hour|hours|minute|minutes|second|seconds)$")
        .expect("Invalid In Regex")
});

static BETWEEN_PATTERN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^between\s+(\d{1,2})\s+(am|pm)\s+and\s+(\d{1,2})\s+(am|pm)$")
        .expect("Invalid Between Regex")
});

static ZERO_DURATION: std::time::Duration = std::time::Duration::from_secs(0);

static LOG_TARGET: &str = "tari::universe::event_scheduler";
static INSTANCE: LazyLock<EventScheduler> = LazyLock::new(EventScheduler::new);
static EVENT_ID_COUNTER: AtomicU64 = AtomicU64::new(1);

// Internal message types for the scheduler
#[derive(Debug)]
enum SchedulerMessage {
    AddEvent {
        event_type: SchedulerEventType,
        timing: SchedulerEventTiming,
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
    TriggerEnterCallback {
        event_id: String,
    },
    TriggerExitCallback {
        event_id: String,
    },
    CleanupSchedule {
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
    InvalidTimingFormat(String),
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
            Self::InvalidTimingFormat(format) => write!(f, "Invalid timing format: {}", format),
        }
    }
}

impl std::error::Error for SchedulerError {}

#[derive(Debug, Clone)]
pub struct CronSchedule {
    pub start_time: Cron,
    pub end_time: Cron,
    pub description: String,
}

impl<'de> Deserialize<'de> for CronSchedule {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct CronScheduleHelper {
            start_time: String,
            end_time: String,
        }

        let helper = CronScheduleHelper::deserialize(deserializer)?;
        CronSchedule::new(&helper.start_time, &helper.end_time).map_err(serde::de::Error::custom)
    }
}

impl Serialize for CronSchedule {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        #[derive(Serialize)]
        struct CronScheduleHelper<'a> {
            start_time: &'a str,
            end_time: &'a str,
        }

        let helper = CronScheduleHelper {
            start_time: &self.start_time.to_string(),
            end_time: &self.end_time.to_string(),
        };
        helper.serialize(serializer)
    }
}

impl CronSchedule {
    pub fn new(start_time: &str, end_time: &str) -> Result<Self, SchedulerError> {
        let start_time_cron = CronParser::builder()
            .build()
            .parse(start_time)
            .map_err(|_| SchedulerError::InvalidCronPattern(start_time.to_string()))?;
        let end_time_cron = CronParser::builder()
            .build()
            .parse(end_time)
            .map_err(|_| SchedulerError::InvalidCronPattern(end_time.to_string()))?;

        Ok(Self {
            start_time: start_time_cron,
            end_time: end_time_cron,
            description: format!("From {} to {}", start_time, end_time),
        })
    }

    pub fn find_next_start_time(&self, from: DateTime<Local>) -> Option<DateTime<Local>> {
        self.start_time.find_next_occurrence(&from, false).ok()
    }

    pub fn find_next_start_wait_time(&self, from: DateTime<Local>) -> Option<std::time::Duration> {
        self.find_next_start_time(from).map(|next_start| {
            (next_start - from)
                .to_std()
                .unwrap_or_default()
                .max(ZERO_DURATION)
        })
    }

    pub fn find_next_end_time(&self, from: DateTime<Local>) -> Option<DateTime<Local>> {
        self.end_time.find_next_occurrence(&from, false).ok()
    }

    pub fn find_next_end_wait_time(&self, from: DateTime<Local>) -> Option<std::time::Duration> {
        self.find_next_end_time(from).map(|next_end| {
            (next_end - from)
                .to_std()
                .unwrap_or_default()
                .max(ZERO_DURATION)
        })
    }

    pub fn is_time_in_range(&self, time: DateTime<Local>) -> bool {
        if let (Some(prev_start), Some(next_end)) = (
            self.start_time.find_previous_occurrence(&time, false).ok(),
            self.end_time.find_next_occurrence(&time, false).ok(),
        ) {
            if prev_start <= time && time < next_end {
                return true;
            }
        }
        false
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum SchedulerEventTiming {
    In(Duration),          // e.g., In(2 hours) - triggers once after the duration
    Between(CronSchedule), // e.g., Between("0 22 * * *", "0 6 * * *") (10PM to 6AM every day)
}

impl SchedulerEventTiming {
    fn parse_duration_unit(value: i64, unit: &str) -> Result<Duration, SchedulerError> {
        const MAX_HOURS_VALUE: i64 = 24;
        const MAX_MINUTES_VALUE: i64 = 60;
        const MAX_SECONDS_VALUE: i64 = 60;

        match unit {
            "hour" | "hours" => {
                if value > MAX_HOURS_VALUE {
                    Err(SchedulerError::InternalError(
                        "Invalid hour value".to_string(),
                    ))
                } else {
                    Ok(Duration::hours(value))
                }
            }
            "minute" | "minutes" => {
                if value > MAX_MINUTES_VALUE {
                    Err(SchedulerError::InternalError(
                        "Invalid minute value".to_string(),
                    ))
                } else {
                    Ok(Duration::minutes(value))
                }
            }
            "second" | "seconds" => {
                if value > MAX_SECONDS_VALUE {
                    Err(SchedulerError::InternalError(
                        "Invalid second value".to_string(),
                    ))
                } else {
                    Ok(Duration::seconds(value))
                }
            }
            _ => Err(SchedulerError::InternalError(
                "Invalid duration unit".to_string(),
            )),
        }
    }

    fn parse_cron(hour: u32, period: &str) -> Result<String, SchedulerError> {
        if !(1..=12).contains(&hour) || (period != "am" && period != "pm") {
            return Err(SchedulerError::InternalError(
                "Invalid time value".to_string(),
            ));
        }
        let hour_24 = if period == "am" {
            if hour == 12 {
                0
            } else {
                hour
            }
        } else if hour == 12 {
            12
        } else {
            hour + 12
        };
        // Cron pattern for every day at the specified hour
        Ok(format!("0 {} * * *", hour_24))
    }

    // It will parse two cases:
    // 1. In X hours => EventTiming::In(Duration::from_secs(X * 3600))
    // 2. Between X and Y => EventTiming::Between("cron_pattern_for_X", "cron_pattern_for_Y") Where X and Y are 12-hour times like "10 PM" and "6 AM"
    pub fn from_string(string_value: String) -> Result<Self, SchedulerError> {
        let sanitized_string_value = string_value.trim().to_lowercase();
        if let Some(caps) = IN_PATTERN.captures(&sanitized_string_value) {
            let value: i64 = caps[1]
                .parse()
                .map_err(|_| SchedulerError::InternalError("Invalid duration value".to_string()))?;
            let unit = &caps[2];
            let duration = Self::parse_duration_unit(value, unit)?;
            Ok(SchedulerEventTiming::In(duration))
        } else if let Some(caps) = BETWEEN_PATTERN.captures(&sanitized_string_value) {
            let start_hour: u32 = caps[1]
                .parse()
                .map_err(|_| SchedulerError::InternalError("Invalid start hour".to_string()))?;
            let start_period = &caps[2];
            let end_hour: u32 = caps[3]
                .parse()
                .map_err(|_| SchedulerError::InternalError("Invalid end hour".to_string()))?;
            let end_period = &caps[4];

            Ok(SchedulerEventTiming::Between(CronSchedule::new(
                &Self::parse_cron(start_hour, start_period)?,
                &Self::parse_cron(end_hour, end_period)?,
            )?))
        } else {
            Err(SchedulerError::InvalidTimingFormat(sanitized_string_value))
        }
    }

    pub fn is_persistent(&self) -> bool {
        matches!(self, SchedulerEventTiming::Between { .. })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledEventInfo {
    pub id: String,
    pub event_type: SchedulerEventType,
    pub timing: SchedulerEventTiming,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub enum SchedulerEventType {
    ResumeMining,
    Mine { mining_mode: MiningMode },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SchedulerEventState {
    Active,
    Paused,
    Triggered,
    Completed,
}

impl SchedulerEventType {
    pub fn is_unique(&self) -> bool {
        matches!(self, SchedulerEventType::ResumeMining)
    }
}

impl Display for SchedulerEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SchedulerEventType::ResumeMining => write!(f, "Pause Mining"),
            SchedulerEventType::Mine { mining_mode } => {
                write!(f, "Mine ({})", mining_mode.mode_name)
            }
        }
    }
}

// Internal representation of a scheduled event
#[derive(Debug)]
struct ScheduledEvent {
    id: String,
    event_type: SchedulerEventType,
    timing: SchedulerEventTiming,
    state: SchedulerEventState,
    task_handle: Option<tokio::task::JoinHandle<()>>,
}

pub struct EventScheduler {
    message_sender: mpsc::UnboundedSender<SchedulerMessage>, // Channel for sending messages to the scheduler task
    message_receiver: RwLock<mpsc::UnboundedReceiver<SchedulerMessage>>, // Channel for receiving messages in the scheduler task
    is_running: AtomicBool, // Flag to track if the listener is running
}

impl EventScheduler {
    pub fn new() -> Self {
        let (message_sender, message_receiver) = mpsc::unbounded_channel::<SchedulerMessage>();

        EventScheduler {
            message_sender,
            message_receiver: RwLock::new(message_receiver),
            is_running: AtomicBool::new(false),
        }
    }

    pub fn instance() -> &'static Self {
        &INSTANCE
    }

    pub async fn schedule_event(
        &self,
        event_type: SchedulerEventType,
        event_id: String,
        timing: SchedulerEventTiming,
    ) -> Result<String, SchedulerError> {
        let (response_tx, response_rx) = tokio::sync::oneshot::channel();

        self.message_sender
            .send(SchedulerMessage::AddEvent {
                event_type,
                timing,
                event_id,
                response: response_tx,
            })
            .map_err(|_| SchedulerError::SchedulerNotRunning)?;

        response_rx
            .await
            .map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
    }

    pub async fn remove_event(&self, event_id: String) -> Result<(), SchedulerError> {
        let (response_tx, response_rx) = tokio::sync::oneshot::channel();

        self.message_sender
            .send(SchedulerMessage::RemoveEvent {
                event_id,
                response: response_tx,
            })
            .map_err(|_| SchedulerError::SchedulerNotRunning)?;

        response_rx
            .await
            .map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
    }

    pub async fn pause_event(&self, event_id: String) -> Result<(), SchedulerError> {
        let (response_tx, response_rx) = tokio::sync::oneshot::channel();

        self.message_sender
            .send(SchedulerMessage::PauseEvent {
                event_id,
                response: response_tx,
            })
            .map_err(|_| SchedulerError::SchedulerNotRunning)?;

        response_rx
            .await
            .map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
    }

    pub async fn resume_event(&self, event_id: String) -> Result<(), SchedulerError> {
        let (response_tx, response_rx) = tokio::sync::oneshot::channel();

        self.message_sender
            .send(SchedulerMessage::ResumeEvent {
                event_id,
                response: response_tx,
            })
            .map_err(|_| SchedulerError::SchedulerNotRunning)?;

        response_rx
            .await
            .map_err(|_| SchedulerError::InternalError("Response channel closed".to_string()))?
    }

    async fn save_persistent_events_to_config(scheduled_events: &HashMap<String, ScheduledEvent>) {
        let persistent_events: HashMap<String, ScheduledEventInfo> = HashMap::from_iter(
            scheduled_events
                .iter()
                .filter(|(_, event)| event.timing.is_persistent())
                .map(|(id, event)| {
                    (
                        id.clone(),
                        ScheduledEventInfo {
                            id: id.clone(),
                            event_type: event.event_type.clone(),
                            timing: event.timing.clone(),
                        },
                    )
                }),
        );

        ConfigCore::update_field(ConfigCoreContent::set_scheduler_events, persistent_events)
            .await
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to save persistent events to config: {}", e);
            });
    }

    async fn load_persistent_events() -> Result<HashMap<String, ScheduledEvent>, SchedulerError> {
        let persistent_events_from_config = ConfigCore::content().await.scheduler_events().clone();
        let scheduled_events =
            HashMap::from_iter(persistent_events_from_config.into_iter().map(|(id, info)| {
                (
                    id,
                    ScheduledEvent {
                        id: info.id,
                        event_type: info.event_type,
                        timing: info.timing,
                        state: SchedulerEventState::Active,
                        task_handle: None,
                    },
                )
            }));
        Ok(scheduled_events)
    }

    pub async fn spawn_listener(&self) -> Result<(), SchedulerError> {
        if self.is_running.load(std::sync::atomic::Ordering::SeqCst) {
            return Err(SchedulerError::InternalError(
                "Event Scheduler Listener is already running".to_string(),
            ));
        }

        self.is_running
            .store(true, std::sync::atomic::Ordering::SeqCst);

        let persistent_events_from_config = Self::load_persistent_events().await?;

        let task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        info!(target: LOG_TARGET, "Starting Event Scheduler Listener");

        task_tracker.spawn(async move {
            let mut internal_events: HashMap<String, ScheduledEvent> = HashMap::new();
            for (id, event) in persistent_events_from_config {
                Self::handle_add_event(&mut internal_events, event.event_type.clone(), id.clone(), event.timing.clone()).await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to reschedule persistent event {:?}: {}", id, e);
                    e.to_string()
                });
            }

            let message_receiver = &mut *INSTANCE.message_receiver.write().await;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Event Scheduler Listener received shutdown signal");

                        Self::save_persistent_events_to_config(&internal_events).await;
                        for (_, mut event) in internal_events.drain() {
                            if let Some(handle) = event.task_handle.take() {
                                handle.abort();
                            }
                        }
                        break;
                    },
                    message = message_receiver.recv() => {
                        match message {
                            Some(SchedulerMessage::AddEvent { event_type, timing, event_id,response }) => {
                                let result = Self::handle_add_event(&mut internal_events, event_type, event_id, timing).await;
                                let _unused = response.send(result);
                            },
                            Some(SchedulerMessage::RemoveEvent { event_id, response }) => {
                                let result = Self::handle_remove_event(&mut internal_events, event_id);
                                let _unused = response.send(result);
                            },
                            Some(SchedulerMessage::PauseEvent { event_id, response }) => {
                                let result = Self::handle_pause_event(&mut internal_events, event_id);
                                let _unused = response.send(result);
                            },
                            Some(SchedulerMessage::ResumeEvent { event_id, response }) => {
                                let result = Self::handle_resume_event(&mut internal_events, event_id).await;
                                let _unused = response.send(result);
                            },
                            Some(SchedulerMessage::TriggerEnterCallback { event_id }) => {
                                Self::handle_enter_callback(&internal_events, event_id).await;

                            },
                            Some(SchedulerMessage::TriggerExitCallback { event_id }) => {
                                Self::handle_exit_callback(&internal_events, event_id).await;

                            }
                            Some(SchedulerMessage::CleanupSchedule { event_id }) => {
                                Self::handle_cleanup_schedule_events(&mut internal_events, event_id).await;
                            }

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
        event_type: SchedulerEventType,
        event_id: String,
        timing: SchedulerEventTiming,
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
            state: SchedulerEventState::Active,
            task_handle: None,
        };

        let task_handle =
            Self::create_scheduling_task(event_id.clone(), event_type, timing).await?;
        scheduled_event.task_handle = Some(task_handle);
        events.insert(event_id.clone(), scheduled_event);

        Ok(event_id)
    }

    fn handle_remove_event(
        events: &mut HashMap<String, ScheduledEvent>,
        event_id: String,
    ) -> Result<(), SchedulerError> {
        info!(target: LOG_TARGET, "Removing event with ID {:?}", event_id);
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
            if event.state == SchedulerEventState::Paused {
                return Err(SchedulerError::EventAlreadyPaused(event_id));
            }

            event.state = SchedulerEventState::Paused;
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
            if event.state != SchedulerEventState::Paused {
                return Err(SchedulerError::EventAlreadyRunning(event_id));
            }

            event.state = SchedulerEventState::Active;

            let task_handle = Self::create_scheduling_task(
                event_id.clone(),
                event.event_type.clone(),
                event.timing.clone(),
            )
            .await?;

            event.task_handle = Some(task_handle);

            info!(target: LOG_TARGET, "Resumed event with ID {:?}", event_id);
            Ok(())
        } else {
            Err(SchedulerError::EventNotFound(event_id))
        }
    }

    async fn handle_enter_callback(
        events: &HashMap<String, ScheduledEvent>,
        event_id: String,
    ) -> Result<(), SchedulerError> {
        if let Some(event) = events.get(&event_id) {
            if event.state == SchedulerEventState::Active {
                match event.event_type.clone() {
                    SchedulerEventType::ResumeMining => {
                        GpuManager::write().await.start_mining().await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to start GPU mining during PauseMining event {:?}: {}", event_id, e);
                });
                        CpuManager::write().await.start_mining().await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to start CPU mining during PauseMining event {:?}: {}", event_id, e);
                });
                    }
                    SchedulerEventType::Mine { mining_mode } => {
                        ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mining_mode.mode_name.clone()).await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to set mining mode during Mine event {:?}: {}", event_id, e);
                });
                        GpuManager::write().await.start_mining().await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to start GPU mining during Mine event {:?}: {}", event_id, e);
                });
                        CpuManager::write().await.start_mining().await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to start CPU mining during Mine event {:?}: {}", event_id, e);
                });
                    }
                }
            }
        }
        Ok(())
    }

    async fn handle_exit_callback(
        events: &HashMap<String, ScheduledEvent>,
        event_id: String,
    ) -> Result<(), SchedulerError> {
        if let Some(event) = events.get(&event_id) {
            match event.event_type.clone() {
                SchedulerEventType::ResumeMining => {}
                SchedulerEventType::Mine { mining_mode } => {
                    GpuManager::write().await.stop_mining().await.unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to stop mining during cleanup of event {:?}: {}", event_id, e);
                    });
                    CpuManager::write().await.stop_mining().await.unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to stop mining during cleanup of event {:?}: {}", event_id, e);
                    });
                }
            }
        }
        Ok(())
    }

    async fn handle_cleanup_schedule_events(
        events: &mut HashMap<String, ScheduledEvent>,
        event_id: String,
    ) {
        if let Some(event) = events.get(&event_id) {
            if let SchedulerEventTiming::In(_) = event.timing {
                info!(target: LOG_TARGET, "Cleaning up schedule for event ID {:?}", event_id);
                if let Err(e) = Self::handle_remove_event(events, event_id.clone()) {
                    error!(target: LOG_TARGET, "Failed to clean up scheduled event {:?}: {}", event_id, e);
                }
            }
        }
    }

    // Create a scheduling task for different timing types
    async fn create_scheduling_task(
        event_id: String,
        _event_type: SchedulerEventType, // Not used in scheduling logic, only for identification
        timing: SchedulerEventTiming,
    ) -> Result<tokio::task::JoinHandle<()>, SchedulerError> {
        let handle = match timing {
            SchedulerEventTiming::In(duration) => tokio::spawn(async move {
                sleep(duration.to_std().unwrap_or_default()).await;

                let _unused = INSTANCE
                    .message_sender
                    .send(SchedulerMessage::TriggerEnterCallback { event_id });
            }),

            SchedulerEventTiming::Between(cron_schedule) => {
                tokio::spawn(async move {
                    loop {
                        let local_now = Local::now();

                        // If is in time range, eg. currently is 10AM and the range is 9AM - 11AM, then we skip sleep and trigger callback immediately
                        // If not in range, eg. currently is 2PM and the range is 9AM - 11AM, then we sleep until next start time
                        if !cron_schedule.is_time_in_range(local_now) {
                            if let Some(next_start_wait_time) =
                                cron_schedule.find_next_start_wait_time(local_now)
                            {
                                sleep(next_start_wait_time).await;
                            } else {
                                warn!(target: LOG_TARGET, "No next start time found for event with ID {:?}", event_id);
                                break;
                            }
                        }

                        let _unused =
                            INSTANCE
                                .message_sender
                                .send(SchedulerMessage::TriggerEnterCallback {
                                    event_id: event_id.clone(),
                                });

                        // Now wait until end time, eg. currently is 10AM and the range is 9AM - 11AM, then we wait until 11AM
                        if let Some(next_end_wait_time) =
                            cron_schedule.find_next_end_wait_time(local_now)
                        {
                            sleep(next_end_wait_time).await;
                            let _unused = INSTANCE.message_sender.send(
                                SchedulerMessage::TriggerExitCallback {
                                    event_id: event_id.clone(),
                                },
                            );
                        }
                    }
                })
            }
        };

        Ok(handle)
    }
}
