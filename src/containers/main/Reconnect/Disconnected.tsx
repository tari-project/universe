import { useUIStore } from '@app/store';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { setIsReconnecting } from '@app/store/actions/uiStoreActions';
import disconnectedImage from '/assets/img/disconnected.png';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { RetryButton, SecondaryButton, HeaderImg, TextWrapper, Wrapper } from './styles';
import { Title } from '@app/containers/floating/StagedSecurity/styles';

const Disconnected: React.FC = () => {
    const { t } = useTranslation('reconnect', { useSuspense: false });
    const isReconnecting = useUIStore((s) => s.isReconnecting);
    return (
        <Wrapper style={{ display: isReconnecting ? 'block' : 'none' }}>
            <Stack gap={16} alignItems="center" style={{ width: '100%', height: '100%' }}>
                <HeaderImg src={disconnectedImage} alt="Disconnected" style={{ width: 'min(60px, 66vh);' }} />
                <TextWrapper>
                    <Title>{t('disconnect-title')}</Title>
                    <Typography>{t('disconnect-subtitle')}</Typography>
                </TextWrapper>
                <Stack gap={36}>
                    <RetryButton onClick={() => console.info('Clicked primary button')}>
                        {t('auto-reconnect')}
                    </RetryButton>
                    <SecondaryButton onClick={() => setIsReconnecting(false)}>{t('connect-now')}</SecondaryButton>
                </Stack>
            </Stack>
        </Wrapper>
    );
};

export default Disconnected;
