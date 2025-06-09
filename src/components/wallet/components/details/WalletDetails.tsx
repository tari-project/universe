import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';
import WalletCardActions from './actions/WalletCardActions.tsx';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';

export default function WalletDetails() {
    const xcData = useExchangeStore((s) => s.content);
    const { name, logo_img_url } = xcData || { name: 'Tari Universe' };
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
