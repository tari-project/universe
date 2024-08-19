import './theme/theme.css';
import { StrictMode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from './theme/themes';
import { ContainerInner, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';
import { TitleBar } from './containers/TitleBar';
import { AppBackground } from './containers/AppBackground';
import ErrorSnackbar from './containers/Error/ErrorSnackbar';
import { useUIStore } from './store/useUIStore.ts';
import { useGetStatus } from './hooks/useGetStatus.ts';

import { useGetApplicatonsVersions } from './hooks/useGetApplicatonsVersions.ts';
import { useSetUp } from './hooks/useSetUp.ts';

function App() {
    useSetUp();

    const background = useUIStore((s) => s.background);
    const view = useUIStore((s) => s.view);

    useGetStatus();
    useGetApplicatonsVersions();

    return (
        <>
            <StrictMode>
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
            </StrictMode>
        </>
    );
}

export default App;
