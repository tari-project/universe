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
import useWalletStore from './store/walletStore';

function App() {
  const {
    view,
    background,
    setHashRate,
    setCpuUsage,
    setAppState,
    setError,
    setCpuBrand,
    setEstimatedEarnings,
    setBlockHeight,
    setBlockTime,
    setIsSynced,
    settingUpFinished,
    setSetupDetails,
  } = useAppStateStore((state) => ({
    view: state.view,
    background: state.background,
    isSettingUp: state.isSettingUp,
    setHashRate: state.setHashRate,
    setCpuUsage: state.setCpuUsage,
    setAppState: state.setAppState,
    setError: state.setError,
    setCpuBrand: state.setCpuBrand,
    setEstimatedEarnings: state.setEstimatedEarnings,
    settingUpFinished: state.settingUpFinished,
    setSetupDetails: state.setSetupDetails,
    setBlockHeight: state.setBlockHeight,
    setBlockTime: state.setBlockTime,
    setIsSynced: state.setIsSynced,
  }));

  const setBalance = useWalletStore((state) => state.setBalance);

  useEffect(() => {
    const unlistenPromise = listen(
      'message',
      ({ event, payload }: TauriEvent) => {
        console.log('some kind of event', event, payload);

        switch (payload.event_type) {
          case 'setup_status':
            setSetupDetails(payload.title, payload.progress);
            break;
          default:
            console.log('Unknown tauri event: ', { event, payload });
            break;
        }
      }
    );

    invoke('setup_application').then(() => settingUpFinished());

    const intervalId = setInterval(() => {
      invoke('status', {})
        .then((status: any) => {
          console.log('Status', status);
          setAppState(status);
          setCpuUsage(status.cpu?.cpu_usage);
          setHashRate(status.cpu?.hash_rate);
          setCpuBrand(status.cpu?.cpu_brand);
          setEstimatedEarnings(status.cpu?.estimated_earnings);
          setBlockHeight(status.base_node?.block_height);
          setBlockTime(status.base_node?.block_time);
          setIsSynced(status.base_node?.is_synced);
          setBalance(
            status.wallet_balance?.available_balance +
              status.wallet_balance?.timelocked_balance +
              status.wallet_balance?.pending_incoming_balance
          );
        })
        .catch((e) => {
          console.error('Could not get status', e);
          setError(e.toString());
        });
    }, 1000);
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
