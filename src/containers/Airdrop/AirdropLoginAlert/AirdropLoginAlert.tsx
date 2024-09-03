import {
    ContentBox,
    Wrapper,
    TextWrapper,
    Title,
    Text,
    ButtonWrapper,
    ConnectButton,
    LaterButton,
    GemsWrapper,
    Gem1,
    Gem2,
    Gem3,
    StyledIconCircle,
} from './styles';
import gemImage from './images/gem.png';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { XIcon } from '../AirdropLogin/ConnectButton/styles';
import useAirdropConnect from '../hooks/useAirdropConnect';

export default function AirdropLoginAlert() {
    const { setShowLoginAlert } = useAirdropStore();

    const { handleAuth } = useAirdropConnect();

    return (
        <Wrapper initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ContentBox>
                <GemsWrapper>
                    <Gem1 src={gemImage} alt="" />
                    <Gem2 src={gemImage} alt="" />
                    <Gem3 src={gemImage} alt="" />
                </GemsWrapper>

                <TextWrapper>
                    <Title>Earn rewards for Mining on Testnet</Title>
                    <Text>
                        Earn gems while mining to increase your airdrop reward during testnet! Connect your airdrop
                        account to start earning.
                    </Text>
                </TextWrapper>

                <ButtonWrapper>
                    <ConnectButton onClick={handleAuth}>
                        <span>Connect with X</span>

                        <StyledIconCircle>
                            <XIcon />
                        </StyledIconCircle>
                    </ConnectButton>

                    <LaterButton onClick={() => setShowLoginAlert(false)}>I’ll do this later</LaterButton>
                </ButtonWrapper>
            </ContentBox>
        </Wrapper>
    );
}
