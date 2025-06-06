import { memo } from 'react';

import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper } from './Sidebar.styles.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import SidebarWallet from '@app/components/wallet/sidebarWallet/SidebarWallet.tsx';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';

const Sidebar = memo(function Sidebar() {
    const swapUiEnabled = useAirdropStore((s) => s.swapsEnabled);
    return (
        <SidebarWrapper key="sidebar">
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <GridAreaBottom>
                    <WalletSidebarContent />
                </GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
});

export default Sidebar;
