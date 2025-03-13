import { memo } from 'react';
import { SidebarGrid } from './SidebarWallet.styles.ts';
import { WalletSidebarContent } from '@app/components/transactions';

const SidebarWallet = memo(function SidebarWallet() {
    return (
        <SidebarGrid>
            <WalletSidebarContent />
        </SidebarGrid>
    );
});

export default SidebarWallet;
