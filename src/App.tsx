import { ContainerInner, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';
import { AppBackground } from './containers/AppBackground';
import { useUIStore } from './store/useUIStore.ts';
import { useGetStatus } from './hooks/useGetStatus.ts';
import { useSetUp } from './hooks/useSetUp.ts';
import { useEnvironment } from './hooks/useEnvironment.ts';
import { SplashScreen } from './containers/SplashScreen';
import ThemeProvider from './theme/ThemeProvider.tsx';
import { GlobalReset, GlobalStyle } from '@app/theme/GlobalStyle.ts';
import { useAirdropSyncState } from './hooks/airdrop/useAirdropSyncState.ts';
import AirdropLogin from './containers/Airdrop/AirdropLogin/AirdropLogin.tsx';
import ErrorSnackbar from '@app/containers/Error/ErrorSnackbar.tsx';
import { useShuttingDown } from './hooks/useShuttingDown.ts';
import ShuttingDownScreen from './containers/ShuttingDownScreen/ShuttingDownScreen.tsx';
import AutoUpdateDialog from './containers/AutoUpdateDialog/AutoUpdateDialog.tsx';
import useMining from '@app/hooks/mining/useMining.ts';

import { LayoutGroup } from 'framer-motion';

export default function App() {
    useAirdropSyncState();
    useSetUp();
    useMining();
    useGetStatus();
    useEnvironment();

    const isShuttingDown = useShuttingDown();
    const view = useUIStore((s) => s.view);
    const showSplash = useUIStore((s) => s.showSplash);

    const canRenderMain = !isShuttingDown && !showSplash;
    const splashScreenMarkup = <SplashScreen />;
    const shutDownMarkup = isShuttingDown ? <ShuttingDownScreen /> : null;
    const mainMarkup = canRenderMain ? (
        <DashboardContainer layout>
            <ContainerInner layout>
                <SideBar />
                <AirdropLogin />
                <Dashboard status={view} />
            </ContainerInner>
        </DashboardContainer>
    ) : null;

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <LayoutGroup>
                <AppBackground />
                <AutoUpdateDialog />
                {splashScreenMarkup}
                {shutDownMarkup}
                {mainMarkup}
                <ErrorSnackbar />
            </LayoutGroup>
        </ThemeProvider>
    );
}
