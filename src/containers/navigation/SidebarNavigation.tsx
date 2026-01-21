import { useUIStore } from '@app/store/useUIStore.ts';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import Sidebar from './Sidebars/Sidebar.tsx';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import { AnimatePresence } from 'motion/react';

export default function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const showTapplet = useUIStore((s) => s.showTapplet);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{sidebarOpen && !showTapplet ? <Sidebar /> : null}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
}
