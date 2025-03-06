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
} from '../../components/SettingsGroup.styles.ts';
import { Stack } from '@app/components/elements/Stack';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { GpuDevice } from '@app/types/app-status.ts';

const GpuDevices = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const miningAllowed = useAppStateStore((s) => s.setupComplete);
    const gpuDevices = useMiningMetricsStore((s) => s.gpu_devices);

    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const toggleDeviceExclusion = useMiningStore((s) => s.toggleDeviceExclusion);
    const isExcludingGpuDevices = useMiningStore((s) => s.isExcludingGpuDevices);
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed || !isGpuMiningEnabled;
    const handleSetExcludedDevice = useCallback(
        async (device: GpuDevice) => {
            toggleDeviceExclusion(device.device_index, !device.settings.is_excluded);
        },
        [toggleDeviceExclusion]
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
                        {(gpuDevices || []).length > 0 ? (
                            gpuDevices.map((device, i) => (
                                <Stack
                                    key={device.device_index}
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Typography variant="h6">
                                        {i + 1}. {device.device_name}
                                    </Typography>
                                    <ToggleSwitch
                                        key={device.device_index}
                                        checked={!device.settings.is_excluded}
                                        disabled={isDisabled}
                                        onChange={() => handleSetExcludedDevice(device)}
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
