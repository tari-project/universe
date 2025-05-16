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
import HistoryList from '../history/HistoryList.tsx';
import WalletBalanceMarkup from '@app/containers/navigation/components/Wallet/WalletBalanceMarkup.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useCopyToClipboard } from '@app/hooks/index.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { SendSVG } from '@app/assets/icons/send.tsx';
import { ReceiveSVG } from '@app/assets/icons/receive.tsx';
import { useAirdropStore, useConfigCoreStore, usePaperWalletStore } from '@app/store';
import { Button } from '@app/components/elements/buttons/Button';
import SyncTooltip from '@app/containers/navigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';
import { BuyTariButton, SyncButton, TabsTitle, Wrapper, TabsWrapper } from './wallet.styles.ts';
import { memo, useMemo, useState } from 'react';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import ArrowRight from './ArrowRight.tsx';
import { Swap } from './Swap/Swap.tsx';
import { AnimatePresence, m } from 'motion/react';

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
    const swapUiEnabled = useConfigCoreStore((s) => s.swaps_enabled);

    const [swapUiVisible, setSwapUiVisible] = useState(false);

    const { isWalletScanning, formattedAvailableBalance } = useTariBalance();

    const memoSwap = useMemo(() => {
        return <Swap setSwapUiVisible={setSwapUiVisible} />;
    }, []);

    const memoWallet = useMemo(() => {
        return (
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
                    <TabsWrapper>
                        <TabsTitle>{`${t('history.available-balance')}: ${formattedAvailableBalance} ${t('common:xtm')}`}</TabsTitle>
                        <SyncButton onClick={() => setShowPaperWalletModal(true)}>
                            {t('history.sync-with-phone')} <ArrowRight />
                        </SyncButton>
                    </TabsWrapper>
                )}

                <HistoryList />

                {uiSendRecvEnabled ? (
                    <>
                        {swapUiEnabled ? (
                            <BuyTariButton onClick={() => setSwapUiVisible(true)}>{'Buy Tari (wXTM)'}</BuyTariButton>
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
        );
    }, [
        availableBalance,
        copyToClipboard,
        displayAddress,
        formattedAvailableBalance,
        isCopied,
        isWalletScanning,
        section,
        setSection,
        setShowPaperWalletModal,
        swapUiEnabled,
        t,
        uiSendRecvEnabled,
        walletAddress,
    ]);

    const wrapperProps = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.2, ease: 'easeInOut' },
        style: { width: '100%', maxHeight: '100%' },
    };

    return (
        <AnimatePresence mode="wait">
            {swapUiVisible && swapUiEnabled ? (
                <m.div {...wrapperProps} key="swap">
                    {memoSwap}
                </m.div>
            ) : (
                <m.div {...wrapperProps} key="wallet">
                    {memoWallet}
                </m.div>
            )}
        </AnimatePresence>
    );
});

export default Wallet;
