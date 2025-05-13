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
import { useAirdropStore, usePaperWalletStore } from '@app/store';
import { Button } from '@app/components/elements/buttons/Button';
import SyncTooltip from '@app/containers/navigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';
import { SyncButton, TabsTitle, TabsWrapper, Wrapper } from './wallet.styles.ts';
import { memo } from 'react';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import ArrowRight from './ArrowRight.tsx';

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

    const { isWalletScanning, formattedAvailableBalance } = useTariBalance();

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

            <BottomNavWrapper>
                {uiSendRecvEnabled ? (
                    <>
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
                    </>
                ) : (
                    <SyncTooltip
                        title={t('paper-wallet-tooltip-title', { ns: 'sidebar' })}
                        text={t('paper-wallet-tooltip-message', { ns: 'sidebar' })}
                        trigger={
                            <Button fluid onClick={() => setShowPaperWalletModal(true)}>
                                {t('paper-wallet-button', { ns: 'sidebar' })}
                            </Button>
                        }
                    />
                )}
            </BottomNavWrapper>
        </Wrapper>
    );
});

export default Wallet;
