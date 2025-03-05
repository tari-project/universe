import { DashboardContentContainer, VersionWrapper } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import WalletView from './WalletView/WalletView.tsx';
import MiningView from './MiningView/MiningView';
import { useMiningStatesSync } from '@app/hooks';
import VersionChip from '@app/containers/main/SidebarNavigation/components/VersionChip/VersionChip.tsx';

export default function Dashboard() {
    useMiningStatesSync();
    const view = useUIStore((s) => s.view);

    return (
        <DashboardContentContainer>
            <VersionWrapper>
                <VersionChip />
            </VersionWrapper>
            {view === 'mining' ? <MiningView /> : <WalletView />}
        </DashboardContentContainer>
    );
}
