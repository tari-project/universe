import { FormGroup, Switch, Stack, Typography } from '@mui/material';
import { AutoMinerContainer } from '../styles';
import { useIdleTimer } from 'react-idle-timer';
import React from 'react';
import { useUIStore } from '../../../../store/useUIStore.ts';
import { useMining } from '../../../../hooks/useMining.ts';

function AutoMiner() {
    const isAutoMining = useUIStore((s) => s.isAutoMining);
    const setBackground = useUIStore((s) => s.setBackground);
    const setIsAutoMining = useUIStore((s) => s.setIsAutoMining);
    const { startMining, stopMining } = useMining();

    const enableAutoMining = () => {
        startMining().then(() => {
            setBackground('mining');
        });
    };
    const disableAutoMining = () => {
        stopMining().then(() => {
            setBackground('idle');
        });
    };

    const { start, pause } = useIdleTimer({
        timeout: 1000 * 30,
        startManually: true,
        onIdle: enableAutoMining,
        onActive: disableAutoMining,
        events: ['mousemove'],
    });

    React.useEffect(() => {
        if (isAutoMining) {
            start();
        } else {
            pause();
        }
    }, [isAutoMining]);

    const handleAutoMining = () => {
        if (isAutoMining) {
            setIsAutoMining(false);
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
