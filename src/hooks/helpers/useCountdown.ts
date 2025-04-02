import { setConnectionStatus } from '@app/store/actions/uiStoreActions';
import { invoke } from '@tauri-apps/api/core';
import React from 'react';
import { useCallback } from 'react';

interface CountdownResult {
    seconds: number;
    startCountdown: () => void;
    stopCountdown: () => void;
}

/**
 * Custom hook for managing a simple countdown timer in seconds.
 *
 * @param initialSeconds The total number of seconds to count down from.
 *                       Must be a non-negative integer.
 * @param onFinish Optional callback function to execute when the countdown finishes.
 * @returns An object containing the remaining seconds and a boolean
 *          indicating if the countdown has finished.
 */
export const useCountdown = (intervalsInSecs: number[]): CountdownResult => {
    const [attempt, setAttempt] = React.useState(0);
    const retryConnectionTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const countdownInterval = React.useRef<NodeJS.Timeout | null>(null);
    const [countdown, setCoutdown] = React.useState(0);

    const reconnect = useCallback(() => {
        invoke('reconnect');
        const currentAttempt = Math.min(attempt + 1, intervalsInSecs.length - 1);
        if (currentAttempt === 2) {
            setConnectionStatus('disconnected-severe');
        }
        setAttempt(currentAttempt);
    }, [setAttempt, attempt]);

    const startConnectionRetry = useCallback(() => {
        retryConnectionTimeout.current = setTimeout(() => {
            reconnect();
        }, intervalsInSecs[attempt] * 1000);
    }, [attempt]);

    const stopConnectionRetry = useCallback(() => {
        if (retryConnectionTimeout.current) {
            clearTimeout(retryConnectionTimeout.current);
        }
    }, []);

    const startCountdown = useCallback(() => {
        setCoutdown(intervalsInSecs[attempt]);
        countdownInterval.current = setInterval(() => {
            setCoutdown((prev) => {
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
    }, [attempt]);

    const stopCountdown = useCallback(() => {
        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
        }
    }, []);

    const startRetry = useCallback(() => {
        startConnectionRetry();
        startCountdown();
    }, [startConnectionRetry, startCountdown]);

    const stopRetry = useCallback(() => {
        stopConnectionRetry();
        stopCountdown();
    }, [stopConnectionRetry, stopCountdown]);

    return {
        seconds: countdown,
        startCountdown,
        stopCountdown,
    };
};
