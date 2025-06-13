import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import WalletCardActions from './actions/WalletCardActions.tsx';
import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';

export default function WalletDetails() {
    const { data } = useFetchExchangeBranding();
    const { name, logo_img_small_url } = data || {};
    return (
        <Wrapper>
            <DetailsLeft>
                <LogoWrapper>
                    {logo_img_small_url ? <img src={logo_img_small_url} alt={`${name} logo`} /> : <TariOutlineSVG />}
                </LogoWrapper>
                <Name>{name}</Name>
            </DetailsLeft>
            <Actions>
                <WalletCardActions />
            </Actions>
        </Wrapper>
    );
}
