import { ConfigCore } from '@app/types/config/core.ts';
import { TimeParts } from '@app/types/mining/schedule.ts';

const DEFAULT_START: TimeParts = { hour: 6, minute: 0, timePeriod: 'AM' };
const DEFAULT_END: TimeParts = { hour: 4, minute: 30, timePeriod: 'PM' };
export const getParsedBetweenTime = (
    stored: ConfigCore['scheduler_events'],
    event_id: string
): { start: TimeParts; end: TimeParts } => {
    const timing = stored?.[event_id]?.timing.Between;

    if (!timing) {
        return {
            start: DEFAULT_START,
            end: DEFAULT_END,
        };
    }

    return {
        start: { hour: timing.start_hour, minute: timing.start_minute, timePeriod: timing.start_period },
        end: { hour: timing.end_hour, minute: timing.end_minute, timePeriod: timing.end_period },
    };
};

export const getScheduleItem = (events: ConfigCore['scheduler_events'], event_id: string) => events?.[event_id];
