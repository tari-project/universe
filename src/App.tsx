import './theme/theme.css';
import { useEffect, useRef } from 'react';
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

function App() {
    const background = useUIStore((s) => s.background);
    const view = useUIStore((s) => s.view);
    const setUserMousePosition = useUIStore((s) => s.setUserMousePosition);
    const setError = useAppStateStore((s) => s.setError);
    const startupInitiated = useRef(false);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);

    useEffect(() => {
        const intervalId = setInterval(() => {
             invoke('check_user_mouse_position')
                .then((response) => {
                    if (response && typeof response === 'object' ) {
                        setUserMousePosition(response as [number,number]);
                    }
                })
                .catch((e) => {
                    console.error('Could not listen to user inactivity', e);
                    setError(e.toString());
                });
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    })

    useEffect(() => {
        const unlistenPromise = listen(
            'message',
            ({ event, payload }: TauriEvent) => {
                console.log('Event:', event, payload);
                switch (payload.event_type) {
                    case 'setup_status':
                        setSetupDetails(payload.title, payload.progress);
                        if (payload.progress >= 1.0) {
                            settingUpFinished();
                        }
                        break;
                    default:
                        console.log('Unknown tauri event: ', {
                            event,
                            payload,
                        });
                        break;
                }
            }
        );
        if (!startupInitiated.current) {
            invoke('setup_application').then((r) => {
                console.log(r);
                startupInitiated.current = true;
            });
        }

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    useGetStatus();

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
