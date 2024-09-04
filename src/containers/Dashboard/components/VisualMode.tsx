import { Switch, Typography } from '@mui/material';
import { VisualModeContainer } from '../styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

function VisualMode() {
    const visualMode = useUIStore((s) => s.visualMode);
    const toggleVisualMode = useUIStore((s) => s.toggleVisualMode);
    const { t } = useTranslation('settings', { useSuspense: false });

    const canvasElement = document.getElementById('canvas');

    const handleSwitch = useCallback(() => {
        if (canvasElement) {
            canvasElement.style.display = visualMode ? 'none' : 'block';
        }
        toggleVisualMode();
    }, [canvasElement, toggleVisualMode, visualMode]);

    return (
        <VisualModeContainer>
            <Typography variant="h6">{t('visual-mode')}</Typography>
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
