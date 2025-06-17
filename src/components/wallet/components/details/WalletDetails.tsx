import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import WalletCardActions from './actions/WalletCardActions.tsx';
import { Actions, DetailsLeft, LogoWrapper, MiningHereText, MiningHereWrapper, Name, Wrapper } from './styles.ts';
import { useTranslation } from 'react-i18next';

export default function WalletDetails() {
    const { data } = useFetchExchangeBranding();
    const name = data?.name;
    const logoSrc = data?.logo_img_small_url ?? data?.logo_img_url;
    const { t } = useTranslation('wallet');

    return (
        <Wrapper>
            <DetailsLeft>
                {logoSrc ? (
                    <LogoWrapper>
                        <img src={logoSrc} alt={`${name} logo`} />
                    </LogoWrapper>
                ) : null}
                <Name>{name}</Name>
            </DetailsLeft>
            <Actions>
                <MiningHereWrapper>
                    <MiningHereText>{t('xc.mining-here')}</MiningHereText>
                </MiningHereWrapper>
                <WalletCardActions />
            </Actions>
        </Wrapper>
    );
}
