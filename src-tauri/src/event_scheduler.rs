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

//! # Event Scheduler Module
//!
//! This module handles time-based events.
//! It lets you schedule tasks to run at specific times or within time windows.
//!
//! ## What it does
//!
//! The scheduler can handle two main types of events:
//! - **One-time events**: Run something after a delay (like "start mining in 2 hours")
//! - **Recurring events**: Run something during specific time windows using cron expressions
//!   (like "mine every day from 10 PM to 6 AM")
//!
//! It also manages different mining modes and keeps your scheduled events even when you
//! restart the application.
//!
//! ## How it works
//!
//! The system uses message passing to stay thread-safe:
//! - EventScheduler is the main interface you interact with
//! - Each scheduled event runs in its own background task
//! - All operations go through a central message loop
//! - Events can be paused, resumed, or removed as needed
//!
//! ## Key parts
//!
//! - `CronSchedule`: Handles recurring time windows with cron expressions
//! - `SchedulerEventTiming`: Defines when events should trigger (In/Between patterns)
//! - `SchedulerEventType`: Defines what actions to perform (ResumeMining/Mine)
//! - Persistent storage: Your recurring events are saved and restored automatically
//!
//! ## Basic usage
//!
//! ```rust
//! // Schedule mining to start in 2 hours
//! let timing = SchedulerEventTiming::parse_in_variant(2, TimeUnit::Hours)?;
//! EventScheduler::instance()
//!     .schedule_event(SchedulerEventType::ResumeMining, "start_mining".to_string(), timing)
//!     .await?;
//!
//! // Schedule mining between 10 PM and 6 AM daily
//! let timing = SchedulerEventTiming::parse_between_variant(10, TimePeriod::PM, 6, TimePeriod::AM)?;
//! EventScheduler::instance()
//!     .schedule_event(SchedulerEventType::ResumeMining, "night_mining".to_string(), timing)
//!     .await?;
//! ```
//!
//! The scheduler is thread-safe and all operations are async, so you can call it from
//! multiple places without worrying about race conditions.

#![allow(dead_code, unused_variables, unused_must_use)]

use chrono::{DateTime, Duration, Local};
use croner::{self, parser::CronParser, Cron};
use log::{error, info, warn};
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
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{cpu::manager::CpuManager, gpu::manager::GpuManager},
    tasks_tracker::TasksTrackers,
};

static ZERO_DURATION: std::time::Duration = std::time::Duration::from_secs(0);

static LOG_TARGET: &str = "tari::universe::event_scheduler";
static INSTANCE: LazyLock<EventScheduler> = LazyLock::new(EventScheduler::new);
static EVENT_ID_COUNTER: AtomicU64 = AtomicU64::new(1);

/// Internal messages for communication between the public API and the scheduler's
/// event loop. These go through a channel to keep everything thread-safe.
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
    /// The provided cron pattern is invalid or malformed
    InvalidCronPattern(String),
    /// No event exists with the specified ID
    EventNotFound(String),
    /// Attempted to pause an event that is already paused
    EventAlreadyPaused(String),
    /// Attempted to resume an event that is already running
    EventAlreadyRunning(String),
    /// The scheduler service is not running
    SchedulerNotRunning,
    /// An internal error occurred during operation
    InternalError(String),
    /// The timing format provided is invalid
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

