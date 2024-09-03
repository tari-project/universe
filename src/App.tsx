import './theme/theme.css';
import { StrictMode, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from './theme/themes';
import { ContainerInner, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';
import { AppBackground } from './containers/AppBackground';
import ErrorSnackbar from './containers/Error/ErrorSnackbar';
import { useUIStore } from './store/useUIStore.ts';
import { useGetStatus } from './hooks/useGetStatus.ts';
import { useSetUp } from './hooks/useSetUp.ts';
import { useEnvironment } from './hooks/useEnvironment.ts';
import { useAirdropTokensRefresh } from './hooks/airdrop/useAirdropTokensRefresh.ts';
import { SplashScreen } from './containers/SplashScreen';
import { useMiningEffects } from './hooks/mining/useMiningEffects.ts';
import { setupLogger } from './utils/logger.ts';
import { listen } from '@tauri-apps/api/event';

function App() {
    useAirdropTokensRefresh();
    useSetUp();
    useGetStatus();
    useEnvironment();
    useMiningEffects();

    const view = useUIStore((s) => s.view);
    const showSplash = useUIStore((s) => s.showSplash);

    useEffect(() => {
        setupLogger();
    }, []);

    listen('tauri://update', () => {
        console.log('Update received');
    });

    listen('tauri://update-available', () => {
        console.log('Update available');
    });

    listen('tauri://update-install', () => {
        console.log('Update install');
    });

    listen('tauri://update-status', (status) => {
        console.log('Update status: ', status);
    });

    listen('tauri://update-download-progress', (progress) => {
        console.log('Update download progress:', progress);
    });

    return (
        <StrictMode>
            <ThemeProvider theme={lightTheme}>
                <CssBaseline enableColorScheme />
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
        </StrictMode>
    );
}

export default App;
