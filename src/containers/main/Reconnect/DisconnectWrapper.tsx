import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Disconnected from '@app/containers/main/Reconnect/Disconnected.tsx';
import DisconnectedSevere from '@app/containers/main/Reconnect/DisconnectedSevere.tsx';
import { useUIStore } from '@app/store';

import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions.ts';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { BACKEND_STATE_UPDATE, BackendStateUpdateEvent } from '@app/types/backend-state';
import { useCountdown } from '@app/hooks/helpers/useCountdown.ts';
import { formatSecondsToMmSs } from '@app/hooks/helpers';

const retryBackoff = [60, 120, 240];

export default function DisconnectWrapper() {
    const { t } = useTranslation('reconnect');
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const isReconnecting = useUIStore((s) => s.isReconnecting);
    const [attempt, setAttempt] = React.useState(0);
    const [isReconnectOnCooldown, setIsReconnectOnCooldown] = React.useState(false);
    const { seconds, start: startCountdown, stop: stopCountdown } = useCountdown();
    const attemptRef = useRef(attempt);
    attemptRef.current = attempt;
    const connectionStatusRef = useRef(connectionStatus);
    connectionStatusRef.current = connectionStatus;
    const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearCooldownTimeout = useCallback(() => {
        if (cooldownTimeoutRef.current !== null) {
            clearTimeout(cooldownTimeoutRef.current);
            cooldownTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (connectionStatus === 'disconnected') {
            startCountdown(retryBackoff[attempt]);
        } else {
            startCountdown(300);
        }
        return () => {
            stopCountdown();
        };
    }, [attempt, connectionStatus, startCountdown, stopCountdown]);

    useEffect(() => {
        let cancelled = false;
        let unlistenFn: UnlistenFn | null = null;

        const handleReconnectFailure = () => {
            stopCountdown();
            const currentAttempt = Math.min(attemptRef.current + 1, retryBackoff.length);
            if (connectionStatusRef.current === 'disconnected' && currentAttempt === retryBackoff.length) {
                setConnectionStatus('disconnected-severe');
                clearCooldownTimeout();
                setIsReconnectOnCooldown(false);
                startCountdown(300);
                return;
            }
            setAttempt(currentAttempt);
            startCountdown(retryBackoff[currentAttempt]);
        };

        listen(BACKEND_STATE_UPDATE, ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
            if (cancelled) return;
            if (event.event_type === 'ConnectionStatus') {
                if (event.payload === 'Failed') {
                    handleReconnectFailure();
                } else if (event.payload === 'Succeed') {
                    stopCountdown();
                }
            } else if (event.event_type === 'CriticalProblem') {
                if (connectionStatusRef.current === 'connected') return;
                console.warn('Failed to reconnect');
                handleReconnectFailure();
            }
        }).then((unlisten) => {
            if (cancelled) {
                unlisten();
            } else {
                unlistenFn = unlisten;
            }
        });

        return () => {
            cancelled = true;
            unlistenFn?.();
            clearCooldownTimeout();
        };
    }, [clearCooldownTimeout, startCountdown, stopCountdown]);

    const countdownText = formatSecondsToMmSs(seconds);

    const retryText = useMemo(
        () =>
            isReconnecting ? (
                t('reconnect-in-progress')
            ) : (
                <>
                    {t('auto-reconnect')} <b>{countdownText}</b>
                </>
            ),
        [isReconnecting, countdownText, t]
    );
    const reconnect = useCallback(() => {
        invoke('reconnect');
        setIsReconnectOnCooldown(true);
        clearCooldownTimeout();
        cooldownTimeoutRef.current = setTimeout(() => {
            cooldownTimeoutRef.current = null;
            setIsReconnectOnCooldown(false);
        }, 1000 * 60);
    }, [clearCooldownTimeout]);

    return (
        <>
            {connectionStatus === 'disconnected' && (
                <Disconnected
                    countdownText={retryText}
                    reconnectOnCooldown={isReconnectOnCooldown}
                    onReconnectClick={reconnect}
                />
            )}
            {connectionStatus === 'disconnected-severe' && (
                <DisconnectedSevere
                    countdownText={retryText}
                    reconnectOnCooldown={isReconnectOnCooldown}
                    onReconnectClick={reconnect}
                />
            )}
        </>
    );
}
