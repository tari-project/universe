export const TIME_PERIOD = ['AM', 'PM'] as const;
type TimePeriodTuple = typeof TIME_PERIOD;
export type TimePeriod = TimePeriodTuple[number];

export type SchedulerEventType = 'ResumeMining' | 'Mine';

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

export interface AddSchedulerEventInVariantPayload {
    eventId: string;
    timeValue: number;
    timeUnit: TimeUnit;
}

export interface AddSchedulerEventBetweenVariantPayload {
    eventId: string;
    startTimeHour: number;
    startTimeMinute: number;
    startTimePeriod: TimePeriod;
    endTimeHour: number;
    endTimeMinute: number;
    endTimePeriod: TimePeriod;
}

export type SchedulerEventTiming = 'In' | 'Between';

export type Timing = Partial<Record<SchedulerEventTiming, BetweenTime>>;

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
    timing: Timing;
    state: SchedulerEventState;
}
