import { useTranslation } from 'react-i18next';
import {
    AddressWrapper,
    BottomNavWrapper,
    HeaderLabel,
    NavButton,
    NavButtonContent,
    StyledIconButton,
    TabHeader,
} from '../components/Tabs/tab.styles.ts';
import HistoryList, { TxHistoryFilter } from '../history/HistoryList.tsx';
import WalletBalanceMarkup from '@app/containers/navigation/components/Wallet/WalletBalanceMarkup.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useCopyToClipboard } from '@app/hooks/index.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { SendSVG } from '@app/assets/icons/send.tsx';
import { ReceiveSVG } from '@app/assets/icons/receive.tsx';
import { useAirdropStore, usePaperWalletStore } from '@app/store';
import { Button } from '@app/components/elements/buttons/Button';
import SyncTooltip from '@app/containers/navigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';
import {
    BuyTariButton,
    SyncButton,
    TabsTitle,
    Wrapper,
    TabsWrapper,
    WalletWrapper,
    SwapsWrapper,
} from './wallet.styles.ts';
import { memo, useState } from 'react';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import ArrowRight from './ArrowRight.tsx';
import { Swap } from './Swap/Swap.tsx';
import { AnimatePresence } from 'motion/react';
import { swapTransition, walletTransition } from './transitions.ts';
import { setIsSwapping } from '@app/store/actions/walletStoreActions.ts';
import { FilterCTA, FilterWrapper } from '@app/components/transactions/history/TxHistory.styles.ts';

const FILTER_TYPES: TxHistoryFilter[] = ['rewards', 'transactions'] as const;

interface Props {
    section: string;
    setSection: (section: string) => void;
}

const Wallet = memo(function Wallet({ section, setSection }: Props) {
    const { t } = useTranslation(['wallet', 'common', 'sidebar']);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const uiSendRecvEnabled = useAirdropStore((s) => s.uiSendRecvEnabled);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const availableBalance = useWalletStore((s) => s.balance?.available_balance);
    const displayAddress = truncateMiddle(walletAddress, 4);
    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    const isSwapping = useWalletStore((s) => s.is_swapping);
    const [filter, setFilter] = useState<TxHistoryFilter>('rewards');

    const { isWalletScanning, formattedAvailableBalance } = useTariBalance();

    function handleFilterChange(newFilter: TxHistoryFilter) {
        setFilter(newFilter);
    }

    return (
        <AnimatePresence mode="wait">
            {isSwapping && swapUiEnabled ? (
                <SwapsWrapper {...swapTransition} key="swap">
                    <Swap />
                </SwapsWrapper>
            ) : (
                <WalletWrapper {...walletTransition} key="wallet">
                    <Wrapper>
                        <TabHeader $noBorder>
                            <HeaderLabel>{t('my_tari')}</HeaderLabel>
                            <AddressWrapper>
                                <HeaderLabel>{displayAddress}</HeaderLabel>
                                <StyledIconButton onClick={() => copyToClipboard(walletAddress)}>
                                    {!isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />}
                                </StyledIconButton>
                            </AddressWrapper>
                        </TabHeader>

                        <WalletBalanceMarkup />

                        {uiSendRecvEnabled && !isWalletScanning && (
                            <>
                                <TabsTitle>{`${t('history.available-balance')}: ${formattedAvailableBalance} ${t('common:xtm')}`}</TabsTitle>

                                <TabsWrapper>
                                    <FilterWrapper>
                                        {FILTER_TYPES.map((type) => (
                                            <FilterCTA
                                                key={type}
                                                $isActive={filter === type}
                                                onClick={() => handleFilterChange(type)}
                                            >
                                                {type}
                                            </FilterCTA>
                                        ))}
                                    </FilterWrapper>
                                    <SyncButton onClick={() => setShowPaperWalletModal(true)}>
                                        {t('history.sync-with-phone')} <ArrowRight />
                                    </SyncButton>
                                </TabsWrapper>
                            </>
                        )}

                        <HistoryList filter={filter} />

                        {uiSendRecvEnabled ? (
                            <>
                                {swapUiEnabled ? (
                                    <BuyTariButton onClick={() => setIsSwapping(true)}>
                                        {'Buy Tari (wXTM)'}
                                    </BuyTariButton>
                                ) : null}
                                <BottomNavWrapper>
                                    <NavButton
                                        onClick={() => setSection('send')}
                                        $isActive={section === 'send'}
                                        aria-selected={section === 'send'}
                                        disabled={isWalletScanning || !availableBalance}
                                    >
                                        <NavButtonContent>
                                            <SendSVG />
                                            {t('tabs.send')}
                                        </NavButtonContent>
                                    </NavButton>
                                    <NavButton
                                        onClick={() => setSection('receive')}
                                        $isActive={section === 'receive'}
                                        aria-selected={section === 'receive'}
                                    >
                                        <NavButtonContent>
                                            <ReceiveSVG />
                                            {t('tabs.receive')}
                                        </NavButtonContent>
                                    </NavButton>
                                </BottomNavWrapper>
                            </>
                        ) : (
                            <BottomNavWrapper>
                                <SyncTooltip
                                    title={t('paper-wallet-tooltip-title', { ns: 'sidebar' })}
                                    text={t('paper-wallet-tooltip-message', { ns: 'sidebar' })}
                                    trigger={
                                        <Button fluid onClick={() => setShowPaperWalletModal(true)}>
                                            {t('paper-wallet-button', { ns: 'sidebar' })}
                                        </Button>
                                    }
                                />
                            </BottomNavWrapper>
                        )}
                    </Wrapper>
                </WalletWrapper>
            )}
        </AnimatePresence>
    );
});

export default Wallet;
