import { memo } from 'react';

import { useAirdropStore } from '@app/store/useAirdropStore.ts';

import MiningSection from './sections/Mining.tsx';
import WalletSection from './sections/Wallet.tsx';

import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';

const Sidebar = memo(function Sidebar() {
    const _swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);

    return (
        <SidebarWrapper key="sidebar">
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <GridAreaBottom>
                    <WalletSection />
                </GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
});

export default Sidebar;
