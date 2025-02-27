import { memo } from 'react';
import { AnimatePresence } from 'motion/react';

import { setShowWalletHistory, useUIStore } from '@app/store/useUIStore.ts';
import Sidebar from './Sidebars/Sidebar.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import { SidebarCover, SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';

const SidebarNavigation = memo(function SidebarNavigation() {
    const showSidebarCover = useUIStore((s) => s.showSidebarCover);
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    function handleCoverClick() {
        setShowWalletHistory(false);
    }

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{sidebarOpen && <Sidebar />}</AnimatePresence>
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
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
