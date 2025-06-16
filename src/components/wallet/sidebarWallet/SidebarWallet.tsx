import { AnimatePresence, useMotionValueEvent, useScroll } from 'motion/react';
import { useUIStore, useWalletStore } from '@app/store';
import { swapTransition } from '@app/components/transactions/wallet/transitions.ts';
import { Swap } from '@app/components/transactions/wallet/Swap/Swap.tsx';
import { WalletBalance, WalletBalanceHidden } from '../components/balance/WalletBalance.tsx';
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
    DetailsCardBottomContent,
} from './styles.ts';
import { useCallback, useRef, useState } from 'react';
import { HistoryListWrapper } from '@app/components/wallet/components/history/styles.ts';
import { List } from '@app/components/transactions/history/List.tsx';

import WalletActions from '@app/components/wallet/components/actions/WalletActions.tsx';
import ListActions from '@app/components/wallet/components/actions/ListActions.tsx';
import { TransactionDetails } from '@app/components/transactions/history/details/TransactionDetails.tsx';
import { setDetailsItem, setIsSwapping } from '@app/store/actions/walletStoreActions.ts';

import ExchangesUrls from '@app/components/transactions/wallet/Exchanges/ExchangesUrls.tsx';
import ExchangeButton from '@app/components/transactions/wallet/Exchanges/exchange-button/ExchangeButton.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { ExternalLink } from '@app/components/transactions/components/StatusList/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ExternalLink2SVG } from '@app/assets/icons/external-link2.tsx';

interface SidebarWalletProps {
    section: string;
    setSection: (section: string) => void;
}
export default function SidebarWallet({ section, setSection }: SidebarWalletProps) {
    const { data: xcData } = useFetchExchangeBranding();
    const detailsItem = useWalletStore((s) => s.detailsItem);
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: targetRef });
    const [offset, setOffset] = useState(0);

    const isSwapping = useWalletStore((s) => s.is_swapping);
    const seedlessUI = useUIStore((s) => s.seedlessUI);
    useMotionValueEvent(scrollY, 'change', (latest) => {
        setOffset(latest);
    });
    const openLink = useCallback(() => {
        if (xcData && xcData.wallet_app_link) {
            open(xcData.wallet_app_link, '_blank');
        }
    }, [xcData]);
    return (
        <>
            <AnimatePresence initial={false} mode="wait">
                {isSwapping ? (
                    <SwapsWrapper key="swap" variants={swapTransition} initial="hide" exit="hide" animate="show">
                        <Wrapper $swapsPanel>
                            <Swap />
                            <ExchangesUrls />
                        </Wrapper>
                    </SwapsWrapper>
                ) : (
                    <WalletWrapper key="wallet" variants={swapTransition} initial="show" exit="hide" animate="show">
                        <Wrapper $seedlessUI={seedlessUI}>
                            <DetailsCard
                                style={{ height: 210 - offset }}
                                transition={{ duration: 0.2, ease: 'linear' }}
                            >
                                <AnimatedBG
                                    $col1={xcData?.primary_colour || `#0B0A0D`}
                                    $col2={xcData?.secondary_colour || `#6F8309`}
                                />
                                <DetailsCardContent>
                                    <WalletDetails />
                                    <DetailsCardBottomContent>
                                        {!seedlessUI ? <WalletBalance /> : <WalletBalanceHidden />}
                                        {xcData?.wallet_app_link && xcData?.wallet_app_label && (
                                            <ExternalLink onClick={openLink}>
                                                <Typography
                                                    variant="p"
                                                    style={{
                                                        fontSize: '10px',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                    }}
                                                >
                                                    {xcData.wallet_app_label}
                                                </Typography>
                                                <ExternalLink2SVG />
                                            </ExternalLink>
                                        )}
                                        <ExchangeButton />
                                    </DetailsCardBottomContent>
                                </DetailsCardContent>
                            </DetailsCard>
                            {!seedlessUI && (
                                <>
                                    <WalletActionWrapper style={{ height: offset > 1 ? '0' : 'auto' }}>
                                        <WalletActions section={section} setSection={setSection} />
                                    </WalletActionWrapper>
                                    <ListActions />
                                    <HistoryListWrapper ref={targetRef}>
                                        <List />
                                    </HistoryListWrapper>
                                </>
                            )}
                            <BuyTariButton onClick={() => setIsSwapping(true)}>{'Buy Tari (XTM)'}</BuyTariButton>
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
