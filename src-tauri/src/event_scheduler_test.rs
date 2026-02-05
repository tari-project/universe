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

use chrono::Local;
use test_case::test_case;

use crate::event_scheduler::{
    BetweenTimeVariantPayload, CronSchedule, InVariantPayload, SchedulerError, TimePeriod, TimeUnit,
};

// =============================================================================
// CronSchedule::new tests
// =============================================================================

#[test]
fn valid_cron_patterns_parse_successfully() {
    let valid_patterns = [
        ("0 22 * * *", "0 6 * * *"),  // 10 PM to 6 AM daily
        ("30 8 * * *", "0 17 * * *"), // 8:30 AM to 5 PM daily
        ("0 0 * * *", "0 12 * * *"),  // Midnight to noon
        ("0 * * * *", "30 * * * *"),  // Every hour on the hour to half hour
        ("0 9 * * 1", "0 17 * * 5"),  // 9 AM Monday to 5 PM Friday
    ];

    for (start, end) in valid_patterns {
        let result = CronSchedule::new(start, end);
        assert!(
            result.is_ok(),
            "Expected valid pattern '{}' to '{}' to parse, but got error: {:?}",
            start,
            end,
            result.err()
        );
    }
}

#[test]
fn invalid_cron_pattern_returns_error() {
    let invalid_patterns = [
        ("invalid", "0 6 * * *"),
        ("0 6 * * *", "not a cron"),
        ("", "0 6 * * *"),
        ("0 6 * * *", ""),
        ("60 22 * * *", "0 6 * * *"), // Invalid minute (60)
        ("0 25 * * *", "0 6 * * *"),  // Invalid hour (25)
    ];

    for (start, end) in invalid_patterns {
        let result = CronSchedule::new(start, end);
        assert!(
            matches!(result, Err(SchedulerError::InvalidCronPattern(_))),
            "Expected InvalidCronPattern error for '{}' to '{}', but got: {:?}",
            start,
            end,
            result
        );
    }
}

// =============================================================================
// CronSchedule::find_next_start_time tests
// =============================================================================

#[test]
fn find_next_start_time_returns_future() {
    let schedule = CronSchedule::new("0 22 * * *", "0 6 * * *").expect("Valid cron pattern");
    let now = Local::now();

    let next_start = schedule.find_next_start_time(now);

    assert!(next_start.is_some(), "Expected to find next start time");
    let next_start = next_start.unwrap();
    assert!(
        next_start > now,
        "Next start time {:?} should be in the future (after {:?})",
        next_start,
        now
    );
}

// =============================================================================
// CronSchedule::find_next_end_time tests
// =============================================================================

#[test]
fn find_next_end_time_returns_future() {
    let schedule = CronSchedule::new("0 22 * * *", "0 6 * * *").expect("Valid cron pattern");
    let now = Local::now();

    let next_end = schedule.find_next_end_time(now);

    assert!(next_end.is_some(), "Expected to find next end time");
    let next_end = next_end.unwrap();
    assert!(
        next_end > now,
        "Next end time {:?} should be in the future (after {:?})",
        next_end,
        now
    );
}

// =============================================================================
// InVariantPayload::to_duration - Hours tests
// =============================================================================

#[test_case(1 ; "hours value 1")]
#[test_case(2 ; "hours value 2")]
#[test_case(12 ; "hours value 12")]
#[test_case(23 ; "hours value 23")]
#[test_case(24 ; "hours value 24")]
fn hours_duration_valid_range(value: i64) {
    let payload = InVariantPayload {
        time_value: value,
        time_unit: TimeUnit::Hours,
    };

    let result = payload.to_duration();

    assert!(
        result.is_ok(),
        "Expected hours value {} to be valid, but got error: {:?}",
        value,
        result.err()
    );
    let duration = result.unwrap();
    assert_eq!(
        duration.num_hours(),
        value,
        "Duration should be {} hours",
        value
    );
}

#[test]
fn hours_duration_invalid_zero() {
    let payload = InVariantPayload {
        time_value: 0,
        time_unit: TimeUnit::Hours,
    };

    let result = payload.to_duration();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for hours value 0, but got: {:?}",
        result
    );
}

#[test]
fn hours_duration_invalid_over_24() {
    let payload = InVariantPayload {
        time_value: 25,
        time_unit: TimeUnit::Hours,
    };

    let result = payload.to_duration();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for hours value 25, but got: {:?}",
        result
    );
}

// =============================================================================
// InVariantPayload::to_duration - Minutes tests
// =============================================================================

#[test_case(1 ; "minutes value 1")]
#[test_case(15 ; "minutes value 15")]
#[test_case(30 ; "minutes value 30")]
#[test_case(45 ; "minutes value 45")]
#[test_case(60 ; "minutes value 60")]
fn minutes_duration_valid_range(value: i64) {
    let payload = InVariantPayload {
        time_value: value,
        time_unit: TimeUnit::Minutes,
    };

    let result = payload.to_duration();

    assert!(
        result.is_ok(),
        "Expected minutes value {} to be valid, but got error: {:?}",
        value,
        result.err()
    );
    let duration = result.unwrap();
    assert_eq!(
        duration.num_minutes(),
        value,
        "Duration should be {} minutes",
        value
    );
}

#[test]
fn minutes_duration_invalid_zero() {
    let payload = InVariantPayload {
        time_value: 0,
        time_unit: TimeUnit::Minutes,
    };

    let result = payload.to_duration();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for minutes value 0, but got: {:?}",
        result
    );
}

#[test]
fn minutes_duration_invalid_over_60() {
    let payload = InVariantPayload {
        time_value: 61,
        time_unit: TimeUnit::Minutes,
    };

    let result = payload.to_duration();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for minutes value 61, but got: {:?}",
        result
    );
}

