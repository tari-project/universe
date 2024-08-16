import './theme/theme.css';
import { CSSProperties, StrictMode } from 'react';
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
import { appBorderRadius } from './theme/tokens.ts';
import { useSetUp } from './hooks/useSetUp.ts';

function App() {
    useSetUp();

    const background = useUIStore((s) => s.background);
    const view = useUIStore((s) => s.view);
    const visualMode = useUIStore((s) => s.visualMode);

    useGetStatus();
    useGetApplicatonsVersions();

    const hideCanvas = !visualMode || view === 'setup';
    const canvasStyle: CSSProperties = {
        visibility: hideCanvas ? 'hidden' : 'visible',
        borderRadius: appBorderRadius,
        position: 'absolute',
        zIndex: '0',
    };
    return (
        <StrictMode>
            <canvas id="canvas" style={canvasStyle} />
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
    );
}

export default App;
