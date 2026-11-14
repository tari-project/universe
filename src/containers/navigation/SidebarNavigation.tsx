import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import Sidebar from './Sidebars/Sidebar.tsx';
import SidebarL2 from './Sidebars/SidebarL2.tsx';
import { useHasL2Access } from '@app/hooks/wallet/useHasL2Access.ts';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';

export default function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const isSwapping = Boolean(useWalletStore((s) => s.is_swapping));
    const l2Open = useUIStore((s) => s.l2Open);
    const l2Supported = useHasL2Access();

    const isFullPage = showTapplet || isSwapping;
    const showSidebar = sidebarOpen && !isFullPage;
    const showL2 = l2Open && l2Supported && !isFullPage;

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{showSidebar && <Sidebar />}</AnimatePresence>
            <AnimatePresence>{showL2 && <SidebarL2 />}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
}
