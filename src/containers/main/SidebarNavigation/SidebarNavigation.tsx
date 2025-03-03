import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SidebarGrid, SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import SidebarMiner from './Sidebars/SidebarMiner.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import SidebarWallet from './Sidebars/SidebarWallet.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const { sidebarOpen, view } = useUIStore((s) => ({
        sidebarOpen: s.sidebarOpen,
        view: s.view,
    }));

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <SidebarGrid>
                <AnimatePresence>{sidebarOpen && view === 'mining' && <SidebarMiner />}</AnimatePresence>
                <AnimatePresence>{sidebarOpen && view === 'wallet' && <SidebarWallet />}</AnimatePresence>
            </SidebarGrid>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
