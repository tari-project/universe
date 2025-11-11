// the sauce of truth for all block time fmts

import { useEffect, useState } from 'react';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';
import { useBlockTip } from '@app/hooks/mining/useBlockTip.ts';

export default function useBlockTime() {
    const { data } = useBlockTip();

    const [currentTimeShort, setCurrentTimeShort] = useState('00:00');
    const [currentTimeParts, setCurrentTimeParts] = useState<TimeSince>();
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (data && data.timestamp) {
            const startTime = new Date(data.timestamp * 1000).getTime();
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            setSeconds(elapsedSeconds);
        }
    }, [data]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prevSeconds) => prevSeconds + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        setCurrentTimeShort(formattedTime);
    }, [seconds]);

    useEffect(() => {
        if (!data?.timestamp) return;
        const now = new Date().getTime();
        setCurrentTimeParts(calculateTimeSince(Number(data?.timestamp), now));
    }, [data?.timestamp, seconds]);

    return { currentTimeParts, currentTimeShort };
}
