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
use crate::configs::config_mining::ConfigMining;
use crate::configs::trait_config::ConfigImpl;
use crate::event_scheduler::{
    EventScheduler, SchedulerEventTiming, SchedulerEventType, TimePeriod,
};
use crate::events_emitter::EventsEmitter;
use crate::mcp::tools::mining::resolve_canonical_mining_mode;

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

fn validate_event_id(event_id: &str) -> Result<String, String> {
    let trimmed = event_id.trim();
    if trimmed.is_empty() {
        return Err("Event ID cannot be empty".to_string());
    }
    Ok(trimmed.to_string())
}

fn prepare_mining_window_event(
    params: &MiningWindowParams,
    available_modes: &std::collections::HashMap<String, crate::configs::config_mining::MiningMode>,
) -> Result<(String, String, SchedulerEventType, SchedulerEventTiming), String> {
    let event_id = validate_event_id(&params.event_id)?;
    let mining_mode = resolve_canonical_mining_mode(&params.mining_mode, available_modes)?;
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
        mining_mode: mining_mode.clone(),
    };

    Ok((event_id, mining_mode, event_type, timing))
}

pub async fn schedule_mining_window(params: MiningWindowParams) -> Result<String, String> {
    let (event_id, mining_mode, event_type, timing) = {
        let current_config = ConfigMining::content().await;
        prepare_mining_window_event(&params, current_config.mining_modes())?
    };

    EventScheduler::instance()
        .schedule_event(event_type, event_id.clone(), timing)
        .await
        .map_err(|e| e.to_string())?;

    EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;

    Ok(serde_json::json!({
        "status": "scheduled",
        "event_id": event_id,
        "mining_mode": mining_mode,
    })
    .to_string())
}

fn parse_time_period(period: &str) -> Result<TimePeriod, String> {
    match period.trim().to_uppercase().as_str() {
        "AM" => Ok(TimePeriod::AM),
        "PM" => Ok(TimePeriod::PM),
        _ => Err(format!("Invalid time period: {period}. Use 'AM' or 'PM'")),
    }
}

pub async fn cancel_scheduled_event(event_id: String) -> Result<String, String> {
    let event_id = validate_event_id(&event_id)?;
    EventScheduler::instance()
        .remove_event(event_id.clone())
        .await
        .map_err(|e| e.to_string())?;

    EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;

    Ok(serde_json::json!({"status": "cancelled", "event_id": event_id}).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::configs::config_mining::ConfigMiningContent;

    #[test]
    fn validate_event_id_and_time_period_trim_and_reject_invalid_inputs() {
        assert_eq!(
            validate_event_id("  night_window  ").unwrap(),
            "night_window"
        );
        assert!(validate_event_id("").is_err());
        assert!(validate_event_id("   \t\n ").is_err());
        assert!(matches!(parse_time_period(" am ").unwrap(), TimePeriod::AM));
        assert!(matches!(parse_time_period("pm").unwrap(), TimePeriod::PM));
        assert!(parse_time_period("noon").is_err());
    }

    #[test]
    fn schedule_window_mode_uses_canonical_mining_modes() {
        let cfg = ConfigMiningContent::default();
        let make_params = |mode: &str| MiningWindowParams {
            event_id: "  night_eco  ".to_string(),
            mining_mode: mode.to_string(),
            start_hour: 10,
            start_minute: Some(0),
            start_period: " pm ".to_string(),
            end_hour: 6,
            end_minute: Some(0),
            end_period: " am ".to_string(),
        };
        let (id, mode, ev, _) =
            prepare_mining_window_event(&make_params("ludicrous"), cfg.mining_modes()).unwrap();
        assert_eq!((id.as_str(), mode.as_str()), ("night_eco", "Ludicrous"));
        assert!(
            matches!(ev, SchedulerEventType::Mine { mining_mode } if mining_mode == "Ludicrous")
        );
        assert!(
            prepare_mining_window_event(&make_params("nonexistent"), cfg.mining_modes()).is_err()
        );
    }
}
