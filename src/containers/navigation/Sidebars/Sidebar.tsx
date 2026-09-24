import MiningSection from './sections/Mining.tsx';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';
import { SidebarContent, SidebarWrapper, SwapsOverlay } from './Sidebar.styles.ts';
import { useWalletStore } from '@app/store';
import { AnimatePresence } from 'motion/react';

const variants = {
    hidden: { opacity: 0, left: -10 },
    visible: { opacity: 1, left: 0 },
};
export default function Sidebar() {
    const isSwapping = useWalletStore((s) => s.is_swapping);
    return (
        <SidebarWrapper variants={variants} initial="hidden" animate="visible" exit="hidden">
            <AnimatePresence>{isSwapping && <SwapsOverlay />}</AnimatePresence>
            <SidebarContent>
                <MiningSection />
                <WalletSidebarContent />
            </SidebarContent>
        </SidebarWrapper>
    );
}
