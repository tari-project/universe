import React from 'react';
import {FormGroup, Stack, Switch, Typography} from '@mui/material';
import {AutoMinerContainer} from '../styles';
import {invoke} from '@tauri-apps/api/tauri';
import {useAppStatusStore} from '@app/store/useAppStatusStore';

function AutoMiner() {
    const isAutoMining = useAppStatusStore((state) => state.auto_mining);

    const handleAutoMining = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_auto_mining', {autoMining: isChecked}).then(() => {
            console.info('Auto mining checked', isChecked);
        });
    };

    return (
        <Stack direction="column" spacing={2}>
            <AutoMinerContainer>
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
                        checked={isAutoMining}
                        onChange={handleAutoMining}

                    />
                </FormGroup>
            </AutoMinerContainer>
        </Stack>
    );
}

export default AutoMiner;
