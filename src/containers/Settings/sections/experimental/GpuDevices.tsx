import React, { useCallback } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Stack } from '@app/components/elements/Stack';

const GpuDevices = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isMiningInProgress = isCPUMining || isGPUMining;
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed;
    const excludedDevices = useMiningStore((s) => s.excludedGpuDevices);
    const setExcludedDevice = useMiningStore((s) => s.setExcludedGpuDevice);
    const gpuDevicesList: string[] = ['first gpu device name', 'second gpu device name']; //TODO get list of devices

    const handleSetExcludedDevice = useCallback(
        async (device: number) => {
            if (!excludedDevices.includes(device)) {
                // if device is enabled we want to disabled it, so set to 'excluded list'
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
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('gpu-device-enabled', { ns: 'settings' })}</Typography>
                </SettingsGroupTitle>
                <Typography variant="p">{t('gpu-device-enabled-description', { ns: 'settings' })}</Typography>
                <SettingsGroup>
                    <SettingsGroupContent>
                        {gpuDevicesList.map((device, i) => (
                            <Stack key={device} direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="h6">
                                    {i + 1}. {device}
                                </Typography>
                                <ToggleSwitch
                                    key={device}
                                    checked={!excludedDevices.includes(i)}
                                    disabled={isDisabled}
                                    onChange={() => handleSetExcludedDevice(i)}
                                />
                            </Stack>
                        ))}
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default GpuDevices;
