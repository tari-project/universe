import styled from 'styled-components';

import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import { SectionTitle } from '../WalletPageElements.styles.ts';
import { BalanceWrapper } from './Balance.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export function Balance() {
    const { formattedLongBalance } = useTariBalance();
    return (
        <Wrapper>
            <SectionTitle>{`My Tari`}</SectionTitle>
            <BalanceWrapper>
                <Typography variant="h1">{formattedLongBalance}</Typography>
                <Typography>{`tXTM`}</Typography>
            </BalanceWrapper>
        </Wrapper>
    );
}
