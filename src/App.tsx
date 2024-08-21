import './theme/theme.css';
import { StrictMode } from 'react';
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

function App() {
    useSetUp();
    useGetStatus();

    const view = useUIStore((s) => s.view);

    return (
        <StrictMode>
            <ThemeProvider theme={lightTheme}>
                <CssBaseline enableColorScheme />
                <AppBackground />
                <DashboardContainer>
                    <ContainerInner>
                        <SideBar />
                        <Dashboard status={view} />
                    </ContainerInner>
                </DashboardContainer>
                <ErrorSnackbar />
            </ThemeProvider>
        </StrictMode>
    );
}

export default App;
