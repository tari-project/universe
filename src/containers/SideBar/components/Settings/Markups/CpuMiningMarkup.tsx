import { useCallback } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { MinerContainer } from '../../../Miner/styles';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

const CpuMiningSettings = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isCpuMiningEnabled = useAppConfigStore((s) => s.cpu_mining_enabled);
    const setCpuMiningEnabled = useAppConfigStore((s) => s.setCpuMiningEnabled);
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);

    const isMiningInProgress = isCPUMining || isGPUMining;
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed;

    const handleCpuMiningEnabled = useCallback(async () => {
        await setCpuMiningEnabled(!isCpuMiningEnabled);
    }, [isCpuMiningEnabled, setCpuMiningEnabled]);

    return (
        <MinerContainer>
            <Typography variant="h6">{t('cpu-mining-enabled', { ns: 'settings' })}</Typography>
            <ToggleSwitch checked={isCpuMiningEnabled} disabled={isDisabled} onChange={handleCpuMiningEnabled} />
        </MinerContainer>
    );
};

export default CpuMiningSettings;
