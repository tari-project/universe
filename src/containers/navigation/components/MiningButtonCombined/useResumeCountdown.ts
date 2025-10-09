import { useMiningStore } from '@app/store';
import { useEffect, useState } from 'react';

export default function useResumeCountdown() {
    const selectedResumeDuration = useMiningStore((s) => s.selectedResumeDuration);
    const { durationHours, timeStamp } = selectedResumeDuration || {};
    const [timeString, setTimeString] = useState<string | undefined>();
    useEffect(() => {
        if (!timeStamp) return;

        const interval = setInterval(() => {
            const now = Date.now();
            console.log(`now= `, now);
            console.log(`timeStamp= `, timeStamp);

            const diff = timeStamp - now;
            const countdown = (durationHours || 0) * 3600 - diff;
            const countdownTime = new Date(countdown * 1000);
            console.log(`countdownTime= `, countdownTime);
            const hours = countdownTime.getHours();
            const mins = countdownTime.getMinutes();
            setTimeString(`${hours}:${mins}`);
        }, 1000 * 3);

        return () => clearInterval(interval);
    }, [durationHours, timeStamp]);

    return timeString;
}
