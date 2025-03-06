import { memo } from 'react';

import AirdropGiftTracker from '@app/containers/main/Airdrop/AirdropGiftTracker/AirdropGiftTracker.tsx';
import OrphanChainAlert from '../components/OrphanChainAlert/OrphanChainAlert.tsx';
import LostConnectionAlert from '../components/LostConnectionAlert.tsx';
import MiningButton from '../components/MiningButton/MiningButton.tsx';

import Miner from '../components/Miner/Miner.tsx';

import { GridAreaBottom, GridAreaTop, RewardWrapper, SidebarGrid } from './SidebarMiner.styles.ts';

import { SidebarWrapper } from '../SidebarNavigation.styles.ts';
import HistoryList from '@app/components/transactions/history/HistoryList.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import WalletBalanceMarkup from '@app/containers/main/SidebarNavigation/components/Wallet/WalletBalanceMarkup.tsx';

const SidebarMiner = memo(function Sidebar() {
    return (
        <SidebarWrapper key="sidebar_miner">
            <SidebarGrid>
                <GridAreaTop>
                    <MiningButton />
                    <LostConnectionAlert />
                    <OrphanChainAlert />
                    <Miner />
                </GridAreaTop>
                <GridAreaBottom>
                    <AirdropGiftTracker />
                    <RewardWrapper>
                        <WalletBalanceMarkup />
                        <Typography variant="p">{`My rewards`}</Typography>
                        <HistoryList winsOnly />
                    </RewardWrapper>
                </GridAreaBottom>
            </SidebarGrid>
        </SidebarWrapper>
    );
});

export default SidebarMiner;