/// A recurring schedule with start and end times using cron expressions.
/// This handles time windows when events should be active, like "mine every weekday from 10 PM to 6 AM".
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
    /// Creates a new schedule from cron expressions.
    ///
    /// ### Parameters
    /// * `start_time` - When the schedule starts (e.g., "0 22 * * *" for 10 PM)
    /// * `end_time` - When the schedule ends (e.g., "0 6 * * *" for 6 AM)
    ///
    /// ### Returns
    /// * `Ok(CronSchedule)` - Schedule created successfully
    /// * `Err(SchedulerError::InvalidCronPattern)` - Invalid cron expression
    ///
    /// ### Example
    /// ```
    /// // Schedule for 10 PM to 6 AM daily
    /// let schedule = CronSchedule::new("0 22 * * *", "0 6 * * *")?;
    /// ```
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

    /// Finds when this schedule starts next.
    ///
    /// ### Parameters
    /// * `from` - Time to search from
    ///
    /// ### Returns
    /// * `Some(DateTime<Local>)` - When it starts next
    /// * `None` - If it never starts again
    pub fn find_next_start_time(&self, from: DateTime<Local>) -> Option<DateTime<Local>> {
        self.start_time.find_next_occurrence(&from, false).ok()
    }

    /// How long to wait until this schedule starts next.
    ///
    /// ### Parameters
    /// * `from` - Time to calculate from
    ///
    /// ### Returns
    /// * `Some(Duration)` - Time to wait (at least 0)
    /// * `None` - If it never starts again
    pub fn find_next_start_wait_time(&self, from: DateTime<Local>) -> Option<std::time::Duration> {
        self.find_next_start_time(from).map(|next_start| {
            (next_start - from)
                .to_std()
                .unwrap_or_default()
                .max(ZERO_DURATION)
        })
    }

    /// Finds the next occurrence of the end time from a given moment.
    ///
    /// ### Parameters
    /// * `from` - The reference time to search from
    ///
    /// ### Returns
    /// * `Some(DateTime<Local>)` - The next end time occurrence
    /// * `None` - If no future occurrence can be found
    pub fn find_next_end_time(&self, from: DateTime<Local>) -> Option<DateTime<Local>> {
        self.end_time.find_next_occurrence(&from, false).ok()
    }

    /// Calculates how long to wait until the next end time from a given moment.
    ///
    /// ### Parameters
    /// * `from` - The reference time to calculate from
    ///
    /// ### Returns
    /// * `Some(Duration)` - Time to wait until next end time (minimum 0)
    /// * `None` - If no future end time can be found
    pub fn find_next_end_wait_time(&self, from: DateTime<Local>) -> Option<std::time::Duration> {
        self.find_next_end_time(from).map(|next_end| {
            (next_end - from)
                .to_std()
                .unwrap_or_default()
                .max(ZERO_DURATION)
        })
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum TimeUnit {
    Hours,
    Minutes,
    Seconds,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum TimePeriod {
    AM,
    PM,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BetweenTimeVariantPayload {
    pub start_hour: i64,
    pub start_minute: i64,
    pub start_period: TimePeriod,
    pub end_hour: i64,
    pub end_minute: i64,
    pub end_period: TimePeriod,
}
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct InVariantPayload {
    pub time_value: i64,
    pub time_unit: TimeUnit,
}

impl InVariantPayload {
    /// Converts the payload into a Duration.
    ///
    /// ### Returns
    /// * `Ok(Duration)` - Duration created successfully
    /// * `Err(SchedulerError::InvalidTimingFormat)` - If value is out of range
    pub fn to_duration(&self) -> Result<Duration, SchedulerError> {
        SchedulerEventTiming::parse_duration_unit(self.time_value, self.time_unit.clone())
    }
}

impl BetweenTimeVariantPayload {
    /// Converts the payload into a CronSchedule.
    ///
    /// ### Returns
    /// * `Ok(CronSchedule)` - Schedule created successfully
    /// * `Err(SchedulerError::InvalidCronPattern)` - If cron generation fails
    pub fn to_cron_schedule(&self) -> Result<CronSchedule, SchedulerError> {
        let start_cron = SchedulerEventTiming::parse_cron(
            self.start_hour,
            self.start_minute,
            self.start_period.clone(),
        )?;
        let end_cron = SchedulerEventTiming::parse_cron(
            self.end_hour,
            self.end_minute,
            self.end_period.clone(),
        )?;
        CronSchedule::new(&start_cron, &end_cron)
    }
}

/// When a scheduled event should trigger.
/// Either run once after a delay, or repeatedly during certain time windows.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum SchedulerEventTiming {
    /// Run once after the specified time (e.g., In(2 hours))
    /// The event gets removed after it runs.
    In(InVariantPayload),
    /// Run during recurring time windows (e.g., Between("0 22 * * *", "0 6 * * *") for 10PM to 6AM daily)
    /// The event keeps repeating according to the schedule.
    Between(BetweenTimeVariantPayload),
}

impl SchedulerEventTiming {
    /// Parses and validates a duration value with its time unit.
    fn parse_duration_unit(value: i64, unit: TimeUnit) -> Result<Duration, SchedulerError> {
        const MAX_HOURS_VALUE: i64 = 24;
        const MAX_MINUTES_VALUE: i64 = 60;
        const MAX_SECONDS_VALUE: i64 = 60;

        match unit {
            TimeUnit::Hours => {
                if value <= 0 || value > MAX_HOURS_VALUE {
                    return Err(SchedulerError::InvalidTimingFormat(format!(
                        "Hours value must be between 1 and {}",
                        MAX_HOURS_VALUE
                    )));
                }
                Ok(Duration::hours(value))
            }
            TimeUnit::Minutes => {
                if value <= 0 || value > MAX_MINUTES_VALUE {
                    return Err(SchedulerError::InvalidTimingFormat(format!(
                        "Minutes value must be between 1 and {}",
                        MAX_MINUTES_VALUE
                    )));
                }
                Ok(Duration::minutes(value))
            }
            TimeUnit::Seconds => {
                if value <= 0 || value > MAX_SECONDS_VALUE {
                    return Err(SchedulerError::InvalidTimingFormat(format!(
                        "Seconds value must be between 1 and {}",
                        MAX_SECONDS_VALUE
                    )));
                }
                Ok(Duration::seconds(value))
            }
        }
    }

    /// Create a one-time delay timing.
    ///
    /// ### Parameters
    /// * `value` - How many units to wait (must be positive)
    /// * `unit` - Time unit (Hours: 1-24, Minutes: 1-60, Seconds: 1-60)
    ///
    /// ### Returns
    /// * `Ok(SchedulerEventTiming::In)` - Timing created
    /// * `Err(SchedulerError::InvalidTimingFormat)` - Value out of range
    ///
    /// ### Example
    /// ```
    /// // Run something in 2 hours
    /// let timing = SchedulerEventTiming::parse_in_variant(2, TimeUnit::Hours)?;
    /// ```
    pub fn parse_in_variant(value: i64, unit: TimeUnit) -> Result<Self, SchedulerError> {
        let payload = InVariantPayload {
            time_value: value,
            time_unit: unit,
        };
        Ok(SchedulerEventTiming::In(payload))
    }

    /// Create a recurring time window timing.
    ///
    /// ### Parameters
    /// * `start_hour` - When to start (1-12)
    /// * `start_period` - AM/PM for start time
    /// * `end_hour` - When to end (1-12)
    /// * `end_period` - AM/PM for end time
    ///
    /// ### Returns
    /// * `Ok(SchedulerEventTiming::Between)` - Timing created
    /// * `Err(SchedulerError::InvalidTimingFormat)` - Hours out of range
    /// * `Err(SchedulerError::InvalidCronPattern)` - Cron generation failed
    ///
    /// ### Example
    /// ```
    /// // Run between 10 PM and 6 AM daily
    /// let timing = SchedulerEventTiming::parse_between_variant(
    ///     10, TimePeriod::PM, 6, TimePeriod::AM
    /// )?;
    /// ```
    pub fn parse_between_variant(
        start_hour: i64,
        start_minute: i64,
        start_period: TimePeriod,
        end_hour: i64,
        end_minute: i64,
        end_period: TimePeriod,
    ) -> Result<Self, SchedulerError> {
        let payload = BetweenTimeVariantPayload {
            start_hour,
            start_minute,
            start_period,
            end_hour,
            end_minute,
            end_period,
        };
        // Validate by trying to convert to CronSchedule
        payload.to_cron_schedule()?;
        Ok(SchedulerEventTiming::Between(payload))
    }

    /// Converts 12-hour format time to a cron expression.
    fn parse_cron(hour: i64, minute: i64, period: TimePeriod) -> Result<String, SchedulerError> {
        if !(1..=12).contains(&hour) {
            return Err(SchedulerError::InvalidTimingFormat(
                "Hour must be between 1 and 12".to_string(),
            ));
        }

        if !(0..=59).contains(&minute) {
            return Err(SchedulerError::InvalidTimingFormat(
                "Minute must be between 0 and 59".to_string(),
            ));
        }

        let hour_24 = match period {
            TimePeriod::AM => {
                if hour == 12 {
                    0
                } else {
                    hour
                }
            }
            TimePeriod::PM => {
                if hour == 12 {
                    12
                } else {
                    hour + 12
                }
            }
        };
        // Cron pattern for every day at the specified hour and minute
        Ok(format!("{} {} * * *", minute, hour_24))
    }

    /// Checks if this timing represents a recurring event.
    ///
    /// ### Returns
    /// * `true` - Between timing (survives app restarts)
    /// * `false` - In timing (gets removed after running)
    pub fn is_persistent(&self) -> bool {
        matches!(self, SchedulerEventTiming::Between { .. })
    }
}

/// Basic info about a scheduled event.
/// This is what gets saved to config and passed around externally.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledEventInfo {
    pub id: String,
    pub event_type: SchedulerEventType,
    pub timing: SchedulerEventTiming,
    pub state: SchedulerEventState,
}

/// Defines the types of actions that can be scheduled.
/// Each event type corresponds to a specific mining operation that will be
/// performed when the event is triggered.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub enum SchedulerEventType {
    /// Resume mining operations with the current configuration.
    /// This is a unique event type - only one can exist at a time.
    ResumeMining,
    /// Start mining with a specific mining mode configuration.
    /// Multiple Mine events can exist with different mining modes.
    Mine {
        /// The specific mining mode configuration to use
        mining_mode: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SchedulerEventState {
    Active,
    Paused,
    Triggered,
    Completed,
}

impl SchedulerEventType {
    /// Checks if only one of this event type can exist at once.
    ///
    /// ### Returns
    /// * `true` - ResumeMining events (only one allowed)
    /// * `false` - Mine events (can have multiple with different modes)
    pub fn is_unique(&self) -> bool {
        matches!(self, SchedulerEventType::ResumeMining)
    }
}

impl Display for SchedulerEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SchedulerEventType::ResumeMining => write!(f, "Pause Mining"),
            SchedulerEventType::Mine { mining_mode } => {
                write!(f, "Mine ({})", mining_mode)
            }
        }
    }
}

