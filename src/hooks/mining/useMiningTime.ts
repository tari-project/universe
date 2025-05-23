import { useRef, useState } from 'react';
import { useInterval } from '@app/hooks';
import { useMiningStore } from '@app/store';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';

const USE_SESSION_TIME_ONLY = true;
const initialState = { days: 0, daysString: '0', hours: 0, minutes: '0', seconds: '0', hoursString: '0' };
export function useMiningTime() {
    const miningTime = useMiningStore((s) => s.miningTime) || 0;
    const sessionMiningTime = useMiningStore((s) => s.sessionMiningTime) || 0;

    const time = USE_SESSION_TIME_ONLY ? sessionMiningTime : miningTime;

    const timerRef = useRef(time);
    const [uiTime, setUiTime] = useState<TimeSince>(initialState);

    useInterval(() => {
        timerRef.current += 1000;
        const displayTime = calculateTimeSince(0, timerRef.current);
        setUiTime(displayTime);
        if (USE_SESSION_TIME_ONLY) {
            useMiningStore.setState({ sessionMiningTime: timerRef.current });
        } else {
            useMiningStore.setState({ miningTime: timerRef.current });
        }
    }, 1000);

    return uiTime;
}
