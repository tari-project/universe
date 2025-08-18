import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import WalletCardActions from './actions/WalletCardActions.tsx';
import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';

export default function WalletDetails() {
    const { data } = useFetchExchangeBranding();
    const name = data?.name;
    const logoSrc = data?.logo_img_small_url || data?.logo_img_url;

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
                <WalletCardActions />
            </Actions>
        </Wrapper>
    );
}
