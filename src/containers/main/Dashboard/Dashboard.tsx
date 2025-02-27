import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import WalletView from '@app/containers/main/Dashboard/WalletView/WalletView.tsx';

export default function Dashboard() {
    const view = useUIStore((s) => s.view);
    return <DashboardContentContainer>{view === 'mining' ? <MiningView /> : <WalletView />}</DashboardContentContainer>;
}
