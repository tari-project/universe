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
    NavWrapper,
    NavButton,
} from './styles.ts';
import { useRef, useState } from 'react';
import { HistoryListWrapper } from '@app/components/wallet/components/history/styles.ts';
import List from '@app/components/transactions/history/List.tsx';

import { useTranslation } from 'react-i18next';

interface SidebarWalletProps {
    section: string;
    setSection: (section: string) => void;
}
export default function SidebarWallet({ section, setSection }: SidebarWalletProps) {
    const { t } = useTranslation(['wallet', 'common', 'sidebar']);
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: targetRef });
    const [offset, setOffset] = useState(0);
    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    const isSwapping = useWalletStore((s) => s.is_swapping);

    useMotionValueEvent(scrollY, 'change', (latest) => {
        setOffset(latest);
    });

    return (
        <AnimatePresence mode="wait">
            {isSwapping && swapUiEnabled ? (
                <SwapsWrapper {...swapTransition} key="swap">
                    <Swap />
                </SwapsWrapper>
            ) : (
                <WalletWrapper key="wallet">
                    <Wrapper>
                        <DetailsCard style={{ height: 170 - offset }}>
                            <AnimatedBG $col1={`#0B0A0D`} $col2={`#6F8309`} />
                            <DetailsCardContent>
                                <WalletDetails />
                                <WalletBalance />
                            </DetailsCardContent>
                        </DetailsCard>
                        <NavWrapper>
                            <NavButton
                                $isActive={section === 'send'}
                                aria-selected={section === 'send'}
                                onClick={() => setSection('send')}
                            >
                                {t('tabs.send')}
                            </NavButton>
                            <NavButton
                                $isActive={section === 'receive'}
                                aria-selected={section === 'receive'}
                                onClick={() => setSection('receive')}
                            >
                                {t('tabs.receive')}
                            </NavButton>
                        </NavWrapper>
                        <HistoryListWrapper ref={targetRef}>
                            <List />
                        </HistoryListWrapper>
                    </Wrapper>
                </WalletWrapper>
            )}
        </AnimatePresence>
    );
}
