import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { DashboardContainer } from '@app/theme/styles.ts';
import SidebarNavigation from '@app/containers/navigation/SidebarNavigation.tsx';
import { Dashboard } from './Dashboard';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import Sync from '@app/containers/main/Sync/Sync.tsx';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const isSettingUp = useSetupStore((s) => !s.setupComplete);
    return (
        <DashboardContainer $visualModeOff={!visualMode && !isSettingUp}>
            <SidebarNavigation />
            {isSettingUp ? <Sync /> : <Dashboard />}
        </DashboardContainer>
    );
}
