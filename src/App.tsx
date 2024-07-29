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

  async function startMining() {
      await invoke("start_mining", { }).then(() => {
          console.log("Mining started")

      }).catch((e) => {
          console.error("Could not start mining", e)
          setError(e);
      });
  }

  async function stopMining() {
        await invoke("stop_mining", { }).then(() => {
            console.log("Mining stopped")

        }).catch((e) => {
            console.error("Could not stop mining", e)
            setError(e);
        });
  }

  const { view, background } = useAppStateStore();
  useEffect(() => {
    const unlistenPromise = listen('message', (event) => {
      console.log('some kind of event', event.event, event.payload);
    });

    const intervalId = setInterval(() => {
      invoke('status', {})
        .then((status) => {
          console.log('Status', status);
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
