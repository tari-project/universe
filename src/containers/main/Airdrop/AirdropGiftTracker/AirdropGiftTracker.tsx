import { useTranslation } from 'react-i18next';

import { useAirdropStore } from '@app/store/useAirdropStore';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState';
import { useWebsocket } from '@app/hooks/airdrop/useWebsocket.ts';

import InfoTooltip from './components/InfoTooltip/InfoTooltip';
import LoggedOut from './sections/LoggedOut/LoggedOut';
import LoggedIn from './sections/LoggedIn/LoggedIn';
import { Title, TitleWrapper, Wrapper } from './styles';

export default function AirdropGiftTracker() {
    useAirdropSyncState();
    useWebsocket();

    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const { airdropTokens } = useAirdropStore();
    const isLoggedIn = !!airdropTokens;

    return (
        <Wrapper layout>
            <TitleWrapper>
                <Title>{isLoggedIn ? t('loggedInTitle') : t('loggedOutTitle')}</Title>
                <InfoTooltip title={t('topTooltipTitle')} text={t('topTooltipText')} />
            </TitleWrapper>

            {isLoggedIn ? <LoggedIn /> : <LoggedOut />}
        </Wrapper>
    );
}
