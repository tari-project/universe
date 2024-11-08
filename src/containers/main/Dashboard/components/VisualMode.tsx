import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

function VisualMode() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const setVisualMode = useAppConfigStore((s) => s.setVisualMode);
    const { t } = useTranslation('settings', { useSuspense: false });

    const canvasElement = document.getElementById('canvas');

    const handleSwitch = useCallback(() => {
        if (canvasElement) {
            canvasElement.style.display = visualMode ? 'none' : 'block';
        }
        setVisualMode(!visualMode);
    }, [canvasElement, setVisualMode, visualMode]);

    return <ToggleSwitch label={t('visual-mode')} variant="gradient" checked={visualMode} onChange={handleSwitch} />;
}

export default VisualMode;
