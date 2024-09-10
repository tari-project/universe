import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { MinerContainer } from '../../../Miner/styles';
import { useTranslation } from 'react-i18next';

const CpuMiningSettings = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const { isCpuMiningEnabled, isGpuMiningEnabled } = useAppStatusStore(
        useShallow((s) => ({
            isCpuMiningEnabled: s.cpu_mining_enabled,
            isGpuMiningEnabled: s.gpu_mining_enabled,
        }))
    );

    const miningAllowed = useAppStateStore(useShallow((s) => s.setupProgress >= 1));
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const miningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const isMiningInProgress = isCPUMining || isGPUMining;
    const miningLoading = (miningInitiated && !isMiningInProgress) || (!miningInitiated && isMiningInProgress);

    const handleCpuMiningEnabled = useCallback(async () => {
        await invoke('set_cpu_mining_enabled', { enabled: !isCpuMiningEnabled });
    }, [isCpuMiningEnabled]);

    const toggleDisabledBase = !miningAllowed || miningLoading;
    const cpuDisabled = isMiningInProgress && isCpuMiningEnabled && !isGpuMiningEnabled;

    return (
        <MinerContainer>
            <Typography variant="h6">{t('cpu-mining-enabled', { ns: 'settings' })}</Typography>
            <ToggleSwitch
                checked={isCpuMiningEnabled}
                disabled={toggleDisabledBase || cpuDisabled}
                onChange={handleCpuMiningEnabled}
            />
        </MinerContainer>
    );
};

export default CpuMiningSettings;
