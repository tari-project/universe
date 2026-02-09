import { useCallback, useEffect, useMemo, useState } from 'react';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch.tsx';
import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { setGpuMiningEnabled, useConfigMiningStore } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';
import { type as osType } from '@tauri-apps/plugin-os';

const GpuMiningMarkup = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const gpuDevicesHardware = useMiningMetricsStore((s) => s.gpu_devices);
    const gpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isGpuMiningModuleInitialized);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        const currentOs = osType();
        if (currentOs) {
            setIsMac(currentOs === 'macos');
        }
    }, []);

    const isGPUMiningAvailable = useMemo(() => {
        if (!gpuDevicesHardware) return false;
        return gpuDevicesHardware.length !== 0;
    }, [gpuDevicesHardware]);

    const handleGpuMiningEnabled = useCallback(async () => {
        await setGpuMiningEnabled(!isGpuMiningEnabled);
    }, [isGpuMiningEnabled]);

    const isDisabled = isMac || !gpuMiningModuleInitialized;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('gpu-mining-enabled')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                    {isMac && (
                        <Typography variant="p">{t('gpu-not-available-on-macos', { ns: 'settings' })}</Typography>
                    )}
                    {!isMac && !isGPUMiningAvailable && (
                        <Typography variant="p">{t('gpu-unavailable', { ns: 'settings' })}</Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={isGpuMiningEnabled && !isMac}
                        disabled={isDisabled}
                        onChange={handleGpuMiningEnabled}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default GpuMiningMarkup;
