import { DashboardContentContainer } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import WalletView from './WalletView/WalletView.tsx';
import MiningView from './MiningView/MiningView';
import { useMiningStatesSync } from '@app/hooks';

export default function Dashboard() {
    useMiningStatesSync();
    const view = useUIStore((s) => s.view);

    return <DashboardContentContainer>{view === 'mining' ? <MiningView /> : <WalletView />}</DashboardContentContainer>;
}
