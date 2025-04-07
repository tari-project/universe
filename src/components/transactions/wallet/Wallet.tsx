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
import { HistoryWrapper } from './wallet.style';
import WalletBalanceMarkup from '@app/containers/navigation/components/Wallet/WalletBalanceMarkup.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useCopyToClipboard } from '@app/hooks/index.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { SendSVG } from '@app/assets/icons/send.tsx';
import { ReceiveSVG } from '@app/assets/icons/receive.tsx';

interface Props {
    section: string;
    setSection: (section: string) => void;
}

export default function Wallet({ section, setSection }: Props) {
    const { t } = useTranslation(['wallet', 'common']);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const walletAddress = useWalletStore((state) => state.tari_address_base58);

    const displayAddress = truncateMiddle(walletAddress, 4);

    return (
        <>
            <TabHeader $bordered>
                <HeaderLabel>{t('my_tari')}</HeaderLabel>
                <AddressWrapper>
                    <HeaderLabel>{displayAddress}</HeaderLabel>
                    <StyledIconButton onClick={() => copyToClipboard(walletAddress)}>
                        {!isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />}
                    </StyledIconButton>
                </AddressWrapper>
            </TabHeader>

            <WalletBalanceMarkup />

            <HistoryWrapper>
                <HistoryList />
            </HistoryWrapper>

            <BottomNavWrapper>
                <NavButton
                    onClick={() => setSection('send')}
                    $isActive={section == 'send'}
                    aria-selected={section == 'send'}
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
    );
}
