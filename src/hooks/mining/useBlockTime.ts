// the sauce of truth for all block time fmts

import { useEffect, useState } from 'react';
import { useFetchExplorerData } from '@app/hooks/mining/useFetchExplorerData.ts';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';

export default function useBlockTime() {
    const { data } = useFetchExplorerData();
    const currentBlock = data?.currentBlock;
    const [currentTimeShort, setCurrentTimeShort] = useState('00:00');
    const [currentTimeParts, setCurrentTimeParts] = useState<TimeSince>();
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (currentBlock && currentBlock.parsedTimestamp) {
            const startTime = new Date(currentBlock.parsedTimestamp + ' UTC').getTime();
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            setSeconds(elapsedSeconds);
        }
    }, [currentBlock]);

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
        const now = new Date().getTime();
        setCurrentTimeParts(calculateTimeSince(Number(currentBlock?.timestamp), now));
    }, [currentBlock?.timestamp, seconds]);

    return { currentTimeParts, currentTimeShort };
}
