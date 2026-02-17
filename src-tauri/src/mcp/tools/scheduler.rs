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

use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::event_scheduler::{
    EventScheduler, SchedulerEventTiming, SchedulerEventType, TimePeriod,
};
use crate::events_emitter::EventsEmitter;

pub async fn list_scheduled_events() -> Result<String, String> {
    let events = EventScheduler::instance()
        .list_events()
        .await
        .map_err(|e| e.to_string())?;
    let result: Vec<serde_json::Value> = events
        .iter()
        .map(|e| serde_json::to_value(e).unwrap_or_default())
        .collect();
    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub struct MiningWindowParams {
    pub event_id: String,
    pub mining_mode: String,
    pub start_hour: i64,
    pub start_minute: Option<i64>,
    pub start_period: String,
    pub end_hour: i64,
    pub end_minute: Option<i64>,
    pub end_period: String,
}

pub async fn schedule_mining_window(params: MiningWindowParams) -> Result<String, String> {
    let start_period = parse_time_period(&params.start_period)?;
    let end_period = parse_time_period(&params.end_period)?;

    let timing = SchedulerEventTiming::parse_between_variant(
        params.start_hour,
        params.start_minute.unwrap_or(0),
        start_period,
        params.end_hour,
        params.end_minute.unwrap_or(0),
        end_period,
    )
    .map_err(|e| e.to_string())?;

    let event_type = SchedulerEventType::Mine {
        mining_mode: params.mining_mode,
    };

    EventScheduler::instance()
        .schedule_event(event_type, params.event_id.clone(), timing)
        .await
        .map_err(|e| e.to_string())?;

    EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;

    Ok(serde_json::json!({"status": "scheduled", "event_id": params.event_id}).to_string())
}

fn parse_time_period(period: &str) -> Result<TimePeriod, String> {
    match period.to_uppercase().as_str() {
        "AM" => Ok(TimePeriod::AM),
        "PM" => Ok(TimePeriod::PM),
        _ => Err(format!("Invalid time period: {period}. Use 'AM' or 'PM'")),
    }
}

pub async fn cancel_scheduled_event(event_id: String) -> Result<String, String> {
    EventScheduler::instance()
        .remove_event(event_id.clone())
        .await
        .map_err(|e| e.to_string())?;

    EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;

    Ok(serde_json::json!({"status": "cancelled", "event_id": event_id}).to_string())
}
