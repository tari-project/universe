import { useAirdropStore } from '@app/store/useAirdropStore';
import { Title, Wrapper, TitleWrapper } from './styles';
import LoggedOut from './sections/LoggedOut/LoggedOut';

export default function AirdropGiftTracker() {
    const { airdropTokens, wipUI } = useAirdropStore();

    if (!wipUI) return null;

    const isLoggedIn = !!airdropTokens;

    return (
        <Wrapper>
            <TitleWrapper>
                <Title>Airdrop Game</Title>
            </TitleWrapper>

            <LoggedOut />
        </Wrapper>
    );
}
