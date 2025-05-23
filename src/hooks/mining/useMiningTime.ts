import { useRef, useState } from 'react';
import { useInterval } from '@app/hooks';
import { useMiningStore } from '@app/store';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';

const initialState = { days: 0, daysString: '0', hours: 0, minutes: '0', seconds: '0', hoursString: '0' };
export function useMiningTime() {
    const miningTime = useMiningStore((s) => s.miningTime) || 0;

    const timerRef = useRef(miningTime);
    const [uiTime, setUiTime] = useState<TimeSince>(initialState);

    useInterval(() => {
        timerRef.current += 1000;
        useMiningStore.setState({ miningTime: timerRef.current });
        const displayTime = calculateTimeSince(0, timerRef.current);
        setUiTime(displayTime);
    }, 1000);

    return uiTime;
}
