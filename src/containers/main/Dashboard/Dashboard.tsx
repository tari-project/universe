import { DashboardContentContainer } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import WalletView from './WalletView/WalletView.tsx';
import MiningView from './MiningView/MiningView';

export default function Dashboard() {
    const view = useUIStore((s) => s.view);
    return <DashboardContentContainer>{view === 'mining' ? <MiningView /> : <WalletView />}</DashboardContentContainer>;
}
