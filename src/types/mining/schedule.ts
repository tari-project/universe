export const TIME_PERIOD = ['AM', 'PM'] as const;
type TimePeriodTuple = typeof TIME_PERIOD;
export type TimePeriod = TimePeriodTuple[number];

export type SchedulerEventType = { ResumeMining: Record<string, never> } | { Mine: { mining_mode: string } };
export type SchedulerEventTiming = { In: InTime } | { Between: BetweenTime };

export interface TimeParts {
    hour: number;
    minute: number;
    timePeriod: TimePeriod;
}

export enum TimeUnit {
    Seconds = 'Seconds',
    Minutes = 'Minutes',
    Hours = 'Hours',
}

export interface InTime {
    time_value: number;
    time_unit: TimeUnit;
}

export interface BetweenTime {
    start_hour: number;
    start_minute: number;
    start_period: TimePeriod;
    end_hour: number;
    end_minute: number;
    end_period: TimePeriod;
}

export enum SchedulerEventState {
    Active = 'Active',
    Paused = 'Paused',
    Triggered = 'Triggered',
    Completed = 'Completed',
}

export interface SchedulerEvent {
    id: string;
    event_type: SchedulerEventType;
    timing: SchedulerEventTiming;
    state: SchedulerEventState;
}
