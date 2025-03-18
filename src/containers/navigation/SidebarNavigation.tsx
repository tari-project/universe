import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SidebarGrid, SidebarNavigationWrapper, SidebarWrapper } from './SidebarNavigation.styles.ts';
import Sidebar from './Sidebars/Sidebar.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <SidebarGrid>
                <AnimatePresence>
                    {sidebarOpen && (
                        <SidebarWrapper key="sidebar">
                            <Sidebar />
                        </SidebarWrapper>
                    )}
                </AnimatePresence>
            </SidebarGrid>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
