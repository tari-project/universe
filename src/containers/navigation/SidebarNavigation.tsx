import { useEffect } from 'react';
import { useUIStore } from '@app/store/useUIStore.ts';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import Sidebar from './Sidebars/Sidebar.tsx';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import { setSidebarOpen } from '@app/store/actions/uiStoreActions';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { AnimatePresence } from 'motion/react';

export default function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const isSettingUp = useSetupStore((s) => !s.appUnlocked);

    useEffect(() => {
        if (!isSettingUp) {
            setSidebarOpen(true);
        }
    }, [isSettingUp]);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{sidebarOpen && !showTapplet && <Sidebar />}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
}
