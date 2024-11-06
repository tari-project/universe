import { AppContentContainer } from '@app/App/App.styles';

import { useUIStore } from '@app/store/useUIStore.ts';
import { DashboardContainer } from '@app/theme/styles.ts';
import { Dashboard } from '@app/containers/main/Dashboard';
import SideBar from '@app/containers/main/SideBar/SideBar.tsx';

export default function MainView() {
    const visualMode = useUIStore((s) => s.visualMode);

    return (
        <AppContentContainer key="main" initial="hidden">
            <DashboardContainer $visualModeOff={!visualMode}>
                <SideBar />
                <Dashboard />
            </DashboardContainer>
        </AppContentContainer>
    );
}
