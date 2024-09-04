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

import ErrorSnackbar from '@app/containers/Error/ErrorSnackbar.tsx';

export default function App() {
    useAirdropTokensRefresh();
    useSetUp();
    useGetStatus();
    useEnvironment();
    useMiningEffects();

    const view = useUIStore((s) => s.view);
    const showSplash = useUIStore((s) => s.showSplash);

    return (
        <ThemeProvider>
            <GlobalReset />
            <GlobalStyle />
            <AppBackground />
            <SplashScreen />
            {!showSplash && (
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
