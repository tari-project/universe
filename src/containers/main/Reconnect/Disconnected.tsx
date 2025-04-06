import { useUIStore } from '@app/store';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import disconnectedImage from '/assets/img/disconnected.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryTimer, SecondaryButton, HeaderImg, TextWrapper, Wrapper } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';
import { ConnectionStatusPayload, formatSecondsToMmSs, useCountdown } from '@app/hooks';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions';

const retryBackoff = [60, 120, 240];

const Disconnected: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const [isVisible, setIsVisible] = React.useState(false);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const [attempt, setAttempt] = React.useState(0);
    const { seconds, start: startCountdown, stop: stopCountdown } = useCountdown();
    const isReconnecting = useUIStore((s) => s.isReconnecting);
    const [isReconnectOnCooldown, setIsReconnectOnCooldown] = React.useState(false);

    useEffect(() => {
        const reconnectingListener = listen('reconnecting', ({ payload }: { payload: ConnectionStatusPayload }) => {
            if (payload === 'Failed') {
                stopCountdown();
                const currentAttempt = Math.min(attempt + 1, retryBackoff.length);
                if (currentAttempt === retryBackoff.length) {
                    setConnectionStatus('disconnected-severe');
                    return;
                }
                setAttempt(currentAttempt);
                startCountdown(retryBackoff[currentAttempt]);
            } else if (payload === 'Succeed') {
                stopCountdown();
            }
        });

        return () => {
            reconnectingListener.then((unlisten) => unlisten());
        };
    }, [attempt, setAttempt, startCountdown, stopCountdown]);

    useEffect(() => {
        if (!isVisible && connectionStatus === 'disconnected') {
            setIsVisible(true);
            startCountdown(retryBackoff[attempt]);
        }
        return () => {
            setIsVisible(false);
            stopCountdown();
        };
    }, [connectionStatus]);

    const reconnect = () => {
        invoke('reconnect');
        setIsReconnectOnCooldown(true);
        setTimeout(() => {
            setIsReconnectOnCooldown(false);
        }, 1000 * 60);
    };

    const retryText = isReconnecting ? (
        <>{t('reconnect-in-progress')}</>
    ) : (
        <>
            {t('auto-reconnect')} <b>{formatSecondsToMmSs(seconds)}</b>
        </>
    );

    return (
        <Wrapper style={{ display: isVisible ? 'block' : 'none' }}>
            <Stack gap={16} alignItems="center" style={{ width: '100%', height: '100%' }}>
                <HeaderImg src={disconnectedImage} alt="Disconnected" style={{ width: 'min(600px, 66vh)' }} />
                <TextWrapper>
                    <Title>{t('disconnect-title')}</Title>
                    <Typography>{t('disconnect-subtitle')}</Typography>
                </TextWrapper>
                <Stack gap={36} alignItems="center">
                    <RetryTimer>{retryText}</RetryTimer>
                    <SecondaryButton onClick={reconnect} isActive={!isReconnectOnCooldown && !isReconnecting}>
                        {t('connect-now')}
                    </SecondaryButton>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default Disconnected;
