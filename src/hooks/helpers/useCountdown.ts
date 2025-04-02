import { setConnectionStatus, setIsReconnecting } from '@app/store/actions/uiStoreActions';
import { invoke } from '@tauri-apps/api/core';
import React from 'react';
import { useCallback } from 'react';

interface CountdownResult {
    seconds: number;
    start: () => void;
    stop: () => void;
}

export const useCountdown = (intervalsInSecs: number[]): CountdownResult => {
    const [attempt, setAttempt] = React.useState(0);
    const retryConnectionTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const countdownInterval = React.useRef<NodeJS.Timeout | null>(null);
    const [countdown, setCoutdown] = React.useState(0);

    const reconnect = useCallback(() => {
        setIsReconnecting(true);
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
        start: startRetry,
        stop: stopRetry,
    };
};
