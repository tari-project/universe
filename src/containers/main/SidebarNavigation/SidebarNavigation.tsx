import { memo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SidebarGrid, SidebarNavigationWrapper, SidebarWrapper } from './SidebarNavigation.styles.ts';
import SidebarMiner from './Sidebars/SidebarMiner.tsx';
import SidebarMini from './Sidebars/SidebarMini.tsx';
import SidebarWallet from './Sidebars/SidebarWallet.tsx';

const SidebarNavigation = memo(function SidebarNavigation() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const currentSidebar = useUIStore((s) => s.currentSidebar);

    return (
        <SidebarNavigationWrapper>
            <SidebarMini />
            <SidebarGrid>
                <AnimatePresence>
                    {sidebarOpen && (
                        <SidebarWrapper key="sidebar">
                            {currentSidebar === 'mining' ? <SidebarMiner /> : <SidebarWallet />}
                        </SidebarWrapper>
                    )}
                </AnimatePresence>
            </SidebarGrid>
        </SidebarNavigationWrapper>
    );
});

export default SidebarNavigation;
