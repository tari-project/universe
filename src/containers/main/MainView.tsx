import { AppContentContainer } from '@app/App/App.styles';

import { DashboardContainer } from '@app/theme/styles.ts';
import { Dashboard } from '@app/containers/main/Dashboard';
import SideBar from '@app/containers/main/SideBar/SideBar.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);

    return (
        <AppContentContainer key="main" initial="hidden">
            <DashboardContainer $visualModeOff={!visualMode}>
                <SideBar />
                <Dashboard />
            </DashboardContainer>
        </AppContentContainer>
    );
}
