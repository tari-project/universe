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
    startTimeHour: number;
    startTimeMinute: number;
    startTimePeriod: TimePeriod;
    endTimeHour: number;
    endTimeMinute: number;
    endTimePeriod: TimePeriod;
}
