import { useCallback, useMemo } from 'react';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
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

const GpuMiningMarkup = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const gpuDevicesHardware = useMiningMetricsStore((s) => s.gpu_devices);
    const gpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isGpuMiningModuleInitialized);
    const isGpuMiningRecommended = useConfigMiningStore((s) => s.is_gpu_mining_recommended);

    const isGPUMiningAvailable = useMemo(() => {
        if (!gpuDevicesHardware) return false;
        if (gpuDevicesHardware.length === 0) return false;

        return true;
    }, [gpuDevicesHardware]);

    const handleGpuMiningEnabled = useCallback(async () => {
        await setGpuMiningEnabled(!isGpuMiningEnabled);
    }, [isGpuMiningEnabled]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('gpu-mining-enabled')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                    {!isGPUMiningAvailable && (
                        <Typography variant="p">{t('gpu-unavailable', { ns: 'settings' })}</Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={isGpuMiningEnabled}
                        disabled={!gpuMiningModuleInitialized}
                        onChange={handleGpuMiningEnabled}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default GpuMiningMarkup;
