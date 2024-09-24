import React, { useCallback } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { MinerContainer } from '../../../Miner/styles';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

const P2pMarkup = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isP2poolEnabled = useAppConfigStore((state) => state.p2pool_enabled);
    const setP2poolEnabled = useAppConfigStore((state) => state.setP2poolEnabled);
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const setExcludedDevice = useMiningStore((s) => s.setExcludedGpuDevice);
    const excludedDevice = useMiningStore((s) => s.excludedGpuDevice);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isMiningInProgress = isCPUMining || isGPUMining;
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed;

    const handleP2poolEnabled = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            await setP2poolEnabled(event.target.checked);
        },
        [setP2poolEnabled]
    );

    const handleSetExcludedDevice = useCallback(async () => {
        console.log('set gpu excluded', excludedDevice);
        if (excludedDevice === undefined) {
            await setExcludedDevice(0);
        } else {
            await setExcludedDevice(undefined);
        }
    }, [excludedDevice, setExcludedDevice]);

    return (
        <MinerContainer>
            <Stack>
                <Typography variant="h6">
                    {t('pool-mining', { ns: 'settings' })}
                    <b>&nbsp;(APP RESTART REQUIRED)</b>
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="p">{t('pool-mining-description', { ns: 'settings' })}</Typography>
                    <ToggleSwitch checked={isP2poolEnabled} disabled={isDisabled} onChange={handleP2poolEnabled} />
                </Stack>
            </Stack>
            <Stack>
                <Typography variant="h6">{excludedDevice}</Typography>
                <ToggleSwitch onChange={handleSetExcludedDevice} />
            </Stack>
        </MinerContainer>
    );
};

export default P2pMarkup;
