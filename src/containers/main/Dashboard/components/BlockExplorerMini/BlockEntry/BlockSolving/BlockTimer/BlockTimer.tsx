import { useEffect, useState } from 'react';
import { Wrapper } from './styles';

interface Props {
    time: string;
}

export default function BlockTimer({ time }: Props) {
    const [currentTime, setCurrentTime] = useState(time);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prevSeconds) => prevSeconds + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const [initialMinutes, initialSeconds] = time.split(':').map(Number);

        const totalSeconds = seconds + initialMinutes * 60 + initialSeconds;
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;

        const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

        setCurrentTime(formattedTime);
    }, [seconds, time]);

    return (
        <Wrapper>
            <span>{currentTime}</span>
        </Wrapper>
    );
}
