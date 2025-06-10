import { AnimatePresence, useMotionValueEvent, useScroll } from 'motion/react';
import { useAirdropStore, useWalletStore } from '@app/store';
import { swapTransition } from '@app/components/transactions/wallet/transitions.ts';
import { Swap } from '@app/components/transactions/wallet/Swap/Swap.tsx';
import WalletBalance from '../components/balance/WalletBalance.tsx';
import WalletDetails from '../components/details/WalletDetails.tsx';
import {
    AnimatedBG,
    DetailsCard,
    DetailsCardContent,
    WalletWrapper,
    SwapsWrapper,
    Wrapper,
    WalletActionWrapper,
    BuyTariButton,
} from './styles.ts';
import { useRef, useState } from 'react';
import { HistoryListWrapper } from '@app/components/wallet/components/history/styles.ts';
import List from '@app/components/transactions/history/List.tsx';

import WalletActions from '@app/components/wallet/components/actions/WalletActions.tsx';
import ListActions from '@app/components/wallet/components/actions/ListActions.tsx';
import { TransactionDetails } from '@app/components/transactions/history/details/TransactionDetails.tsx';
import { setDetailsItem, setIsSwapping } from '@app/store/actions/walletStoreActions.ts';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';

interface SidebarWalletProps {
    section: string;
    setSection: (section: string) => void;
}
export default function SidebarWallet({ section, setSection }: SidebarWalletProps) {
    const xcData = useExchangeStore((s) => s.content);
    const detailsItem = useWalletStore((s) => s.detailsItem);
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: targetRef });
    const [offset, setOffset] = useState(0);

    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    const isSwapping = useWalletStore((s) => s.is_swapping);

    useMotionValueEvent(scrollY, 'change', (latest) => {
        setOffset(latest);
    });

    const showSwaps = swapUiEnabled && isSwapping;

    return (
        <>
            <AnimatePresence initial={false} mode="wait">
                {showSwaps ? (
                    <SwapsWrapper key="swap" variants={swapTransition} initial="hide" exit="hide" animate="show">
                        <Wrapper $swapsPanel>
                            <Swap />
                        </Wrapper>
                    </SwapsWrapper>
                ) : (
                    <WalletWrapper key="wallet" variants={swapTransition} initial="show" exit="hide" animate="show">
                        <Wrapper>
                            <DetailsCard
                                style={{ height: 170 - offset }}
                                transition={{ duration: 0.2, ease: 'linear' }}
                            >
                                <AnimatedBG
                                    $col1={xcData?.primary_colour || `#0B0A0D`}
                                    $col2={xcData?.secondary_colour || `#6F8309`}
                                />
                                <DetailsCardContent>
                                    <WalletDetails />
                                    <WalletBalance />
                                </DetailsCardContent>
                            </DetailsCard>
                            <WalletActionWrapper style={{ height: offset > 1 ? '0' : 'auto' }}>
                                <WalletActions section={section} setSection={setSection} />
                            </WalletActionWrapper>
                            <ListActions />
                            <HistoryListWrapper ref={targetRef}>
                                <List />
                            </HistoryListWrapper>
                            {swapUiEnabled && (
                                <BuyTariButton onClick={() => setIsSwapping(true)}>{'Buy Tari (wXTM)'}</BuyTariButton>
                            )}
                        </Wrapper>
                    </WalletWrapper>
                )}
            </AnimatePresence>
            {detailsItem && (
                <TransactionDetails
                    item={detailsItem}
                    expanded={Boolean(detailsItem)}
                    handleClose={() => setDetailsItem(null)}
                />
            )}
        </>
    );
}
