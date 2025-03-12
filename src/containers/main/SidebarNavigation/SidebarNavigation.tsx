import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SidebarGrid, SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import SidebarMiner from './Sidebars/SidebarMiner.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import SidebarWallet from './Sidebars/SidebarWallet.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const currentSidebar = useUIStore((s) => s.currentSidebar);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <SidebarGrid>
                <AnimatePresence mode="wait">
                    {sidebarOpen && currentSidebar === 'mining' && <SidebarMiner />}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    {sidebarOpen && currentSidebar === 'wallet' && <SidebarWallet />}
                </AnimatePresence>
            </SidebarGrid>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
