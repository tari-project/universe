import { memo } from 'react';

import WalletSection from './sections/Wallet.tsx';
import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';
import { useConfigCoreStore } from '@app/store/useAppConfigStore.ts';

const Sidebar = memo(function Sidebar() {
    const swapUiEnabled = useConfigCoreStore((s) => s.swaps_enabled);
    return (
        <SidebarWrapper key="sidebar">
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <GridAreaBottom $overflowVisible={swapUiEnabled}>
                    <WalletSection />
                </GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
});

export default Sidebar;
