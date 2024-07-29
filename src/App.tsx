import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

import CssBaseline from '@mui/material/CssBaseline';
import './theme/theme.css';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from './theme/themes';
import { ContainerInner, DashboardContainer } from './theme/styles';
import { SideBar } from './containers/SideBar';
import { Dashboard } from './containers/Dashboard';
import { TitleBar } from './containers/TitleBar';
import { AppBackground } from './containers/AppBackground';
import useAppStateStore from './store/appStateStore';

function App() {

  const { view, background, setHashRate, setCpuUsage } = useAppStateStore();
  useEffect(() => {
    const unlistenPromise = listen('message', (event) => {
      console.log('some kind of event', event.event, event.payload);
    });

    const intervalId = setInterval(() => {
      invoke('status', {})
        .then((status : any) => {
          console.log('Status', status);

          setCpuUsage(status.cpu?.cpu_usage);
            setHashRate(status.cpu?.hash_rate);
          const logArea = document.getElementById('log-area');
          if (logArea) {
            logArea.innerText = JSON.stringify(status, null, 2);
          }
        })
        .catch((e) => {
          console.error('Could not get status', e);
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
    </ThemeProvider>
  );
}

export default App;
