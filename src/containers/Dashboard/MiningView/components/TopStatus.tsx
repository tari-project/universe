import { useEffect } from 'react';
import { Typography } from '@mui/material';
import useAppStateStore from '../../../../store/appStateStore';
function TopStatus() {
  const { topStatus, setTopStatus, appState } = useAppStateStore((state) => ({
    topStatus: state.topStatus,
    setTopStatus: state.setTopStatus,
    appState: state.appState,
  }));

  useEffect(() => {
    if (appState?.cpu?.is_mining) {
      setTopStatus('Mining');
    } else {
      setTopStatus('Not mining');
    }
  }, [appState?.cpu?.is_mining]);

  return (
    <Typography variant="h5" textTransform="uppercase">
      {topStatus}
    </Typography>
  );
}

export default TopStatus;
