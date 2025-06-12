import { useFetchXCContent } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import WalletCardActions from './actions/WalletCardActions.tsx';
import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';

export default function WalletDetails() {
    const { data } = useFetchXCContent();
    const { name, logo_img_url } = data || {};
    return (
        <Wrapper>
            <DetailsLeft>
                <LogoWrapper>
                    {logo_img_url ? <img src={logo_img_url} alt={`${name} logo`} /> : <TariOutlineSVG />}
                </LogoWrapper>
                <Name>{name}</Name>
            </DetailsLeft>
            <Actions>
                <WalletCardActions />
            </Actions>
        </Wrapper>
    );
}
