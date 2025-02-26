import { memo } from 'react';

import AirdropGiftTracker from '@app/containers/main/Airdrop/AirdropGiftTracker/AirdropGiftTracker.tsx';
import OrphanChainAlert from './components/OrphanChainAlert/OrphanChainAlert.tsx';
import LostConnectionAlert from './components/LostConnectionAlert.tsx';
import MiningButton from './components/MiningButton/MiningButton.tsx';
import Wallet from './components/Wallet/Wallet.tsx';
import Heading from './components/Heading.tsx';
import Miner from './components/Miner/Miner.tsx';

import { GridAreaBottom, GridAreaTop, SidebarGrid } from './Sidebar.styles.ts';

const Sidebar = memo(function Sidebar() {
    return (
        <SidebarGrid>
            <GridAreaTop>
                <Heading />
                <MiningButton />
                <LostConnectionAlert />
                <OrphanChainAlert />
                <Miner />
            </GridAreaTop>
            <GridAreaBottom>
                <AirdropGiftTracker />
                <Wallet />
            </GridAreaBottom>
        </SidebarGrid>
    );
});

export default Sidebar;
