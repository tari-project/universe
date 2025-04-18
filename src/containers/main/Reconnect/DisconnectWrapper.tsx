import Disconnected from '@app/containers/main/Reconnect/Disconnected.tsx';
import DisconnectedSevere from '@app/containers/main/Reconnect/DisconnectedSevere.tsx';
import { useUIStore } from '@app/store';
import { formatSecondsToMmSs, useCountdown } from '@app/hooks';
import React, { useCallback, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions.ts';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { BACKEND_STATE_UPDATE, BackendStateUpdateEvent } from '@app/types/backend-state';

const retryBackoff = [60, 120, 240];

export default function DisconnectWrapper() {
    const { t } = useTranslation('reconnect');
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const isReconnecting = useUIStore((s) => s.isReconnecting);
    const [attempt, setAttempt] = React.useState(0);
    const [isReconnectOnCooldown, setIsReconnectOnCooldown] = React.useState(false);
    const { seconds, start: startCountdown, stop: stopCountdown } = useCountdown();

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
        const reconnectingListener = listen(
            BACKEND_STATE_UPDATE,
            ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                if (event.event_type !== 'ConnectionStatus') return;
                if (event.payload === 'Failed') {
                    stopCountdown();
                    const currentAttempt = Math.min(attempt + 1, retryBackoff.length);
                    if (connectionStatus === 'disconnected' && currentAttempt === retryBackoff.length) {
                        setConnectionStatus('disconnected-severe');
                        setIsReconnectOnCooldown(false);
                        startCountdown(300);
                        return;
                    }
                    setAttempt(currentAttempt);
                    startCountdown(retryBackoff[currentAttempt]);
                } else if (event.payload === 'Succeed') {
                    stopCountdown();
                }
            }
        );

        const criticalErrorListener = listen(
            BACKEND_STATE_UPDATE,
            ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                if (event.event_type !== 'CriticalProblem') return;
                if (connectionStatus === 'connected') return;
                console.warn('Failed to reconnect');
                stopCountdown();
                const currentAttempt = Math.min(attempt + 1, retryBackoff.length);
                if (connectionStatus === 'disconnected' && currentAttempt === retryBackoff.length) {
                    setConnectionStatus('disconnected-severe');
                    setIsReconnectOnCooldown(false);
                    startCountdown(300);
                    return;
                }
                setAttempt(currentAttempt);
                startCountdown(retryBackoff[currentAttempt]);
            }
        );

        return () => {
            reconnectingListener.then((unlisten) => unlisten());
            criticalErrorListener.then((unlisten) => unlisten());
        };
    }, [attempt, connectionStatus, setAttempt, startCountdown, stopCountdown]);

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
        setTimeout(() => {
            setIsReconnectOnCooldown(false);
        }, 1000 * 60);
    }, []);

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
