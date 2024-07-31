import { FormGroup, Switch, Stack, Typography } from '@mui/material';
import { AutoMinerContainer } from '../styles';

function AutoMiner() {
  return (
    <Stack direction="column" spacing={1}>
      <AutoMinerContainer>
        <Stack direction="column" spacing={1}>
          <Typography variant="h5">Auto Miner</Typography>
          <Typography variant="body2">
            Auto miner will turn on your miner when your machine is idle
          </Typography>
        </Stack>
        <FormGroup>
          <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple />
        </FormGroup>
      </AutoMinerContainer>
    </Stack>
  );
}

export default AutoMiner;
