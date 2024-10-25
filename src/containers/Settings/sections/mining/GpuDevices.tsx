import { useCallback } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Stack } from '@app/components/elements/Stack';
import { useHardwareStats } from '@app/hooks/useHardwareStats';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

const GpuDevices = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const isMiningInProgress = isCPUMining || isGPUMining;
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed || !isGpuMiningEnabled;
    const excludedDevices = useMiningStore((s) => s.excludedGpuDevices);
    const setExcludedDevice = useMiningStore((s) => s.setExcludedGpuDevice);
    const { gpu: gpuHardwareStats } = useHardwareStats();
    const gpuDevicesList: string[] = gpuHardwareStats?.map((gpu) => gpu.label) ?? [];

    const handleSetExcludedDevice = useCallback(
        async (device: number) => {
            if (!excludedDevices.includes(device)) {
                excludedDevices.push(device);
                await setExcludedDevice([...excludedDevices]);
            } else {
                excludedDevices.splice(excludedDevices.indexOf(device), 1);
                await setExcludedDevice([...excludedDevices]);
            }
        },
        [excludedDevices, setExcludedDevice]
    );

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('gpu-device-enabled', { ns: 'settings' })}</Typography>
                        </SettingsGroupTitle>
                        <Typography variant="p">{t('gpu-device-enabled-description', { ns: 'settings' })}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
                <SettingsGroup>
                    <SettingsGroupContent>
                        {gpuDevicesList.length > 0 ? (
                            gpuDevicesList.map((device, i) => (
                                <Stack key={device} direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="h6">
                                        {i + 1}. {device}
                                    </Typography>
                                    <ToggleSwitch
                                        key={device}
                                        checked={!excludedDevices.includes(i) && isGpuMiningEnabled}
                                        disabled={isDisabled}
                                        onChange={() => handleSetExcludedDevice(i)}
                                    />
                                </Stack>
                            ))
                        ) : (
                            <Typography variant="p">{t('gpu-device-no-found', { ns: 'settings' })}</Typography>
                        )}
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default GpuDevices;
