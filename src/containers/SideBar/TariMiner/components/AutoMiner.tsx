import { FormGroup, Switch, Stack, Typography } from '@mui/material';
import { AutoMinerContainer, ScheduleButton } from '../styles';
import { IoCalendar } from 'react-icons/io5';

function AutoMiner() {
  return (
    <Stack direction="column" spacing={1}>
      <AutoMinerContainer>
        <Stack direction="column" spacing={1}>
          <Typography variant="h5">Auto Miner</Typography>
          <Typography variant="body1">
            Auto miner will turn on your miner when your machine is idle
          </Typography>
        </Stack>
        <FormGroup>
          <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple />
        </FormGroup>
      </AutoMinerContainer>
      <ScheduleButton variant="contained" startIcon={<IoCalendar size="16" />}>
        Setup scheduler
      </ScheduleButton>
    </Stack>
  );
}

export default AutoMiner;
