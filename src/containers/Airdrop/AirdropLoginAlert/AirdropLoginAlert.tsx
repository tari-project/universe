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
import { useTranslation } from 'react-i18next';

export default function AirdropLoginAlert() {
    const { setShowLoginAlert } = useAirdropStore();
    const { handleAuth } = useAirdropConnect();
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    return (
        <Wrapper initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ContentBox>
                <GemsWrapper>
                    <Gem1 src={gemImage} alt="" />
                    <Gem2 src={gemImage} alt="" />
                    <Gem3 src={gemImage} alt="" />
                </GemsWrapper>

                <TextWrapper>
                    <Title>{t('alert.title')}</Title>
                    <Text>{t('alert.text')}</Text>
                </TextWrapper>

                <ButtonWrapper>
                    <ConnectButton onClick={handleAuth}>
                        <span>{t('alert.button')}</span>

                        <StyledIconCircle>
                            <XIcon />
                        </StyledIconCircle>
                    </ConnectButton>

                    <LaterButton onClick={() => setShowLoginAlert(false)}>{t('alert.later')}</LaterButton>
                </ButtonWrapper>
            </ContentBox>
        </Wrapper>
    );
}
