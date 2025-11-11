import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCountdownOptions {
    duration: number;
    onComplete?: () => void;
    autoStart?: boolean;
}

interface UseCountdownReturn {
    countdown: number | null;
    isActive: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export function useCountdown({ duration, onComplete, autoStart = false }: UseCountdownOptions): UseCountdownReturn {
    const [countdown, setCountdown] = useState<number | null>(autoStart ? duration : null);
    const [isActive, setIsActive] = useState(autoStart);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);

    // Keep the onComplete callback ref up to date
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const start = useCallback(() => {
        setCountdown(duration);
        setIsActive(true);
    }, [duration]);

    const stop = useCallback(() => {
        setIsActive(false);
        setCountdown(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        setCountdown(duration);
        setIsActive(true);
    }, [duration]);

    useEffect(() => {
        if (isActive && countdown !== null) {
            intervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev === null || prev <= 1) {
                        setIsActive(false);
                        onCompleteRef.current?.();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, countdown]);

    return {
        countdown,
        isActive,
        start,
        stop,
        reset,
    };
}
