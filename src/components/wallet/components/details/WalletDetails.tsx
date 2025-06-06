import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';
import WalletCardActions from './actions/WalletCardActions.tsx';

export default function WalletDetails() {
    const { name } = {
        name: 'Tari Universe',
    };
    return (
        <Wrapper>
            <DetailsLeft>
                <LogoWrapper>
                    <TariOutlineSVG />
                </LogoWrapper>
                <Name>{name}</Name>
            </DetailsLeft>
            <Actions>
                <WalletCardActions />
            </Actions>
        </Wrapper>
    );
}
