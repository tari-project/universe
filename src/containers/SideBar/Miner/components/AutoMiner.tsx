import { FormGroup, Switch, Stack, Typography } from '@mui/material';
import { AutoMinerContainer } from '../styles';
import { useIdleTimer } from 'react-idle-timer';
import React from 'react';
import { useUIStore } from '../../../../store/useUIStore.ts';
import { useMining } from '../../../../hooks/useMining.ts';

const checkIfMousePositionsEqual = (a: [number, number], b: [number, number]) => {
  return a[0] === b[0] && a[1] === b[1];
}

function AutoMiner() {
    const isAutoMining = useUIStore((s) => s.isAutoMining);
    const userMousePosition = useUIStore((s) => s.userMousePosition);
    const setBackground = useUIStore((s) => s.setBackground);
    const setIsAutoMining = useUIStore((s) => s.setIsAutoMining);
    const { startMining, stopMining } = useMining();


  const lastMousePosition = React.useRef<[number, number] | null>(null);
  const isTimerRunning = React.useRef(false);

  const enableAutoMining = () => {
    startMining();
    setBackground('mining');
  };
  const disableAutoMining = () => {
    stopMining();
    setBackground('idle');
  };

  const { start,reset } = useIdleTimer({ timeout: 1000 * 30,startManually: true, onIdle: enableAutoMining, events: []});


  React.useEffect(() => {
    if (lastMousePosition.current === null) {
      lastMousePosition.current = userMousePosition;
    }
  }, [userMousePosition]);

  React.useEffect(() => {
    if (lastMousePosition.current === null) return;
    const isMousePositionChanged = !checkIfMousePositionsEqual(userMousePosition, lastMousePosition.current);
    lastMousePosition.current = userMousePosition;

    if (isAutoMining && !isMousePositionChanged && !isTimerRunning.current) {
      start();
      isTimerRunning.current = true;
    } 
    
    if (isMousePositionChanged) {
      reset();
      disableAutoMining();
      isTimerRunning.current = false;
    }
  }, [isAutoMining,userMousePosition]);

  const handleAutoMining = () => {
    if (isAutoMining) {
      setIsAutoMining(false)
      disableAutoMining();
    } else {
      setIsAutoMining(true);
    }
  };


  return (
        <Stack direction="column" spacing={1}>
            <AutoMinerContainer>
                <Stack direction="column" spacing={1}>
                    <Typography variant="h5">Auto Miner</Typography>
                    <Typography variant="body2">
                        Auto miner will turn on your miner when your machine is
                        idle
                    </Typography>
                </Stack>
                <FormGroup>
                    <Switch
                        focusVisibleClassName=".Mui-focusVisible"
                        disableRipple
                        checked={isAutoMining}
                        onChange={handleAutoMining}
                    />
                </FormGroup>
            </AutoMinerContainer>
        </Stack>
      );
}

export default AutoMiner;
