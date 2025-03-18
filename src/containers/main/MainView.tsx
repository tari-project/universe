import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { DashboardContainer } from '@app/theme/styles.ts';
import SidebarNavigation from '@app/containers/navigation/SidebarNavigation.tsx';
import { Dashboard } from './Dashboard';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    return (
        <DashboardContainer $visualModeOff={!visualMode}>
            <SidebarNavigation />
            <Dashboard />
        </DashboardContainer>
    );
}
