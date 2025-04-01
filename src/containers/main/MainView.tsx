import { DashboardContainer } from '@app/theme/styles.ts';
import { Dashboard } from '@app/containers/main/Dashboard';
import SideBar from '@app/containers/main/SideBar/SideBar.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useUIStore } from '@app/store';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const isReconnecting = useUIStore((s) => s.isReconnecting);
    const styling = isReconnecting ? { backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' } : {};
    return (
        <DashboardContainer $visualModeOff={!visualMode} style={styling}>
            <SideBar />
            <Dashboard />
        </DashboardContainer>
    );
}
