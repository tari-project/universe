import './theme/theme.css';
import { CSSProperties, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
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
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from './types.ts';
import useAppStateStore from './store/appStateStore.ts';
import { useMining } from './hooks/useMining.ts';

import { useGetApplicatonsVersions } from './hooks/useGetApplicatonsVersions.ts';
import { preload } from './visuals';
import { appBorderRadius } from './theme/tokens.ts';

function App() {
    const background = useUIStore((s) => s.background);
    const view = useUIStore((s) => s.view);
    const setView = useUIStore((s) => s.setView);
    const setBackground = useUIStore((s) => s.setBackground);
    const startupInitiated = useRef(false);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const { startMining, stopMining } = useMining();
    const visualMode = useUIStore((s) => s.visualMode);

    useEffect(() => {
        const unlistenPromise = listen(
            'message',
            ({ event, payload }: TauriEvent) => {
                console.debug('Event:', event, payload);
                switch (payload.event_type) {
                    case 'setup_status':
                        console.debug(
                            'Setup status:',
                            payload.title,
                            payload.progress
                        );
                        setSetupDetails(payload.title, payload.progress);

                        // if (payload.progress >= 0.1) {
                        //     setView('mining');
                        //     setBackground('mining');
                        // }
                        if (payload.progress >= 1) {
                            settingUpFinished();
                            setView('mining');
                            setBackground('mining');
                        }
                        break;
                    case 'user_idle':
                        startMining().then(() => {
                            console.debug('Mining started');
                        });
                        break;
                    case 'user_active':
                        stopMining().then(() => {
                            console.debug('Mining stopped');
                        });
                        break;
                    default:
                        console.debug('Unknown tauri event: ', {
                            event,
                            payload,
                        });
                        break;
                }
            }
        );
        if (!startupInitiated.current) {
            startupInitiated.current = true;
            preload();
            invoke('setup_application').catch((e) => {
                console.error('Failed to setup application:', e);
            });
        }

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

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
        <>
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
        </>
    );
}

export default App;
