import { Switch, Typography } from '@mui/material';
import { VisualModeContainer } from '../styles';
import useAppStateStore from '../../../store/appStateStore';

function VisualMode() {
  const { visualMode, setVisualMode } = useAppStateStore();
  return (
    <VisualModeContainer>
      <Typography variant="h6">Visual Mode</Typography>
      <Switch
        checked={visualMode}
        onChange={() => setVisualMode(!visualMode)}
        color="primary"
        name="visualMode"
        inputProps={{ 'aria-label': 'primary checkbox' }}
      />
    </VisualModeContainer>
  );
}

export default VisualMode;
