import React, { useMemo } from 'react';
import { FormGroup, Switch, Stack, Typography, Box } from '@mui/material';
import { AutoMinerContainer, AutoMinerProgressBar } from './AutoMiner.styles';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStatusStore } from '@app/store/useAppStatusStore';
import { useMiningControls } from '@app/hooks/mining/useMiningControls';

const calculatePercentageLeftToMine = (userInactivityTimeout: number, currentUserInactivityDuration: number) => {
    return (currentUserInactivityDuration / userInactivityTimeout) * 100;
};

function AutoMiner() {
    const isAutoMining = useAppStatusStore((state) => state.auto_mining);
    const userInactivityTimeout = useAppStatusStore((state) => state.user_inactivity_timeout);
    const currentUserInactivityDuration = useAppStatusStore((state) => state.current_user_inactivity_duration);
    const { shouldAutoMiningControlsBeEnabled } = useMiningControls();

    const handleAutoMining = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_auto_mining', { autoMining: isChecked }).then(() => {
            console.info('Auto mining checked', isChecked);
        });
    };

    const percentage = useMemo(() => {
        if (!isAutoMining) return 0;
        if (!userInactivityTimeout || !currentUserInactivityDuration) return 0;
        return calculatePercentageLeftToMine(userInactivityTimeout, currentUserInactivityDuration);
    }, [userInactivityTimeout, currentUserInactivityDuration, isAutoMining]);

    return (
        <Stack direction="column" spacing={2}>
            <AutoMinerContainer percentage={percentage}>
                <Stack direction="row" gap={1}>
                    <Stack direction="column" spacing={0}>
                        <Typography variant="h6">Auto Miner</Typography>
                        <Typography variant="body2">
                            Auto miner will turn on your miner when your machine is idle
                        </Typography>
                    </Stack>
                    <FormGroup>
                        <Switch
                            focusVisibleClassName=".Mui-focusVisible"
                            disableRipple
                            disabled={!shouldAutoMiningControlsBeEnabled}
                            checked={isAutoMining}
                            onChange={handleAutoMining}
                        />
                    </FormGroup>
                </Stack>
                {isAutoMining && shouldAutoMiningControlsBeEnabled && (
                    <Stack direction="row" alignItems="center" gap={1} width="100%" height="100%">
                        <Typography variant="body2" flex={1}>
                            {currentUserInactivityDuration?.toFixed(2)}s
                        </Typography>
                        <Box flex={5}>
                            <AutoMinerProgressBar variant="determinate" value={percentage} />
                        </Box>
                    </Stack>
                )}
            </AutoMinerContainer>
        </Stack>
    );
}

export default AutoMiner;
