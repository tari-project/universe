import { memo } from 'react';

import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useUIStore } from '@app/store';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';
import WalletDisplay from '@app/components/exchanges/display/WalletDisplay.tsx';
import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';

const Sidebar = memo(function Sidebar() {
    const _swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    const seedlessUI = useUIStore((s) => s.seedlessUI);
    return (
        <SidebarWrapper key="sidebar">
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <GridAreaBottom>{seedlessUI ? <WalletDisplay /> : <WalletSidebarContent />}</GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
});

export default Sidebar;
