import { AnimatePresence } from 'motion/react';
import { useAirdropStore, useWalletStore } from '@app/store';
import { swapTransition } from '@app/components/transactions/wallet/transitions.ts';
import { Swap } from '@app/components/transactions/wallet/Swap/Swap.tsx';
import WalletBalance from '../components/balance/WalletBalance.tsx';
import WalletDetails from '../components/details/WalletDetails.tsx';
import WalletHistory from '../components/history/WalletHistory.tsx';
import { AnimatedBG, DetailsCard, DetailsCardContent, WalletWrapper, SwapsWrapper, Wrapper } from './styles.ts';
import { useEffect, useState } from 'react';

export default function SidebarWallet() {
    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    const isSwapping = useWalletStore((s) => s.is_swapping);
    const [scrollin, setScrolling] = useState(false);

    useEffect(() => {
        console.debug(`scrollin= `, scrollin);
    }, [scrollin]);
    return (
        <AnimatePresence mode="wait">
            {isSwapping && swapUiEnabled ? (
                <SwapsWrapper {...swapTransition} key="swap">
                    <Swap />
                </SwapsWrapper>
            ) : (
                <WalletWrapper key="wallet">
                    <Wrapper>
                        <DetailsCard>
                            <AnimatedBG $col1={`#0B0A0D`} $col2={`#6F8309`} />
                            <DetailsCardContent>
                                <WalletDetails />
                                <WalletBalance />
                            </DetailsCardContent>
                        </DetailsCard>
                        <WalletHistory handleScroll={setScrolling} />
                    </Wrapper>
                </WalletWrapper>
            )}
        </AnimatePresence>
    );
}
