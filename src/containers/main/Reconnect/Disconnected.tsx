import { useUIStore } from '@app/store';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import disconnectedImage from '/assets/img/disconnected.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryButton, SecondaryButton, HeaderImg, TextWrapper, Wrapper } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';
import { formatSecondsToMmSs, useCountdown } from '@app/hooks';
import { invoke } from '@tauri-apps/api/core';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions';

const ConnectionAttemptIntervalsInSecs = [60, 120, 240];

const Disconnected: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const [attempt, setAttempt] = React.useState(0);

    const autoReconnect = useCallback(() => {
        invoke('reconnect');
        const currentAttempt = Math.min(attempt + 1, 2);
        if (currentAttempt === 2) {
            setConnectionStatus('disconnected-severe');
        }
        setAttempt(currentAttempt);
    }, [setAttempt, attempt]);
    const countdown = useCountdown(ConnectionAttemptIntervalsInSecs[attempt], autoReconnect);

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
                        {t('auto-reconnect')} <b>{formatSecondsToMmSs(countdown.seconds)}</b>
                    </RetryButton>
                    <SecondaryButton onClick={() => invoke('reconnect')}>{t('connect-now')}</SecondaryButton>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default Disconnected;
