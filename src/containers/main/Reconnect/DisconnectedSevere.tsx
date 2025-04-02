import { useUIStore } from '@app/store';

import React, { useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useTranslation } from 'react-i18next';
import disconnectedSevereImage from '/assets/img/disconnected_severe.png';
import telegramLogo from '/assets/img/telegram_logo.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryButton, SecondaryButton, TelegramLogo, TextWrapper, Wrapper, HeaderImgSevere, SubTitle } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';
import { formatSecondsToMmSs, useCountdown } from '@app/hooks';
import { invoke } from '@tauri-apps/api/core';

const DisconnectedSevere: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const [isVisible, setIsVisible] = React.useState(false);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const { seconds, start: startCountdown, stop: stopCountdown } = useCountdown([300]);

    useEffect(() => {
        if (!isVisible && connectionStatus === 'disconnected-severe') {
            setIsVisible(true);
            startCountdown();
        }
        return () => {
            setIsVisible(false);
            stopCountdown();
        };
    }, [connectionStatus]);

    const openTelegram = () => {
        open('https://t.me/tariproject');
    };

    return (
        <Wrapper style={{ display: connectionStatus === 'disconnected-severe' ? 'block' : 'none' }}>
            <Stack gap={16} alignItems="center" style={{ width: '100%', height: '100%' }}>
                <HeaderImgSevere
                    src={disconnectedSevereImage}
                    alt="DisconnectedSevere"
                    style={{ width: 'min(660px, 100vh);' }}
                />
                <TextWrapper>
                    <Title>{t('disconnect-severe-title')}</Title>
                    <SubTitle>{t('disconnect-severe-subtitle')}</SubTitle>
                </TextWrapper>
                <Stack gap={36} alignItems="center">
                    <RetryButton>
                        {t('auto-reconnect')} <b>{formatSecondsToMmSs(seconds)}</b>
                    </RetryButton>
                    <Stack direction="row" gap={30}>
                        <SecondaryButton onClick={() => invoke('reconnect')}>{t('connect-now')}</SecondaryButton>
                        <Typography opacity={0.5}>{' | '}</Typography>
                        <SecondaryButton onClick={() => invoke('restart_application')}>
                            {t('restart-app')}
                        </SecondaryButton>
                        <Typography opacity={0.5}>{' | '}</Typography>
                        <SecondaryButton onClick={openTelegram}>
                            <Typography>{t('go-to-telegram')}</Typography>
                            <TelegramLogo src={telegramLogo} alt="Telegram" />
                        </SecondaryButton>
                    </Stack>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default DisconnectedSevere;
