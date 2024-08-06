import './theme/theme.css';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from './theme/themes';
import { ContainerInner, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';
import { TitleBar } from './containers/TitleBar';
import { AppBackground } from './containers/AppBackground';
import useAppStateStore from './store/appStateStore';
import ErrorSnackbar from './containers/Error/ErrorSnackbar';
import { useUIStore } from './store/useUIStore.ts';
import { useGetStatus } from './hooks/useGetStatus.ts';

function App() {
    const background = useUIStore((s) => s.background);
    const view = useUIStore((s) => s.view);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    useEffect(() => {
        invoke('setup_application').then(() => settingUpFinished());
    }, []);

    useGetStatus({ disabled: isSettingUp });

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline enableColorScheme />
            <AppBackground status={background}>
                <DashboardContainer>
                    <TitleBar />
                    <ContainerInner>
                        <SideBar />
                        <Dashboard status={view} />
                    </ContainerInner>
                </DashboardContainer>
            </AppBackground>
            <ErrorSnackbar />
        </ThemeProvider>
    );
}

export default App;
