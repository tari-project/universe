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
        // Same reason as the interval below, with a worse symptom: an
        // abandoned timer still fires `reconnect`, so overlapping retries
        // stack up reconnect attempts instead of replacing them.
        if (retryConnectionTimeout.current) {
            clearTimeout(retryConnectionTimeout.current);
        }
        retryConnectionTimeout.current = setTimeout(() => {
            invoke('reconnect');
        }, timeout * 1000);
    }, []);

    const stopConnectionRetry = useCallback(() => {
        if (retryConnectionTimeout.current) {
            clearTimeout(retryConnectionTimeout.current);
            retryConnectionTimeout.current = null;
        }
    }, []);

    const startCountdown = useCallback((duration: number) => {
        setCountdown(duration);
        // Clear any interval still running: DisconnectWrapper starts a new
        // countdown while an earlier one is live (the `disconnected-severe`
        // branch), and without this both tick, so the timer counts down at
        // double speed and the old interval leaks.
        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
        }
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
            countdownInterval.current = null;
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
