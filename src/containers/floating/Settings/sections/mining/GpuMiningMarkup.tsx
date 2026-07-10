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
    const isGpuMiningAvailable = useConfigMiningStore((s) => s.gpu_mining_available);
    const gpuMiningUnavailableReason = useConfigMiningStore((s) => s.gpu_mining_unavailable_reason);
    const gpuDevicesHardware = useMiningMetricsStore((s) => s.gpu_devices);
    const gpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isGpuMiningModuleInitialized);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        const currentOs = osType();
        if (currentOs) {
            setIsMac(currentOs === 'macos');
        }
    }, []);

    const hasGpuDevices = useMemo(() => (gpuDevicesHardware?.length ?? 0) !== 0, [gpuDevicesHardware]);

    const handleGpuMiningEnabled = useCallback(async () => {
        await setGpuMiningEnabled(!isGpuMiningEnabled);
    }, [isGpuMiningEnabled]);

    // A GPU the miner has explicitly refused cannot mine, so the toggle is not offered.
    const isDisabled = isMac || !gpuMiningModuleInitialized || !isGpuMiningAvailable;

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
                    {!isMac && !hasGpuDevices && (
                        <Typography variant="p">{t('gpu-unavailable', { ns: 'settings' })}</Typography>
                    )}
                    {!isMac && hasGpuDevices && !isGpuMiningAvailable && (
                        <Typography variant="p">
                            {t('gpu-cannot-mine', {
                                ns: 'settings',
                                reason: gpuMiningUnavailableReason ?? t('gpu-cannot-mine-unknown', { ns: 'settings' }),
                            })}
                        </Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={isGpuMiningEnabled && !isMac && isGpuMiningAvailable}
                        disabled={isDisabled}
                        onChange={handleGpuMiningEnabled}
                        data-testid="settings-toggle-gpu-mining"
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default GpuMiningMarkup;
