import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import WalletDetails from '@app/components/wallet/components/details/WalletDetails.tsx';
import { useConfigUIStore } from '@app/store';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import { WalletBalance, WalletBalanceHidden } from '@app/components/wallet/components/balance/WalletBalance.tsx';
import FailedModuleAlertButton from '@app/components/dialogs/FailedModuleAlertButton.tsx';
import { AnimatedBG, BottomContent, Content, DetailsCard, WalletErrorWrapper } from './details.styles.ts';
import SyncLoading from '@app/components/wallet/components/loaders/SyncLoading/SyncLoading.tsx';

interface DetailsProps {
    isWalletModuleFailed?: boolean;
    walletScrolled?: boolean;
    isSyncing?: boolean;
}
export default function SidebarWalletDetails({
    isSyncing = false,
    walletScrolled = false,
    isWalletModuleFailed = false,
}: DetailsProps) {
    const { data: xcData } = useFetchExchangeBranding();
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);

    const baseMarkup = (
        <>
            <AnimatedBG $col1={xcData?.primary_colour || `#0B0A0D`} $col2={xcData?.secondary_colour || `#6F8309`} />
            <Content>
                <WalletDetails />
                <BottomContent>{isStandardWalletUI ? <WalletBalance /> : <WalletBalanceHidden />}</BottomContent>
            </Content>
        </>
    );

    if (isSyncing) {
        return (
            <SyncLoading>
                <DetailsCard $isScrolled={false}>{baseMarkup}</DetailsCard>
            </SyncLoading>
        );
    }

    return (
        <DetailsCard $isScrolled={walletScrolled}>
            {baseMarkup}
            {isWalletModuleFailed && (
                <WalletErrorWrapper>
                    <FailedModuleAlertButton />
                </WalletErrorWrapper>
            )}
        </DetailsCard>
    );
}
