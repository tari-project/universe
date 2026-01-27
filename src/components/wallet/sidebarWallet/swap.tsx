import { WalletWrapper } from './wallet.styles.ts';
import { Swap } from '@app/components/transactions/wallet/Swap/Swap.tsx';
import ExchangesUrls from '@app/components/transactions/wallet/Exchanges/ExchangesUrls.tsx';
import { swapTransition } from '@app/components/transactions/wallet/transitions.ts';

export default function SwapUI() {
    return (
        <WalletWrapper key="swap" variants={swapTransition} initial="hide" exit="hide" animate="show" $isSwaps>
            <Swap />
            <ExchangesUrls />
        </WalletWrapper>
    );
}
