import { useUIStore } from '@app/store';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions';
import disconnectedSevereImage from '/assets/img/disconnected_severe.png';
import telegramLogo from '/assets/img/telegram_logo.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryButton, SecondaryButton, TelegramLogo, TextWrapper, Wrapper, HeaderImgSevere, SubTitle } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';

const DisconnectedSevere: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const connectionStatus = useUIStore((s) => s.connectionStatus);
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
                    <RetryButton onClick={() => console.info('Clicked primary button')}>
                        {t('auto-reconnect')}
                    </RetryButton>
                    <Stack direction="row" gap={30}>
                        <SecondaryButton onClick={() => setConnectionStatus('connected')}>
                            {t('connect-now')}
                        </SecondaryButton>
                        <Typography opacity={0.5}>{' | '}</Typography>
                        <SecondaryButton onClick={() => setConnectionStatus('connected')}>
                            {t('restart-app')}
                        </SecondaryButton>
                        <Typography opacity={0.5}>{' | '}</Typography>
                        <Stack alignItems="center" direction="row">
                            <SecondaryButton onClick={() => setConnectionStatus('connected')}>
                                <Typography>{t('go-to-telegram')}</Typography>
                            </SecondaryButton>
                            <TelegramLogo src={telegramLogo} alt="Telegram" />
                        </Stack>
                    </Stack>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default DisconnectedSevere;
