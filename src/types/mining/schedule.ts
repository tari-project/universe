export enum SchedulerEventType {
    ResumeMining = 'ResumeMining',
    Mine = 'Mine',
}

export interface AddSchedulerEventPayload {
    eventId: string;
    eventType: SchedulerEventType;
    eventTiming: string;
    miningMode?: string;
}