// =============================================================================
// InVariantPayload::to_duration - Seconds tests
// =============================================================================

#[test_case(1 ; "seconds value 1")]
#[test_case(15 ; "seconds value 15")]
#[test_case(30 ; "seconds value 30")]
#[test_case(45 ; "seconds value 45")]
#[test_case(60 ; "seconds value 60")]
fn seconds_duration_valid_range(value: i64) {
    let payload = InVariantPayload {
        time_value: value,
        time_unit: TimeUnit::Seconds,
    };

    let result = payload.to_duration();

    assert!(
        result.is_ok(),
        "Expected seconds value {} to be valid, but got error: {:?}",
        value,
        result.err()
    );
    let duration = result.unwrap();
    assert_eq!(
        duration.num_seconds(),
        value,
        "Duration should be {} seconds",
        value
    );
}

#[test]
fn seconds_duration_invalid_zero() {
    let payload = InVariantPayload {
        time_value: 0,
        time_unit: TimeUnit::Seconds,
    };

    let result = payload.to_duration();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for seconds value 0, but got: {:?}",
        result
    );
}

#[test]
fn seconds_duration_invalid_over_60() {
    let payload = InVariantPayload {
        time_value: 61,
        time_unit: TimeUnit::Seconds,
    };

    let result = payload.to_duration();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for seconds value 61, but got: {:?}",
        result
    );
}

// =============================================================================
// BetweenTimeVariantPayload::to_cron_schedule tests
// =============================================================================

#[test]
fn between_payload_am_pm_conversion() {
    let test_cases = [
        (
            10,
            TimePeriod::PM,
            6,
            TimePeriod::AM,
            "0 22 * * *",
            "0 6 * * *",
        ),
        (
            12,
            TimePeriod::AM,
            12,
            TimePeriod::PM,
            "0 0 * * *",
            "0 12 * * *",
        ),
        (
            1,
            TimePeriod::AM,
            1,
            TimePeriod::PM,
            "0 1 * * *",
            "0 13 * * *",
        ),
        (
            11,
            TimePeriod::PM,
            11,
            TimePeriod::AM,
            "0 23 * * *",
            "0 11 * * *",
        ),
        (
            12,
            TimePeriod::PM,
            12,
            TimePeriod::AM,
            "0 12 * * *",
            "0 0 * * *",
        ),
    ];

    for (start_hour, start_period, end_hour, end_period, expected_start, expected_end) in test_cases
    {
        let payload = BetweenTimeVariantPayload {
            start_hour,
            start_minute: 0,
            start_period: start_period.clone(),
            end_hour,
            end_minute: 0,
            end_period: end_period.clone(),
        };

        let result = payload.to_cron_schedule();
        assert!(
            result.is_ok(),
            "Expected {:?} {:?} to {:?} {:?} to be valid, but got error: {:?}",
            start_hour,
            start_period,
            end_hour,
            end_period,
            result.err()
        );

        let schedule = result.unwrap();
        assert_eq!(
            schedule.start_time.pattern.to_string(),
            expected_start,
            "Start cron pattern mismatch for {} {:?}",
            start_hour,
            start_period
        );
        assert_eq!(
            schedule.end_time.pattern.to_string(),
            expected_end,
            "End cron pattern mismatch for {} {:?}",
            end_hour,
            end_period
        );
    }
}

#[test]
fn between_payload_to_cron_schedule_valid() {
    let payload = BetweenTimeVariantPayload {
        start_hour: 9,
        start_minute: 30,
        start_period: TimePeriod::AM,
        end_hour: 5,
        end_minute: 0,
        end_period: TimePeriod::PM,
    };

    let result = payload.to_cron_schedule();

    assert!(
        result.is_ok(),
        "Expected valid between payload to create schedule, but got error: {:?}",
        result.err()
    );
    let schedule = result.unwrap();
    assert_eq!(
        schedule.start_time.pattern.to_string(),
        "30 9 * * *",
        "Start time should be 9:30 AM"
    );
    assert_eq!(
        schedule.end_time.pattern.to_string(),
        "0 17 * * *",
        "End time should be 5:00 PM"
    );
}

#[test]
fn between_payload_invalid_hour_returns_error() {
    let invalid_payloads = [
        BetweenTimeVariantPayload {
            start_hour: 0,
            start_minute: 0,
            start_period: TimePeriod::AM,
            end_hour: 6,
            end_minute: 0,
            end_period: TimePeriod::AM,
        },
        BetweenTimeVariantPayload {
            start_hour: 13,
            start_minute: 0,
            start_period: TimePeriod::PM,
            end_hour: 6,
            end_minute: 0,
            end_period: TimePeriod::AM,
        },
        BetweenTimeVariantPayload {
            start_hour: 10,
            start_minute: 0,
            start_period: TimePeriod::PM,
            end_hour: 0,
            end_minute: 0,
            end_period: TimePeriod::AM,
        },
    ];

    for payload in invalid_payloads {
        let result = payload.to_cron_schedule();
        assert!(
            matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
            "Expected InvalidTimingFormat error for invalid hour, but got: {:?}",
            result
        );
    }
}

#[test]
fn between_payload_invalid_minute_returns_error() {
    let payload = BetweenTimeVariantPayload {
        start_hour: 10,
        start_minute: 60,
        start_period: TimePeriod::PM,
        end_hour: 6,
        end_minute: 0,
        end_period: TimePeriod::AM,
    };

    let result = payload.to_cron_schedule();

    assert!(
        matches!(result, Err(SchedulerError::InvalidTimingFormat(_))),
        "Expected InvalidTimingFormat error for minute 60, but got: {:?}",
        result
    );
}
