import { memo } from 'react';

import { SidebarWrapper } from '../SidebarNavigation.styles.ts';
import { SidebarGrid } from './SidebarWallet.styles.ts';

import { WalletSidebarContent } from '@app/components/transactions';

const SidebarWallet = memo(function SidebarWallet() {
    return (
        <SidebarWrapper key="sidebar_wallet">
            <SidebarGrid>
                <WalletSidebarContent />
            </SidebarGrid>
        </SidebarWrapper>
    );
});

export default SidebarWallet;
