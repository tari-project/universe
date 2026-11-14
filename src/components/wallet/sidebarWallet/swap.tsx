import styled from 'styled-components';
import * as m from 'motion/react-m';
import { Swap } from '@app/components/transactions/wallet/Swap/Swap.tsx';
import ExchangesUrls from '@app/components/transactions/wallet/Exchanges/ExchangesUrls.tsx';
import { swapTransition } from '@app/components/transactions/wallet/transitions.ts';
import { SB_MINI_WIDTH, SB_SPACING } from '@app/theme/styles.ts';

const BuyPageContainer = styled.div`
    pointer-events: all;
    position: fixed;
    inset: 0;
    padding: 24px 24px 24px ${SB_MINI_WIDTH + 20 + SB_SPACING}px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2;
    overflow-y: auto;
`;

const BuyPageCard = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.default};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    padding: 16px;
    width: 100%;
    max-width: 440px;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export default function SwapUI() {
    return (
        <BuyPageContainer data-testid="buy-tari-page">
            <BuyPageCard key="swap" variants={swapTransition} initial="hide" exit="hide" animate="show">
                <Swap />
                <ExchangesUrls />
            </BuyPageCard>
        </BuyPageContainer>
    );
}
