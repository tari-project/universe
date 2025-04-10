import { memo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import Sidebar from './Sidebars/Sidebar.tsx';
import { SidebarNavigationWrapper } from './SidebarNavigation.styles.ts';
import { setSidebarOpen } from '@app/store/actions/uiStoreActions';
import { useSetupStore } from '@app/store/useSetupStore.ts';

const SidebarNavigation = memo(function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const isSettingUp = useSetupStore((s) => !s.appUnlocked);

    useEffect(() => {
        if (!isSettingUp) {
            setSidebarOpen(true);
        }
    }, [isSettingUp]);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <AnimatePresence>{sidebarOpen && <Sidebar />}</AnimatePresence>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
