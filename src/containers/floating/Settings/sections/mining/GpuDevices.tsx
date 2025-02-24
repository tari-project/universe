import { useCallback, useState } from 'react';
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

const GpuDevices = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const miningAllowed = useAppStateStore((s) => s.setupComplete);
    const gpuDevices = useMiningMetricsStore((s) => s.gpu_devices);

    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const excludedDevices = useMiningStore((s) => s.excludedGpuDevices);
    const setExcludedDevice = useMiningStore((s) => s.setExcludedGpuDevice);

    const handleSetExcludedDevice = useCallback(
        async (device: number) => {
            setIsLoading(true);
            if (!excludedDevices.includes(device)) {
                excludedDevices.push(device);
                await setExcludedDevice([...excludedDevices]);
            } else {
                excludedDevices.splice(excludedDevices.indexOf(device), 1);
                await setExcludedDevice([...excludedDevices]);
            }
            setIsLoading(false);
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
                        {(gpuDevices || []).length > 0 ? (
                            gpuDevices.map((device, i) => (
                                <Stack
                                    key={device.name}
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Typography variant="h6">
                                        {i + 1}. {device.name}
                                    </Typography>
                                    <ToggleSwitch
                                        key={device.name}
                                        checked={!excludedDevices.includes(i)}
                                        disabled={isLoading || !miningAllowed || !isGpuMiningEnabled}
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
