// import { useUpdateSystemTray } from '@app/hooks';

import { DashboardContainer } from '@app/theme/styles.ts';
import { Dashboard } from '@app/containers/main/Dashboard';
import SideBar from '@app/containers/main/SideBar/SideBar.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export default function MainView() {
    // useUpdateSystemTray();
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    return (
        <DashboardContainer $visualModeOff={!visualMode}>
            <SideBar />
            <Dashboard />
        </DashboardContainer>
    );
}
