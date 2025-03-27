import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { Background, DashboardContainer } from '@app/theme/styles.ts';
import SidebarNavigation from '@app/containers/navigation/SidebarNavigation.tsx';
import { Dashboard } from './Dashboard';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import Sync from '@app/containers/main/Sync/Sync.tsx';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const isSettingUp = useSetupStore((s) => !s.appUnlocked);
    return (
        <DashboardContainer $disableBackground={isSettingUp}>
            {!visualMode && !isSettingUp && <Background />}
            <SidebarNavigation />
            {isSettingUp ? <Sync /> : <Dashboard />}
        </DashboardContainer>
    );
}
