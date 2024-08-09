import './theme/theme.css';
import {useEffect, useRef} from 'react';
import {invoke} from '@tauri-apps/api/tauri';
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import {lightTheme} from './theme/themes';
import {ContainerInner, DashboardContainer} from './theme/styles';
import {SideBar} from './containers/SideBar';
import {Dashboard} from './containers/Dashboard';
import {TitleBar} from './containers/TitleBar';
import {AppBackground} from './containers/AppBackground';
import ErrorSnackbar from './containers/Error/ErrorSnackbar';
import {useUIStore} from './store/useUIStore.ts';
import {useGetStatus} from './hooks/useGetStatus.ts';
import {listen} from '@tauri-apps/api/event';
import {TauriEvent} from './types.ts';
import useAppStateStore from './store/appStateStore.ts';

import {preload} from './visuals.js';

function App() {
    const background = useUIStore((s) => s.background);
    const view = useUIStore((s) => s.view);
    const setView = useUIStore((s) => s.setView);
    const setBackground = useUIStore((s) => s.setBackground);
    const startupInitiated = useRef(false);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const visualMode = useUIStore((s) => s.visualMode);

    useEffect(() => {
        const unlistenPromise = listen(
            'message',
            ({event, payload}: TauriEvent) => {
                console.debug('Event:', event, payload);
                switch (payload.event_type) {
                    case 'setup_status':
                        console.log('Setup status:', payload.title, payload.progress);
                        setSetupDetails(payload.title, payload.progress);

                        if (payload.progress >= 0.1) {
                            setView('mining');
                            setBackground('mining');
                        }
                        if (payload.progress >= 1.0) {
                            settingUpFinished();
                        }
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

    const hideCanvas = !visualMode || view === 'setup';

    return (
        <>
            <canvas id="canvas" className={hideCanvas ? 'hidden' : undefined}/>
            <ThemeProvider theme={lightTheme}>
                <CssBaseline enableColorScheme/>
                <AppBackground status={background}>
                    <DashboardContainer>
                        <TitleBar/>
                        <ContainerInner>
                            <SideBar/>
                            <Dashboard status={view}/>
                        </ContainerInner>
                    </DashboardContainer>
                </AppBackground>
                <ErrorSnackbar/>
            </ThemeProvider>
        </>
    );
}

export default App;
