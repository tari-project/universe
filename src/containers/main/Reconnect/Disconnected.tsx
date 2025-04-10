import { useUIStore } from '@app/store';
import React from 'react';
import { useTranslation } from 'react-i18next';
import disconnectedImage from '/assets/img/disconnected.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryTimer, SecondaryButton, HeaderImg, TextWrapper, Wrapper } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';

interface DisconnectedProps {
    countdownText?: React.ReactNode;
    reconnectOnCooldown?: boolean;
    onReconnectClick: () => void;
}
const Disconnected = ({ onReconnectClick, countdownText, reconnectOnCooldown }: DisconnectedProps) => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const isReconnecting = useUIStore((s) => s.isReconnecting);

    return (
        <Wrapper>
            <Stack gap={16} alignItems="center" style={{ width: '100%', height: '100%' }}>
                <HeaderImg src={disconnectedImage} alt="Disconnected" style={{ width: 'min(600px, 66vh)' }} />
                <TextWrapper>
                    <Title>{t('disconnect-title')}</Title>
                    <Typography>{t('disconnect-subtitle')}</Typography>
                </TextWrapper>
                <Stack gap={36} alignItems="center">
                    <RetryTimer>{countdownText}</RetryTimer>
                    <SecondaryButton onClick={onReconnectClick} $isActive={!reconnectOnCooldown && !isReconnecting}>
                        {t('connect-now')}
                    </SecondaryButton>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default Disconnected;
