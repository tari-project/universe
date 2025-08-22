import { Background, DashboardContainer, DashboardContent } from '@app/theme/styles.ts';
import SidebarNavigation from '@app/containers/navigation/SidebarNavigation.tsx';
import { Dashboard } from './Dashboard';
import { useConfigUIStore } from '@app/store';

export default function MainView() {
    const visualMode = useConfigUIStore((s) => s.visual_mode);

    return (
        <DashboardContainer>
            {!visualMode && <Background />}
            <DashboardContent>
                <SidebarNavigation />
                <Dashboard />
            </DashboardContent>
        </DashboardContainer>
    );
}
