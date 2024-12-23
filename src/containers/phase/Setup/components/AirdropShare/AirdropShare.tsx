/* eslint-disable i18next/no-literal-string */
import { Gem1, Gem2, Gem3, GemsWrapper, Text, TextWrapper, Title } from '../AirdropLogin/styles';
import { Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import gemLargeImage from '../../../../main/Airdrop/AirdropGiftTracker/images/gem.png';

export default function AirdropShare() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    return (
        <Wrapper>
            <GemsWrapper>
                <Gem1 src={gemLargeImage} alt="" />
                <Gem2 src={gemLargeImage} alt="" />
                <Gem3 src={gemLargeImage} alt="" />
            </GemsWrapper>

            <TextWrapper>
                <Title>{t('claimModalTitle')}</Title>

                <Text>
                    Earn gems while mining to increase your airdrop reward during testnet! Connect your airdrop account
                    to start earning.
                </Text>
            </TextWrapper>
        </Wrapper>
    );
}
