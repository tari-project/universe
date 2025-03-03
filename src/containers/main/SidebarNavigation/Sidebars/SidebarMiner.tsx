import { memo } from 'react';

import AirdropGiftTracker from '@app/containers/main/Airdrop/AirdropGiftTracker/AirdropGiftTracker.tsx';
import OrphanChainAlert from '../components/OrphanChainAlert/OrphanChainAlert.tsx';
import LostConnectionAlert from '../components/LostConnectionAlert.tsx';
import MiningButton from '../components/MiningButton/MiningButton.tsx';

import Miner from '../components/Miner/Miner.tsx';

import { GridAreaBottom, GridAreaTop, RewardWrapper, SidebarGrid } from './SidebarMiner.styles.ts';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { SidebarWrapper } from '../SidebarNavigation.styles.ts';
import HistoryList from '@app/components/transactions/history/HistoryList.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import WalletBalanceMarkup from '@app/containers/main/SidebarNavigation/components/Wallet/WalletBalanceMarkup.tsx';
import VersionChip from '@app/containers/main/SidebarNavigation/components/VersionChip/VersionChip.tsx';

const variants = {
    open: { opacity: 1, left: 0, transition: { duration: 0.3, ease: 'easeIn' } },
    closed: { opacity: 0.5, left: -50, transition: { duration: 0.05, ease: 'easeOut' } },
};

const SidebarMiner = memo(function Sidebar() {
    return (
        <SidebarWrapper
            style={{ width: SB_WIDTH, gridArea: 'miner' }}
            variants={variants}
            initial="closed"
            exit="closed"
            animate="open"
        >
            <SidebarGrid>
                <GridAreaTop>
                    <VersionChip />
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
