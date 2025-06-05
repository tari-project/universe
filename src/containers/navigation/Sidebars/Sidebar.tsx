import { memo } from 'react';

import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import SidebarWallet from '@app/components/wallet/sidebarWallet/SidebarWallet.tsx';

const Sidebar = memo(function Sidebar() {
    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    return (
        <SidebarWrapper key="sidebar">
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <GridAreaBottom>
                    <SidebarWallet />
                </GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
});

export default Sidebar;
