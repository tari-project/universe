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
    const setExcludedDevice = useMiningStore((s) => s.setExcludedGpuDevice);
    const excludedDevice = useMiningStore((s) => s.excludedGpuDevice);
    const isEnabled = excludedDevice === undefined;
    const gpuDevicesList: string[] = ['first gpu device name', 'second gpu device name'];

    const handleSetExcludedDevice = useCallback(
        async (device: number) => {
            console.log('set gpu excluded', excludedDevice);
            if (excludedDevice === undefined) {
                await setExcludedDevice(device);
            } else {
                await setExcludedDevice(undefined);
            }
        },
        [excludedDevice, setExcludedDevice]
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
                                    checked={isEnabled}
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
