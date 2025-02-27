import styled from 'styled-components';
import WalletBalanceMarkup from '@app/containers/main/SidebarNavigation/components/Wallet/WalletBalanceMarkup.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export function Balance() {
    return (
        <Wrapper>
            <Typography>{`My Tari`}</Typography>
            <WalletBalanceMarkup />
        </Wrapper>
    );
}
