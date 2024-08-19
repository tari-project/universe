import { Switch, Typography } from '@mui/material';
import { VisualModeContainer } from '../styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useCallback } from 'react';

function VisualMode() {
    const visualMode = useUIStore((s) => s.visualMode);
    const toggleVisualMode = useUIStore((s) => s.toggleVisualMode);

    const canvasElement = document.getElementById('canvas');

    const handleSwitch = useCallback(() => {
        if (canvasElement) {
            canvasElement.style.display = visualMode ? 'none' : 'block';
        }
        toggleVisualMode();
    }, [canvasElement, toggleVisualMode, visualMode]);

    return (
        <VisualModeContainer>
            <Typography variant="h6">Visual Mode</Typography>
            <Switch
                checked={visualMode}
                onChange={handleSwitch}
                color="primary"
                name="visualMode"
                inputProps={{ 'aria-label': 'primary checkbox' }}
            />
        </VisualModeContainer>
    );
}

export default VisualMode;
