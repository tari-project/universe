import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { GridAreaBottom, GridAreaTop, WrapperGrid } from './Sidebar.styles.ts';
import MiningButton from '@app/containers/navigation/components/MiningButton/MiningButton.tsx';
import LostConnectionAlert from '@app/containers/navigation/components/LostConnectionAlert.tsx';
import OrphanChainAlert from '@app/containers/navigation/components/OrphanChainAlert/OrphanChainAlert.tsx';
import Miner from '@app/containers/navigation/components/Miner/Miner.tsx';
import { WalletSidebarContent } from '@app/components/transactions';
import WalletBalanceMarkup from '@app/containers/navigation/components/Wallet/WalletBalanceMarkup.tsx';

const Sidebar = memo(function Sidebar() {
    const { t } = useTranslation('wallet', { useSuspense: false });

    return (
        <WrapperGrid>
            <GridAreaTop>
                <MiningButton />
                <LostConnectionAlert />
                <OrphanChainAlert />
                <Miner />
            </GridAreaTop>
            <GridAreaBottom>
                <WalletBalanceMarkup />
                <WalletSidebarContent />
            </GridAreaBottom>
        </WrapperGrid>
    );
});

export default Sidebar;
