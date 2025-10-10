import { useMiningStore } from '@app/store';
import { useCallback, useEffect, useState } from 'react';

export default function useResumeCountdown() {
    const [timeString, setTimeString] = useState<string | undefined>();

    const selectedResumeDuration = useMiningStore((s) => s.selectedResumeDuration);
    const durationHours = selectedResumeDuration?.durationHours;
    const timeStampMs = selectedResumeDuration?.timeStamp;
    const durationMs = (durationHours || 0) * 60 * 60 * 1000;

    const handleCountdown = useCallback(() => {
        if (!timeStampMs) return;
        const fmt = (n: number) => String(Math.floor(n)).padStart(2, '0');

        const nowMs = Date.now();
        const diffMs = Math.abs(nowMs - timeStampMs);

        const timerDiff = durationMs - diffMs;
        const seconds = timerDiff / 1000;

        const hrs = seconds / 3600;
        const mins = (seconds / 60) % 60;
        const s = seconds % 60;

        setTimeString(`${fmt(hrs)}:${fmt(mins)}:${fmt(s)}`);
    }, [durationMs, timeStampMs]);

    useEffect(() => {
        if (!selectedResumeDuration) return;

        const interval = setInterval(() => {
            handleCountdown();
        }, 1000);

        return () => clearInterval(interval);
    }, [handleCountdown, selectedResumeDuration]);

    return timeString;
}
