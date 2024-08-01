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

function App() {
  const { view, background, setHashRate, setCpuUsage, setAppState, setError,
  setCpuBrand, setEstimatedEarnings} =
    useAppStateStore((state) => ({
      view: state.view,
      background: state.background,
      setHashRate: state.setHashRate,
      setCpuUsage: state.setCpuUsage,
      setAppState: state.setAppState,
      setError: state.setError,
        setCpuBrand: state.setCpuBrand,
        setEstimatedEarnings: state.setEstimatedEarnings,
    }));

  useEffect(() => {
    const unlistenPromise = listen('message', (event) => {
      console.log('some kind of event', event.event, event.payload);
    });

    const intervalId = setInterval(() => {
      invoke('status', {})
        .then((status: any) => {
          console.log('Status', status);
          setAppState(status);
          setCpuUsage(status.cpu?.cpu_usage);
          setHashRate(status.cpu?.hash_rate);
          setCpuBrand(status.cpu?.cpu_brand);
          setEstimatedEarnings(status.cpu?.estimated_earnings);
          const logArea = document.getElementById('log-area');
          if (logArea) {
            logArea.innerText = JSON.stringify(status, null, 2);
          }
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
