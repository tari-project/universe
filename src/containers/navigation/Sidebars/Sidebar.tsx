import { memo } from 'react';

import WalletSection from './sections/Wallet.tsx';
import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

const Sidebar = memo(function Sidebar() {
    const isSwapping = useWalletStore((s) => s.is_swapping);
    return (
        <SidebarWrapper key="sidebar">
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <GridAreaBottom $overflowVisible={isSwapping}>
                    <WalletSection />
                </GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
});

export default Sidebar;
