import { useEffect, useState } from 'react';
import { Wrapper } from './styles';

import { useFetchExplorerData } from '@app/hooks/mining/useFetchExplorerData.ts';

interface Props {
    time: string;
}

export default function BlockTimer({ time }: Props) {
    const { data } = useFetchExplorerData();
    const currentBlock = data?.currentBlock;
    const [currentTime, setCurrentTime] = useState(time);
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

        setCurrentTime(formattedTime);
    }, [seconds]);

    return (
        <Wrapper>
            <span>{currentTime}</span>
        </Wrapper>
    );
}
