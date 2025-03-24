import { useTranslation } from 'react-i18next';

import { useAirdropStore } from '@app/store/useAirdropStore';

import InfoTooltip from './components/InfoTooltip/InfoTooltip';
import LoggedOut from './sections/LoggedOut/LoggedOut';
import LoggedIn from './sections/LoggedIn/LoggedIn';
import { Title, TitleWrapper, Wrapper } from './styles';
import useAirdropWebsocket from '@app/hooks/airdrop/ws/useAirdropWebsocket.ts';
import { useXSpaceEventRefresh } from '@app/hooks/airdrop/stateHelpers/useXSpaceEventRefresh.ts';

export default function AirdropGiftTracker() {
    useAirdropWebsocket();
    useXSpaceEventRefresh();

    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const airdropTokens = useAirdropStore((s) => s.airdropTokens);
    const isLoggedIn = !!airdropTokens;

    return (
        <Wrapper>
            <TitleWrapper>
                <Title>{isLoggedIn ? t('loggedInTitle') : t('loggedOutTitle')}</Title>
                <InfoTooltip title={t('topTooltipTitle')} text={t('topTooltipText')} />
            </TitleWrapper>

            {isLoggedIn ? <LoggedIn /> : <LoggedOut />}
        </Wrapper>
    );
}