/// Internal event data with runtime info.
/// Contains everything needed to manage an event while it's running.
#[derive(Debug)]
struct ScheduledEvent {
    id: String,
    event_type: SchedulerEventType,
    timing: SchedulerEventTiming,
    state: SchedulerEventState,
    task_handle: Option<tokio::task::JoinHandle<()>>,
}

/// The main scheduler that handles all your scheduled events.
/// It's a singleton that uses message passing to stay thread-safe.
pub struct EventScheduler {
    message_sender: mpsc::UnboundedSender<SchedulerMessage>,
    message_receiver: RwLock<mpsc::UnboundedReceiver<SchedulerMessage>>,
    is_running: AtomicBool,
}

impl EventScheduler {
    /// Creates a new scheduler instance.
    /// Call `spawn_listener()` to actually start it.
    pub fn new() -> Self {
        let (message_sender, message_receiver) = mpsc::unbounded_channel::<SchedulerMessage>();

        EventScheduler {
            message_sender,
            message_receiver: RwLock::new(message_receiver),
            is_running: AtomicBool::new(false),
        }
    }

    /// Gets the global scheduler instance.
    /// Returns the global EventScheduler singleton.
    pub fn instance() -> &'static Self {
        &INSTANCE
    }

    /// Schedules a new event.
    ///
    /// This is the main way to add new scheduled events. The scheduler will
    /// handle everything and run it according to your timing settings.
    ///
    /// ### Parameters
    /// * `event_type` - What to do (ResumeMining or Mine)
    /// * `event_id` - Unique name for this event
    /// * `timing` - When to run it (In or Between)
    ///
    /// ### Returns
    /// * `Ok(String)` - Event ID of the scheduled event
    /// * `Err(SchedulerError)` - If scheduling fails
    ///
    /// ### Example
    /// ```
    /// let timing = SchedulerEventTiming::parse_in_variant(2, TimeUnit::Hours)?;
    /// let event_id = EventScheduler::instance()
    ///     .schedule_event(SchedulerEventType::ResumeMining, "resume_mining".to_string(), timing)
    ///     .await?;
    /// ```
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

    /// Removes an event permanently.
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

    /// Pauses an event. Can be resumed later with `resume_event()`.
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

    /// Resumes a paused event.
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

    /// Saves persistent events (Between timing) to the application configuration.
    ///
    /// This ensures that recurring events survive application restarts by storing
    /// their configuration in the persistent config system.
    ///
    /// ### Parameters
    /// * `scheduled_events` - Map of all current scheduled events
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
                            state: event.state.clone(),
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

    /// Loads persistent events from the application configuration.
    ///
    /// Called during scheduler startup to restore recurring events that were
    /// saved before the previous application shutdown.
    ///
    /// ### Returns
    /// * `Ok(HashMap)` - Map of restored scheduled events
    /// * `Err(SchedulerError)` - If loading fails
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

    /// Starts the scheduler's main event loop.
    ///
    /// This spawns the background task that handles all scheduler operations
    /// and manages event execution. It also loads any saved events from config.
    /// Runs until the app shuts down.
    ///
    /// ### Returns
    /// * `Ok(())` - Started successfully
    /// * `Err(SchedulerError::InternalError)` - Already running
    ///
    /// # Note
    /// Call this once during app startup. It runs in the background and
    /// handles everything automatically.
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

    /// Internal handler for adding new events to the scheduler.
    ///
    /// Processes AddEvent messages from the public API, manages unique event types,
    /// and creates the execution tasks for new events.
    ///
    /// ### Parameters
    /// * `events` - Mutable reference to the events map
    /// * `event_type` - Type of event to add
    /// * `event_id` - Unique identifier for the event
    /// * `timing` - When the event should trigger
    ///
    /// ### Returns
    /// * `Ok(String)` - The event ID of the added event
    /// * `Err(SchedulerError)` - If adding fails
    async fn handle_add_event(
        events: &mut HashMap<String, ScheduledEvent>,
        event_type: SchedulerEventType,
        event_id: String,
        timing: SchedulerEventTiming,
    ) -> Result<String, SchedulerError> {
        if event_type.is_unique() {
            info!(target: LOG_TARGET, "Ensuring uniqueness for event type {:?}", event_type);
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
        Self::save_persistent_events_to_config(events).await;

        Ok(event_id)
    }

    /// Internal handler for removing events from the scheduler.
    ///
    /// Processes RemoveEvent messages, cancels the event's execution task,
    /// and removes it from the events map.
    ///
    /// ### Parameters
    /// * `events` - Mutable reference to the events map
    /// * `event_id` - ID of the event to remove
    ///
    /// ### Returns
    /// * `Ok(())` - Event successfully removed
    /// * `Err(SchedulerError::EventNotFound)` - No event with the given ID
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

    /// Internal handler for pausing events.
    ///
    /// Processes PauseEvent messages, changes the event state to Paused,
    /// and cancels the event's execution task while keeping the event data.
    ///
    /// ### Parameters
    /// * `events` - Mutable reference to the events map
    /// * `event_id` - ID of the event to pause
    ///
    /// ### Returns
    /// * `Ok(())` - Event successfully paused
    /// * `Err(SchedulerError)` - If pausing fails
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

    /// Internal handler for resuming paused events.
    ///
    /// Processes ResumeEvent messages, changes the event state back to Active,
    /// and creates a new execution task for the event.
    ///
    /// ### Parameters
    /// * `events` - Mutable reference to the events map
    /// * `event_id` - ID of the event to resume
    ///
    /// ### Returns
    /// * `Ok(())` - Event successfully resumed
    /// * `Err(SchedulerError)` - If resuming fails
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

    /// Internal handler for event enter callbacks.
    ///
    /// Executes the actions associated with an event when it triggers.
    /// This starts mining operations based on the event type.
    ///
    /// ### Parameters
    /// * `events` - Reference to the events map
    /// * `event_id` - ID of the event that triggered
    ///
    /// ### Returns
    /// * `Ok(())` - Callback executed successfully
    /// * `Err(SchedulerError)` - If execution fails
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
                        ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mining_mode.clone()).await.unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to set mining mode during Mine event {:?}: {}", event_id, e);
                });
                        // TODO: Replace with emiting specific value only
                        EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await)
                            .await;
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

    /// Internal handler for event exit callbacks.
    ///
    /// Executes cleanup actions when a time window ends (for Between events).
    /// This typically stops mining operations.
    ///
    /// ### Parameters
    /// * `events` - Reference to the events map
    /// * `event_id` - ID of the event that is ending
    ///
    /// ### Returns
    /// * `Ok(())` - Callback executed successfully
    /// * `Err(SchedulerError)` - If execution fails
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

    /// Internal handler for cleaning up completed one-time events.
    ///
    /// Removes "In" timing events after they execute, as they are not recurring.
    /// "Between" timing events are kept for repeated execution.
    ///
    /// ### Parameters
    /// * `events` - Mutable reference to the events map
    /// * `event_id` - ID of the event to potentially clean up
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

    /// Creates a tokio task to handle the timing logic for an event.
    ///
    /// This spawns the appropriate timing task based on the event's timing type:
    /// - "In" timing: Simple delay then trigger
    /// - "Between" timing: Complex cron-based recurring schedule
    ///
    /// ### Parameters
    /// * `event_id` - Unique identifier for the event
    /// * `_event_type` - Type of event (not used in scheduling logic, only for identification)
    /// * `timing` - When the event should be triggered
    ///
    /// ### Returns
    /// * `Ok(JoinHandle)` - Handle to the spawned scheduling task
    /// * `Err(SchedulerError)` - If task creation fails
    async fn create_scheduling_task(
        event_id: String,
        _event_type: SchedulerEventType, // Not used in scheduling logic, only for identification
        timing: SchedulerEventTiming,
    ) -> Result<tokio::task::JoinHandle<()>, SchedulerError> {
        let handle = match timing {
            SchedulerEventTiming::In(in_variant_payload) => tokio::spawn(async move {
                let duration = in_variant_payload.to_duration();
                if let Ok(duration) = duration {
                    sleep(duration.to_std().unwrap_or_default()).await;

                    let _unused = INSTANCE
                        .message_sender
                        .send(SchedulerMessage::TriggerEnterCallback { event_id });
                } else {
                    error!(target: LOG_TARGET, "Failed to parse duration for 'In' event {:?}", event_id);
                }
            }),

            SchedulerEventTiming::Between(between_time_variant_payload) => {
                info!(target: LOG_TARGET, "Creating scheduling task for 'Between' event ID {:?}", event_id);
                let cron_schedule =
                    between_time_variant_payload
                        .to_cron_schedule()
                        .map_err(|e| {
                            SchedulerError::InvalidTimingFormat(format!(
                                "Failed to create cron schedule for Between timing: {}",
                                e
                            ))
                        })?;

                tokio::spawn(async move {
                    loop {
                        let local_now = Local::now();

                        if let Some(next_start_wait_time) =
                            cron_schedule.find_next_start_wait_time(local_now)
                        {
                            sleep(next_start_wait_time).await;
                        } else {
                            warn!(target: LOG_TARGET, "No next start time found for event with ID {:?}", event_id);
                            break;
                        }

                        let time_after_start_time = Local::now();

                        let _unused =
                            INSTANCE
                                .message_sender
                                .send(SchedulerMessage::TriggerEnterCallback {
                                    event_id: event_id.clone(),
                                });

                        // Now wait until end time, eg. currently is 10AM and the range is 9AM - 11AM, then we wait until 11AM
                        if let Some(next_end_wait_time) =
                            cron_schedule.find_next_end_wait_time(time_after_start_time)
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
