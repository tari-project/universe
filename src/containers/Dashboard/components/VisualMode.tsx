import { useUIStore } from '@app/store/useUIStore.ts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

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

    return <ToggleSwitch label={t('visual-mode')} variant="gradient" checked={visualMode} onChange={handleSwitch} />;
}

export default VisualMode;
