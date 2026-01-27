import { useTranslation } from 'react-i18next';
import { setIsSwapping } from '@app/store/actions/walletStoreActions.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import SidebarWalletDetails from '@app/components/wallet/sidebarWallet/details.tsx';
import { useState } from 'react';
import { useConfigUIStore, useNodeStore, useWalletStore } from '@app/store';
import { FilterSelect } from '@app/components/transactions/history/FilterSelect.tsx';
import { WalletWrapper, TabsWrapper } from '@app/components/wallet/sidebarWallet/wallet.styles.ts';
import WalletActions from '@app/components/wallet/components/actions/WalletActions.tsx';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';
import { AppModuleStatus } from '@app/store/types/setup.ts';
import { List } from '@app/components/transactions/history/List.tsx';

interface WalletProps {
    section: string;
    setSection: (section: string) => void;
}

export default function Wallet({ section, setSection }: WalletProps) {
    const { t } = useTranslation('wallet');
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);
    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);
    const isInitialWalletScanning = useWalletStore((s) => !s.wallet_scanning?.is_initial_scan_complete);
    const walletModule = useSetupStore(setupStoreSelectors.selectWalletModule);
    const isWalletModuleFailed = walletModule?.status === AppModuleStatus.Failed;

    const [isScrolled, setIsScrolled] = useState(false);

    const isSyncing = !isConnectedToTariNetwork || isInitialWalletScanning;

    return (
        <WalletWrapper $listHidden={isSyncing || !isStandardWalletUI}>
            <SidebarWalletDetails
                isSyncing={isSyncing}
                walletScrolled={isScrolled}
                isWalletModuleFailed={isWalletModuleFailed}
            />
            <TabsWrapper>
                <FilterSelect />
                {isStandardWalletUI && !isWalletModuleFailed && (
                    <WalletActions section={section} setSection={setSection} />
                )}
            </TabsWrapper>
            <List setIsScrolled={setIsScrolled} scrolled={isScrolled} />
            <Button onClick={() => setIsSwapping(true)} fluid size="large" variant="black">
                <span>{`${t('swap.buy-tari')} (XTM)`}</span>
            </Button>
        </WalletWrapper>
    );
}
