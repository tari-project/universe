import { useAppConfigStore } from '@app/store/useAppConfigStore';
import SidebarNavigation from '@app/containers/navigation/SidebarNavigation.tsx';
import { Dashboard } from '@app/containers/main/Dashboard';
import { DashboardContainer } from '@app/theme/styles.ts';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    return (
        <DashboardContainer $visualModeOff={!visualMode}>
            <SidebarNavigation />
            <Dashboard />
        </DashboardContainer>
    );
}
