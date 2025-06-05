import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import WalletActions from '@app/components/wallet/components/actions/WalletActions.tsx';

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
                <WalletActions />
            </Actions>
        </Wrapper>
    );
}
