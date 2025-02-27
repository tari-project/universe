import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { Dashboard } from '@app/containers/main/Dashboard';
import SidebarNavigation from '@app/containers/main/SidebarNavigation/SidebarNavigation.tsx';
import { DashboardContainer } from '@app/theme/styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const view = useUIStore((s) => s.view);

    return (
        <DashboardContainer $visualModeOff={!visualMode}>
            <SidebarNavigation />
            {view === 'mining' ? (
                <Dashboard />
            ) : (
                <div>
                    <h1>{`hello i am a wallet view`}</h1>
                </div>
            )}
        </DashboardContainer>
    );
}
