import { memo } from 'react';
import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';
import { useUIStore } from '@app/store';
import WalletDisplay from '@app/components/exchanges/display/WalletDisplay.tsx';

const WalletSection = memo(function WalletSection() {
    const seedlessUI = useUIStore((s) => s.seedlessUI);
    return seedlessUI ? <WalletDisplay /> : <WalletSidebarContent />;
});

export default WalletSection;
