import { FormGroup, Switch, Stack, Typography } from '@mui/material';
import { AutoMinerContainer } from '../styles';
import { invoke } from '@tauri-apps/api/tauri';

function AutoMiner() {
    const handleAutoMining = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        console.log('Auto mining checked', isChecked);

        if (isChecked) {
            invoke('start_listening_to_user_activity').then(() => {
                console.log('Auto mining stopped');
            });
        }
        if (!isChecked) {
            invoke('stop_listening_to_user_activity').then(() => {
                console.log('Auto mining started');
            });
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
                        // checked={isAutoMining}
                        onChange={handleAutoMining}
                    />
                </FormGroup>
            </AutoMinerContainer>
        </Stack>
    );
}

export default AutoMiner;
