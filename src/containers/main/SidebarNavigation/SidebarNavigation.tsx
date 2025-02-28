import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SidebarGrid, SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import SidebarMiner from './Sidebars/SidebarMiner.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import SidebarWallet from '@app/containers/main/SidebarNavigation/Sidebars/SidebarWallet.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const { sidebarOpen, view } = useUIStore((s) => ({
        sidebarOpen: s.sidebarOpen,
        view: s.view,
    }));

    const sidebarMarkup = view === 'mining' ? <SidebarMiner /> : view === 'wallet' ? <SidebarWallet /> : null;
    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <SidebarGrid>
                <AnimatePresence>{sidebarOpen && sidebarMarkup}</AnimatePresence>
            </SidebarGrid>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
