import { useAirdropStore } from '@app/store/useAirdropStore';
import { Title, Wrapper, TitleWrapper } from './styles';
import LoggedOut from './sections/LoggedOut/LoggedOut';
import LoggedIn from './sections/LoggedIn/LoggedIn';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export default function AirdropGiftTracker() {
    useAirdropSyncState();
    const airdrop_ui_enabled = useAppConfigStore((s) => s.airdrop_ui_enabled);
    const { airdropTokens } = useAirdropStore();

    if (!airdrop_ui_enabled) return null;

    const isLoggedIn = !!airdropTokens;

    return (
        <Wrapper>
            <TitleWrapper>
                <Title>Airdrop Game</Title>
            </TitleWrapper>

            {isLoggedIn ? <LoggedIn /> : <LoggedOut />}
        </Wrapper>
    );
}
