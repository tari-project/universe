import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';

export default function WalletDetails() {
    const { name, logoSrc } = {
        name: 'Tari Universe',
        logoSrc: null,
    };
    return (
        <Wrapper>
            <DetailsLeft>
                <LogoWrapper></LogoWrapper>
                <Name>{name}</Name>
            </DetailsLeft>
            <Actions></Actions>
        </Wrapper>
    );
}
