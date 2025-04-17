import { memo } from 'react';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';

const WalletSection = memo(function WalletSection() {
    return <WalletSidebarContent />;
});

export default WalletSection;
