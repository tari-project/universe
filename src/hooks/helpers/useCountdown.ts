import { invoke } from '@tauri-apps/api/core';
import React from 'react';
import { useCallback } from 'react';

interface CountdownResult {
    seconds: number;
    start: (timeout: number) => void;
    stop: () => void;
}

export const useCountdown = (): CountdownResult => {
    const retryConnectionTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const countdownInterval = React.useRef<NodeJS.Timeout | null>(null);
    const [countdown, setCountdown] = React.useState(0);

    const startConnectionRetry = useCallback((timeout: number) => {
        retryConnectionTimeout.current = setTimeout(() => {
            invoke('reconnect');
        }, timeout * 1000);
    }, []);

    const stopConnectionRetry = useCallback(() => {
        if (retryConnectionTimeout.current) {
            clearTimeout(retryConnectionTimeout.current);
        }
    }, []);

    const startCountdown = useCallback((duration: number) => {
        setCountdown(duration);
        countdownInterval.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 0) {
                    if (countdownInterval.current) {
                        clearInterval(countdownInterval.current);
                        countdownInterval.current = null;
                    }
                    return prev;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const stopCountdown = useCallback(() => {
        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
        }
    }, []);

    const startRetry = useCallback(
        (timeout: number) => {
            startConnectionRetry(timeout);
            startCountdown(timeout);
        },
        [startConnectionRetry, startCountdown]
    );

    const stopRetry = useCallback(() => {
        stopConnectionRetry();
        stopCountdown();
    }, [stopConnectionRetry, stopCountdown]);

    return {
        seconds: countdown,
        start: startRetry,
        stop: stopRetry,
    };
};
