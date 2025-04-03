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
import { setIsReconnecting } from '@app/store/actions/uiStoreActions';
import { listen } from '@tauri-apps/api/event';

const ConnectionAttemptIntervalsInSecs = [60, 120, 240];

const Disconnected: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const [isVisible, setIsVisible] = React.useState(false);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const {
        seconds,
        start: startCountdown,
        stop: stopCountdown,
        restartAttempts,
    } = useCountdown(ConnectionAttemptIntervalsInSecs);
    const isReconnecting = useUIStore((s) => s.isReconnecting);

    useEffect(() => {
        const reconnectingListener = listen('reconnecting', ({ payload }: { payload: ConnectionStatusPayload }) => {
            if (payload === 'Failed') {
                stopCountdown();
                startCountdown();
            } else if (payload === 'Succeed') {
                restartAttempts();
            }
        });

        return () => {
            reconnectingListener.then((unlisten) => unlisten());
        };
    }, []);

    useEffect(() => {
        if (!isVisible && connectionStatus === 'disconnected') {
            setIsVisible(true);
            startCountdown();
        }
        return () => {
            setIsVisible(false);
            stopCountdown();
        };
    }, [connectionStatus]);

    const reconnect = () => {
        invoke('reconnect');
        setIsReconnecting(true);
    };

    useEffect(() => {
        if (isReconnecting) {
            stopCountdown();
        }
    }, [isReconnecting]);

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
                    <SecondaryButton onClick={reconnect}>{t('connect-now')}</SecondaryButton>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default Disconnected;
