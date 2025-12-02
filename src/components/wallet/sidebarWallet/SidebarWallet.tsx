import { AnimatePresence } from 'motion/react';
import { useNodeStore, useConfigUIStore, useWalletStore } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore';
import { swapTransition } from '@app/components/transactions/wallet/transitions.ts';
import { Swap } from '@app/components/transactions/wallet/Swap/Swap.tsx';
import { WalletBalance, WalletBalanceHidden } from '../components/balance/WalletBalance.tsx';
import WalletDetails from '../components/details/WalletDetails.tsx';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';
import { AppModuleStatus } from '@app/store/types/setup';

import {
    AnimatedBG,
    DetailsCard,
    DetailsCardContent,
    WalletWrapper,
    SwapsWrapper,
    Wrapper,
    BuyTariButton,
    DetailsCardBottomContent,
    TabsWrapper,
    WalletErrorWrapper,
} from './styles.ts';
import { useCallback, useRef, useState, useEffect, RefObject } from 'react';
import { HistoryListWrapper } from '@app/components/wallet/components/history/styles.ts';
import { List } from '@app/components/transactions/history/List.tsx';
import { open } from '@tauri-apps/plugin-shell';

import WalletActions from '@app/components/wallet/components/actions/WalletActions.tsx';
import { TransactionDetails } from '@app/components/transactions/history/transactionDetails/TransactionDetails.tsx';
import { setIsSwapping, setTxHistoryFilter, setDetailsItemTransaction } from '@app/store/actions/walletStoreActions.ts';

import ExchangesUrls from '@app/components/transactions/wallet/Exchanges/ExchangesUrls.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { ExternalLink } from '@app/components/transactions/components/StatusList/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ExternalLink2SVG } from '@app/assets/icons/external-link2.tsx';
import { FilterSelect, TxHistoryFilter } from '@app/components/transactions/history/FilterSelect.tsx';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import SecureWalletWarning from './SecureWalletWarning/SecureWalletWarning.tsx';
import FailedModuleAlertButton from '@app/components/dialogs/FailedModuleAlertButton.tsx';
import { useTranslation } from 'react-i18next';

interface SidebarWalletProps {
    section: string;
    setSection: (section: string) => void;
}

export default function SidebarWallet({ section, setSection }: SidebarWalletProps) {
    const { t } = useTranslation('wallet');
    const { data: xcData } = useFetchExchangeBranding();
    const selectedTransactionDetails = useWalletStore((s) => s.selectedTransactionDetails);
    const filter = useWalletStore((s) => s.transaction_history_filter);

    const walletModule = useSetupStore(setupStoreSelectors.selectWalletModule);
    const isWalletModuleFailed = walletModule?.status === AppModuleStatus.Failed;

    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);
    const isInitialWalletScanning = useWalletStore((s) => !s.wallet_scanning?.is_initial_scan_complete);

    const targetRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
    const [isScrolled, setIsScrolled] = useState(false);

    function handleFilterChange(newFilter: TxHistoryFilter) {
        setTxHistoryFilter(newFilter);
    }

    useEffect(() => {
        const el = targetRef.current;
        if (!el) return;
        const onScroll = () => setIsScrolled(el.scrollTop > 1);
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    const isSyncing = !isConnectedToTariNetwork || isInitialWalletScanning;
    const isSwapping = useWalletStore((s) => s.is_swapping);
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);

    const openLink = useCallback(async () => {
        if (xcData && xcData.wallet_app_link) {
            await open(xcData.wallet_app_link);
        }
    }, [xcData]);

    const postLoadedMarkup = (
        <>
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
            <SecureWalletWarning $isScrolled={isScrolled} isExchangeMiner={xcData?.id !== 'universal'} />
        </>
    );

    const walletMarkup = (
        <>
            <DetailsCard $isScrolled={isScrolled}>
                <AnimatedBG $col1={xcData?.primary_colour || `#0B0A0D`} $col2={xcData?.secondary_colour || `#6F8309`} />
                <DetailsCardContent>
                    <WalletDetails />
                    <DetailsCardBottomContent>
                        <>
                            {isStandardWalletUI ? <WalletBalance /> : <WalletBalanceHidden />}
                            {postLoadedMarkup}
                        </>
                    </DetailsCardBottomContent>
                </DetailsCardContent>
                {isWalletModuleFailed && (
                    <WalletErrorWrapper>
                        <FailedModuleAlertButton />
                    </WalletErrorWrapper>
                )}
            </DetailsCard>
            {isStandardWalletUI && !isWalletModuleFailed && (
                <>
                    <TabsWrapper>
                        <FilterSelect filter={filter} handleFilterChange={handleFilterChange} />
                        <WalletActions section={section} setSection={setSection} />
                    </TabsWrapper>
                    <HistoryListWrapper ref={targetRef}>
                        <List />
                    </HistoryListWrapper>
                </>
            )}
        </>
    );

    if (isWalletModuleFailed) {
        return (
            <AnimatePresence initial={false} mode="wait">
                <WalletWrapper key="wallet" variants={swapTransition} initial="show" exit="hide" animate="show">
                    <Wrapper $listHidden>{walletMarkup}</Wrapper>
                </WalletWrapper>
            </AnimatePresence>
        );
    }

    return (
        <>
            <AnimatePresence mode="wait">
                {isSwapping ? (
                    <SwapsWrapper key="swap" variants={swapTransition} initial="hide" exit="hide" animate="show">
                        <Wrapper $swapsPanel>
                            <Swap />
                            <ExchangesUrls />
                        </Wrapper>
                    </SwapsWrapper>
                ) : (
                    <WalletWrapper key="wallet" variants={swapTransition} initial="show" exit="hide" animate="show">
                        <Wrapper $listHidden={!isStandardWalletUI || isSyncing}>
                            {walletMarkup}
                            <BuyTariButton onClick={() => setIsSwapping(true)}>
                                <span>{`${t('swap.buy-tari')} (XTM)`}</span>
                            </BuyTariButton>
                        </Wrapper>
                    </WalletWrapper>
                )}
            </AnimatePresence>
            {selectedTransactionDetails && (
                <TransactionDetails
                    transaction={selectedTransactionDetails}
                    expanded={Boolean(selectedTransactionDetails)}
                    handleClose={() => setDetailsItemTransaction(null)}
                />
            )}
        </>
    );
}
