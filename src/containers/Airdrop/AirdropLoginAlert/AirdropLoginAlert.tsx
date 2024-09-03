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
} from './styles';
import gemImage from './images/gem.png';

export default function AirdropLoginAlert() {
    return (
        <Wrapper>
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
                    <ConnectButton>
                        <span>Connect with X</span>
                    </ConnectButton>
                    <LaterButton>I’ll do this later</LaterButton>
                </ButtonWrapper>
            </ContentBox>
        </Wrapper>
    );
}
