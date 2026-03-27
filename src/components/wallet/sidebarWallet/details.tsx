import { open } from '@tauri-apps/plugin-shell';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import WalletDetails from '@app/components/wallet/components/details/WalletDetails.tsx';
import { useConfigUIStore } from '@app/store';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import { WalletBalance, WalletBalanceHidden } from '@app/components/wallet/components/balance/WalletBalance.tsx';
import FailedModuleAlertButton from '@app/components/dialogs/FailedModuleAlertButton.tsx';
import { AnimatedBG, BottomContent, Content, DetailsCard, WalletErrorWrapper } from './details.styles.ts';
import SyncLoading from '@app/components/wallet/components/loaders/SyncLoading/SyncLoading.tsx';
import { ExternalLink } from '@app/components/transactions/components/StatusList/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ExternalLink2SVG } from '@app/assets/icons/external-link2.tsx';
import SecureWalletWarning from './SecureWalletWarning/SecureWalletWarning.tsx';

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

    async function openLink() {
        if (!xcData?.wallet_app_link) return;
        await open(xcData.wallet_app_link);
    }
    const postLoadedMarkup = !isSyncing && !isWalletModuleFailed && (
        <>
            {xcData?.wallet_app_link && xcData?.wallet_app_label && (
                <ExternalLink onClick={openLink}>
                    <Typography variant="p">{xcData?.wallet_app_label}</Typography>
                    <ExternalLink2SVG />
                </ExternalLink>
            )}
            <SecureWalletWarning $isScrolled={walletScrolled} isExchangeMiner={xcData?.id !== 'universal'} />
        </>
    );

    const baseMarkup = (
        <>
            <AnimatedBG $col1={xcData?.primary_colour || `#0B0A0D`} $col2={xcData?.secondary_colour || `#6F8309`} />
            <Content>
                <WalletDetails />
                <BottomContent>
                    {isStandardWalletUI ? <WalletBalance /> : <WalletBalanceHidden />}
                    {postLoadedMarkup}
                </BottomContent>
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
