import { useUIStore } from '@app/store';

import React from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useTranslation } from 'react-i18next';
import disconnectedSevereImage from '/assets/img/disconnected_severe.png';
import telegramLogo from '/assets/img/telegram_logo.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryTimer, SecondaryButton, TelegramLogo, TextWrapper, Wrapper, HeaderImgSevere, SubTitle } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';
import { invoke } from '@tauri-apps/api/core';

interface DisconnectedSevereProps {
    countdownText?: React.ReactNode;
    reconnectOnCooldown?: boolean;
    onReconnectClick: () => void;
}

const DisconnectedSevere = ({ onReconnectClick, countdownText, reconnectOnCooldown }: DisconnectedSevereProps) => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const isReconnecting = useUIStore((s) => s.isReconnecting);

    const openTelegram = () => {
        open('https://t.me/tariproject');
    };

    return (
        <Wrapper>
            <Stack gap={16} alignItems="center" style={{ width: '100%', height: '100%' }}>
                <HeaderImgSevere
                    src={disconnectedSevereImage}
                    alt="DisconnectedSevere"
                    style={{ width: 'min(660px, 100vh)' }}
                />
                <TextWrapper>
                    <Title>{t('disconnect-severe-title')}</Title>
                    <SubTitle>{t('disconnect-severe-subtitle')}</SubTitle>
                </TextWrapper>
                <Stack gap={36} alignItems="center">
                    <RetryTimer>{countdownText}</RetryTimer>
                    <Stack direction="row" gap={30}>
                        <SecondaryButton onClick={onReconnectClick} $isActive={!reconnectOnCooldown && !isReconnecting}>
                            {t('connect-now')}
                        </SecondaryButton>
                        <Typography opacity={0.5}>{' | '}</Typography>
                        <SecondaryButton onClick={() => invoke('restart_application')} $isActive>
                            {t('restart-app')}
                        </SecondaryButton>
                        <Typography opacity={0.5}>{' | '}</Typography>
                        <SecondaryButton onClick={openTelegram} $isActive>
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
