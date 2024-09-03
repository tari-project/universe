import { VisualModeContainer } from '../styles';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

function TelemetryMode() {
    const telemetryMode = useUIStore((s) => s.telemetryMode);
    const toggleTelemetryMode = useUIStore((s) => s.toggleTelemetryMode);

    const canvasElement = document.getElementById('canvas');

    const handleSwitch = useCallback(() => {
        if (canvasElement) {
            canvasElement.style.display = telemetryMode ? 'none' : 'block';
        }
        toggleTelemetryMode();
        invoke('set_telemetry_mode', { telemetryMode: !telemetryMode });
    }, [canvasElement, toggleTelemetryMode, telemetryMode]);

    return (
        <VisualModeContainer>
            <ToggleSwitch
                label="Telemetry collection"
                checked={telemetryMode}
                onChange={handleSwitch}
                variant="gradient"
                aria-label="primary checkbox"
            />
        </VisualModeContainer>
    );
}

export default TelemetryMode;
