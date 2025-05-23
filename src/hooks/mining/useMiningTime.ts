import { useMiningStore } from '@app/store';
import { useRef, useState } from 'react';
import { useInterval } from '@app/hooks';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';

const initialState = { days: 0, daysString: '0', hours: 0, minutes: '0', seconds: '0', hoursString: '0' };
export function useMiningTime() {
    const miningTime = useMiningStore((s) => s.miningTime) || 0;
    const miningTimeSecondsRef = useRef(miningTime);
    const timerRef = useRef(miningTime);
    const [uiTime, setUiTime] = useState<TimeSince>(initialState);

    console.debug(miningTime, miningTimeSecondsRef.current, timerRef.current);

    useInterval(() => {
        if (timerRef.current) {
            timerRef.current += 1000;
        }
        const displayTime = calculateTimeSince(0, timerRef.current);
        setUiTime(displayTime);
    }, 1000);

    return uiTime;
}
