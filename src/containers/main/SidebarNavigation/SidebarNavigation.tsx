import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import Sidebar from './Sidebars/Sidebar.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const { sidebarOpen, view } = useUIStore((s) => ({
        sidebarOpen: s.sidebarOpen,
        view: s.view,
    }));
    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{sidebarOpen && view === 'mining' && <Sidebar />}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
