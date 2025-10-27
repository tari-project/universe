import { useMiningStore } from '@app/store';
import { useCallback, useEffect, useState } from 'react';

export default function useResumeCountdown() {
    const [fullTimeString, setFullTimeString] = useState<string | undefined>();
    const [displayString, setDisplayString] = useState<string | undefined>();
    const [hasHours, setHasHours] = useState(false);

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
        const fmt = (n = 0) => Math.floor(n).toString().padStart(2, '0');

        const nowMs = Date.now();
        const diffMs = Math.abs(nowMs - timeStampMs);

        const timerDiff = durationMs - diffMs;
        const seconds = timerDiff / 1000;

        const hrs = seconds / 3600;
        const mins = (seconds / 60) % 60;
        const s = seconds % 60;

        const renderHours = Math.floor(hrs) >= 1;
        setHasHours(renderHours);

        const timeStrDisplay = renderHours ? `${fmt(hrs)}:${fmt(mins)}` : `${fmt(mins)}:${fmt(s)}`;
        setDisplayString(timeStrDisplay);

        // for the full time on hover
        const hrStr = renderHours ? `${Math.floor(hrs)} hour${hrs >= 2 ? 's' : ''} ` : '';
        const mStr = mins >= 1 ? `${fmt(mins)} minute${mins >= 2 ? 's' : ''} ` : '';
        const sStr = !renderHours && s >= 1 ? `${fmt(s)} seconds` : '';
        const timeStr = `${hrStr}${mStr}${sStr}`;
        setFullTimeString(`Mining will auto-resume in ~${timeStr}`);
    }, [durationMs, selectedResumeDuration, timeStampMs]);

    useEffect(() => {
        const interval = hasHours ? 1000 * 45 : 1000;
        const countdown = setInterval(() => handleCountdown(), interval);
        handleCountdown();
        return () => clearInterval(countdown);
    }, [handleCountdown, hasHours]);

    return { displayString, fullTimeString };
}
