import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper, BuyOverlay } from './Sidebar.styles.ts';
import { useWalletStore } from '@app/store';
import { AnimatePresence } from 'motion/react';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';

export default function Sidebar() {
    const isSwapping = useWalletStore((s) => s.is_swapping);

    return (
        <SidebarWrapper
            initial={{
                opacity: 0,
                left: -10,
            }}
            animate={{
                opacity: 1,
                left: 0,
            }}
            exit={{
                opacity: 0,
                left: -10,
            }}
        >
            <AnimatePresence>
                {isSwapping && <BuyOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            </AnimatePresence>
            <WrapperGrid>
                <GridAreaBottom $swapsOpen={isSwapping}>
                    <WalletSidebarContent />
                </GridAreaBottom>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
            </WrapperGrid>
        </SidebarWrapper>
    );
}
