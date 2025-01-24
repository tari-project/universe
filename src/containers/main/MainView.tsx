import { DashboardContainer } from '@app/theme/styles.ts';
import { Dashboard } from '@app/containers/main/Dashboard';
import SideBar from '@app/containers/main/SideBar/SideBar.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useReleaseNotes } from '../floating/Settings/sections/releaseNotes/useReleaseNotes';

export default function MainView() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);

    useReleaseNotes({ triggerEffect: true });

    return (
        <DashboardContainer $visualModeOff={!visualMode}>
            <SideBar />
            <Dashboard />
        </DashboardContainer>
    );
}
