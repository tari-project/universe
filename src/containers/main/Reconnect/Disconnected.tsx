import { useUIStore } from '@app/store';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import disconnectedImage from '/assets/img/disconnected.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryButton, SecondaryButton, HeaderImg, TextWrapper, Wrapper } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';
import { formatSecondsToMmSs, useCountdown } from '@app/hooks';
import { invoke } from '@tauri-apps/api/core';

const ConnectionAttemptIntervalsInSecs = [60, 120, 240];

const Disconnected: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const [isVisible, setIsVisible] = React.useState(false);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const { seconds, startCountdown, stopCountdown } = useCountdown(ConnectionAttemptIntervalsInSecs);

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

    return (
        <Wrapper style={{ display: connectionStatus === 'disconnected' ? 'block' : 'none' }}>
            <Stack gap={16} alignItems="center" style={{ width: '100%', height: '100%' }}>
                <HeaderImg src={disconnectedImage} alt="Disconnected" style={{ width: 'min(60px, 66vh);' }} />
                <TextWrapper>
                    <Title>{t('disconnect-title')}</Title>
                    <Typography>{t('disconnect-subtitle')}</Typography>
                </TextWrapper>
                <Stack gap={36}>
                    <RetryButton>
                        {t('auto-reconnect')} <b>{formatSecondsToMmSs(seconds)}</b>
                    </RetryButton>
                    <SecondaryButton onClick={() => invoke('reconnect')}>{t('connect-now')}</SecondaryButton>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default Disconnected;
