import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import Sidebar from './Sidebars/Sidebar.tsx';
import SidebarL2 from './Sidebars/SidebarL2.tsx';
import { useMiningStore } from '@app/store';
import { networkSupportsL2 } from '@app/utils/network';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';

export default function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const l2Open = useUIStore((s) => s.l2Open);
    const l2Supported = useMiningStore((s) => networkSupportsL2(s.network));

    const showSidebar = sidebarOpen && !showTapplet;
    const showL2 = l2Open && l2Supported && !showTapplet;

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{showSidebar && <Sidebar />}</AnimatePresence>
            <AnimatePresence>{showL2 && <SidebarL2 />}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
}
