import styled from 'styled-components';

import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import { SectionTitle } from './WalletPageElements.styles.ts';

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
            {formattedLongBalance}
        </Wrapper>
    );
}
