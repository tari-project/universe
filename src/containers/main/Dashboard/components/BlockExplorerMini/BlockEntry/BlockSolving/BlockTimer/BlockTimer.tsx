import { useEffect, useState } from 'react';
import { Wrapper } from './styles';
import { useBlocks } from '../../../useBlocks';

interface Props {
    time: string;
}

export default function BlockTimer({ time }: Props) {
    const { data } = useBlocks();
    const [currentTime, setCurrentTime] = useState(time);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (data && data[0]?.timeAgo) {
            const startTime = new Date(data[0].timeAgo + ' UTC').getTime();
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

        setCurrentTime(formattedTime);
    }, [seconds]);

    return (
        <Wrapper>
            <span>{currentTime}</span>
        </Wrapper>
    );
}
