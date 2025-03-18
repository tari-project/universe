import { memo } from 'react';
import { WalletSidebarContent } from '@app/components/transactions';
import MiningButton from '../components/MiningButton/MiningButton.tsx';
import LostConnectionAlert from '../components/LostConnectionAlert.tsx';
import OrphanChainAlert from '../components/OrphanChainAlert/OrphanChainAlert.tsx';
import Miner from '../components/Miner/Miner.tsx';
import WalletBalanceMarkup from '../components/Wallet/WalletBalanceMarkup.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';

const Sidebar = memo(function Sidebar() {
    return (
        <SidebarWrapper key="sidebar">
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
        </SidebarWrapper>
    );
});

export default Sidebar;
