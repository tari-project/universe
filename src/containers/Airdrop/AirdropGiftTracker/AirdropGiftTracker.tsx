import { useAirdropStore } from '@app/store/useAirdropStore';
import { Title, Wrapper, TitleWrapper } from './styles';
import LoggedOut from './sections/LoggedOut/LoggedOut';
import LoggedIn from './sections/LoggedIn/LoggedIn';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState';

export default function AirdropGiftTracker() {
    useAirdropSyncState();
    const { airdropTokens, wipUI } = useAirdropStore();

    if (!wipUI) return null;

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
