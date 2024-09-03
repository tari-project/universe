import { useEffect } from 'react';

import { ContainerInner, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';
import { AppBackground } from './containers/AppBackground';
import { useUIStore } from './store/useUIStore.ts';
import { useGetStatus } from './hooks/useGetStatus.ts';
import { useSetUp } from './hooks/useSetUp.ts';
import { useEnvironment } from './hooks/useEnvironment.ts';
import { useAirdropTokensRefresh } from './hooks/airdrop/useAirdropTokensRefresh.ts';
import { SplashScreen } from './containers/SplashScreen';
import ThemeProvider from './theme/ThemeProvider.tsx';
import { GlobalReset, GlobalStyle } from '@app/theme/GlobalStyle.ts';
import { useMiningEffects } from './hooks/mining/useMiningEffects.ts';
import { setupLogger } from './utils/logger.ts';
import ErrorSnackbar from '@app/containers/Error/ErrorSnackbar.tsx';
import { useShuttingDown } from './hooks/useShuttingDown.ts';
import ShuttingDownScreen from './containers/ShuttingDownScreen/ShuttingDownScreen.tsx';

function App() {
    useAirdropTokensRefresh();
    useSetUp();
    useGetStatus();
    useEnvironment();
    useMiningEffects();

    const isShuttingDown = useShuttingDown();
    const view = useUIStore((s) => s.view);
    const showSplash = useUIStore((s) => s.showSplash);

    useEffect(() => {
        setupLogger();
    }, []);

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <AppBackground />
            <SplashScreen />
            {isShuttingDown && <ShuttingDownScreen />}
            {!showSplash && !isShuttingDown && (
                <DashboardContainer>
                    <ContainerInner>
                        <SideBar />
                        <Dashboard status={view} />
                    </ContainerInner>
                </DashboardContainer>
            )}
            <ErrorSnackbar />
        </ThemeProvider>
    );
}

export default App;
