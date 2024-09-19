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

const GpuMiningMarkup = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const { isGpuMiningEnabled, setGpuMiningEnabled } = useAppStatusStore(
        useShallow((s) => ({
            isGpuMiningEnabled: s.gpu_mining_enabled,
            setGpuMiningEnabled: s.setGpuMiningEnabled,
        }))
    );

    const miningAllowed = useAppStateStore(useShallow((s) => s.setupProgress >= 1));
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMiningInProgress = isCPUMining || isGPUMining;
    const miningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const miningLoading = (miningInitiated && !isMiningInProgress) || (!miningInitiated && isMiningInProgress);
    const isGPUMiningAvailable = useGPUStatusStore(useShallow((s) => s.is_available));

    const handleGpuMiningEnabled = useCallback(async () => {
        // optimistic rendering
        setGpuMiningEnabled(!isGpuMiningEnabled);
        await invoke('set_gpu_mining_enabled', { enabled: !isGpuMiningEnabled });
    }, [isGpuMiningEnabled, setGpuMiningEnabled]);

    const toggleDisabledBase = !miningAllowed || miningLoading || isMiningInProgress;

    return (
        <MinerContainer>
            <Typography variant="h6">{t('gpu-mining-enabled', { ns: 'settings' })}</Typography>
            <ToggleSwitch
                checked={isGpuMiningEnabled}
                disabled={toggleDisabledBase}
                onChange={handleGpuMiningEnabled}
            />
            {!isGPUMiningAvailable && <Typography variant="p">{t('gpu-unavailable', { ns: 'settings' })}</Typography>}
        </MinerContainer>
    );
};

export default GpuMiningMarkup;
