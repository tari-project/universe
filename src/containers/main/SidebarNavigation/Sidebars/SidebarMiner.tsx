import { memo } from 'react';

import AirdropGiftTracker from '@app/containers/main/Airdrop/AirdropGiftTracker/AirdropGiftTracker.tsx';
import OrphanChainAlert from '../components/OrphanChainAlert/OrphanChainAlert.tsx';
import LostConnectionAlert from '../components/LostConnectionAlert.tsx';
import MiningButton from '../components/MiningButton/MiningButton.tsx';
import Wallet from '../components/Wallet/Wallet.tsx';
import Heading from '../components/Heading.tsx';
import Miner from '../components/Miner/Miner.tsx';

import { GridAreaBottom, GridAreaTop, SidebarGrid, WalletSpacer } from './SidebarMiner.styles.ts';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { SidebarCover, SidebarWrapper } from '../SidebarNavigation.styles.ts';
import { setShowWalletHistory, useUIStore } from '@app/store/useUIStore.ts';
import { AnimatePresence } from 'motion/react';

const variants = {
    open: { opacity: 1, left: 0, transition: { duration: 0.3, ease: 'easeIn' } },
    closed: { opacity: 0.5, left: -50, transition: { duration: 0.05, ease: 'easeOut' } },
};

const SidebarMiner = memo(function Sidebar() {
    const showSidebarCover = useUIStore((s) => s.showSidebarCover);

    function handleCoverClick() {
        setShowWalletHistory(false);
    }

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
                    <Heading />
                    <MiningButton />
                    <LostConnectionAlert />
                    <OrphanChainAlert />
                    <Miner />
                </GridAreaTop>
                <GridAreaBottom>
                    <AirdropGiftTracker />
                    <WalletSpacer />
                    <Wallet />
                </GridAreaBottom>
            </SidebarGrid>
            <AnimatePresence>
                {showSidebarCover ? (
                    <SidebarCover
                        onClick={handleCoverClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                ) : null}
            </AnimatePresence>
        </SidebarWrapper>
    );
});

export default SidebarMiner;
