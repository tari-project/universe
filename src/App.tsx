import './theme/theme.css';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
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
import { AppStatus } from './types/app-status.ts';
import { useAppStatusStore } from './store/useAppStatusStore.ts';

function App() {
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const { view, background, setWallet, setError } = useAppStateStore(
        (state) => ({
            view: state.view,
            background: state.background,
            setWallet: state.setWallet,
            setError: state.setError,
        })
    );

    useEffect(() => {
        invoke('init', {}).catch((e) => {
            console.error('Could not init', e);
            setError(e.toString());
        });
        const unlistenPromise = listen('message', (event) => {
            console.log('some kind of event', event.event, event.payload);
        });

        const intervalId = setInterval(() => {
            invoke<AppStatus>('status', {})
                .then((status: AppStatus) => {
                    console.log('Status', status);

                    if (status) {
                        setAppStatus(status);

                        setWallet({
                            balance:
                                (status.wallet_balance?.available_balance ||
                                    0) +
                                (status.wallet_balance?.timelocked_balance ||
                                    0) +
                                (status.wallet_balance
                                    ?.pending_incoming_balance || 0),
                        });
                    }
                })
                .catch((e) => {
                    console.error('Could not get status', e);
                    setError(e.toString());
                });
        }, 10000);
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
            clearInterval(intervalId);
        };
    }, []);

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
