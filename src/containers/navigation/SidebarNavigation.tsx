import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import Sidebar from './Sidebars/Sidebar.tsx';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';

const SidebarNavigation = memo(function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{sidebarOpen && <Sidebar />}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
