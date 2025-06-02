import { Background, DashboardContainer, DashboardContent, IframeBackground } from '@app/theme/styles.ts';
import SidebarNavigation from '@app/containers/navigation/SidebarNavigation.tsx';
import { Dashboard } from './Dashboard';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import Sync from '@app/containers/main/Sync/Sync.tsx';
import { useConfigUIStore } from '@app/store';
import { Tapplet } from '@app/components/tapplets/Tapplet';

export default function MainView() {
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const isSettingUp = useSetupStore((s) => !s.appUnlocked);

    return (
        <DashboardContainer $disableBackground={isSettingUp}>
            {!visualMode && !isSettingUp && <Background />}

            <IframeBackground>
                <Tapplet source={'https://d9dec270.tari-dot-com-2025.pages.dev/swaps'} />
            </IframeBackground>

            <DashboardContent>
                <SidebarNavigation />
                {isSettingUp ? <Sync /> : <Dashboard />}
            </DashboardContent>
        </DashboardContainer>
    );
}
