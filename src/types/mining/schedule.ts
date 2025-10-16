export enum TimePeriod {
    AM = 'AM',
    PM = 'PM',
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
    startTimeValue: number;
    startTimePeriod: TimePeriod;
    endTimeValue: number;
    endTimePeriod: TimePeriod;
}
