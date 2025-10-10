import { useMiningStore } from '@app/store';
import { useCallback, useEffect, useState } from 'react';

export default function useResumeCountdown() {
    const [fullTimeString, setFullTimeString] = useState<string | undefined>();
    const [displayString, setDisplayString] = useState<string | undefined>();

    const selectedResumeDuration = useMiningStore((s) => s.selectedResumeDuration);
    const durationHours = selectedResumeDuration?.durationHours;
    const timeStampMs = selectedResumeDuration?.timeStamp;
    const durationMs = (durationHours || 0) * 60 * 60 * 1000;

    const handleCountdown = useCallback(() => {
        if (!selectedResumeDuration || !timeStampMs) {
            setFullTimeString(undefined);
            setDisplayString(undefined);
            return;
        }
        const fmt = (n: number) => String(Math.floor(n)).padStart(2, '0');

        const nowMs = Date.now();
        const diffMs = Math.abs(nowMs - timeStampMs);

        const timerDiff = durationMs - diffMs;
        const seconds = timerDiff / 1000;

        const hrs = seconds / 3600;
        const mins = (seconds / 60) % 60;

        const hrString = `${Math.floor(hrs)} hour${hrs >= 2 ? 's' : ''}`;
        const mString = mins >= 1 ? ` and ${fmt(mins)} minute${mins >= 2 ? 's' : ''}` : '';

        setFullTimeString(`Mining will auto-resume in ~${hrString}${mString}`);
        setDisplayString(`${fmt(hrs)}:${fmt(mins)}`);
    }, [durationMs, selectedResumeDuration, timeStampMs]);

    useEffect(() => {
        const interval = setInterval(() => handleCountdown(), 1000 * 60);
        handleCountdown();
        return () => clearInterval(interval);
    }, [handleCountdown]);

    return { displayString, fullTimeString };
}
