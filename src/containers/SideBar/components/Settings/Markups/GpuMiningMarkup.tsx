import { useCallback } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { MinerContainer } from '../../../Miner/styles';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

const GpuMiningMarkup = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const setGpuMiningEnabled = useAppConfigStore((s) => s.setGpuMiningEnabled);
    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isGPUMiningAvailable = useMiningStore((s) => s.gpu.mining.is_available);

    const isMiningInProgress = isCPUMining || isGPUMining;
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed;

    const handleGpuMiningEnabled = useCallback(async () => {
        await setGpuMiningEnabled(!isGpuMiningEnabled);
    }, [isGpuMiningEnabled, setGpuMiningEnabled]);

    return (
        <MinerContainer>
            <Typography variant="h6">{t('gpu-mining-enabled', { ns: 'settings' })}</Typography>
            <ToggleSwitch checked={isGpuMiningEnabled} disabled={isDisabled} onChange={handleGpuMiningEnabled} />
            {!isGPUMiningAvailable && <Typography variant="p">{t('gpu-unavailable', { ns: 'settings' })}</Typography>}
        </MinerContainer>
    );
};

export default GpuMiningMarkup;
