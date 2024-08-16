import { Switch, Typography } from '@mui/material';
import { VisualModeContainer } from '../styles';
import { useUIStore } from '@app/store/useUIStore.ts';

function VisualMode() {
    const visualMode = useUIStore((s) => s.visualMode);
    const setVisualMode = useUIStore((s) => s.setVisualMode);

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
