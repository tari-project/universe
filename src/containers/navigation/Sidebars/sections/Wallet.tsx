import WalletSidebarContent from '@app/components/transactions/WalletSidebarContent.tsx';
import { useUIStore } from '@app/store';
import WalletDisplay from '@app/components/exchanges/display/WalletDisplay.tsx';

export default function WalletSection() {
    const seedlessUI = useUIStore((s) => s.seedlessUI);
    return seedlessUI ? <WalletDisplay /> : <WalletSidebarContent />;
}
