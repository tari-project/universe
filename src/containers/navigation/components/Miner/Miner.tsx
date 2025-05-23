import { useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

import { formatHashrate } from '@app/utils/formatters.ts';

import ModeSelect from './components/ModeSelect.tsx';
import Tile from './components/Tile.tsx';

import { MinerContainer, TileContainer } from './styles.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';
import { PoolStatsTile } from '@app/containers/navigation/components/Miner/components/PoolStatsTile/PoolStatsTile.tsx';

export default function Miner() {
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isCpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);

    const cpu_hash_rate = useMiningMetricsStore((s) => s.cpu_mining_status.hash_rate);
    const cpu_is_mining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);

    const gpu_hash_rate = useMiningMetricsStore((s) => s.gpu_mining_status.hash_rate);
    const gpu_is_mining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMiningInProgress = cpu_is_mining || gpu_is_mining;

    const isWaitingForCPUHashRate = isCpuMiningEnabled && cpu_is_mining && cpu_hash_rate <= 0;
    const isWaitingForGPUHashRate = isGpuMiningEnabled && gpu_is_mining && gpu_hash_rate <= 0;
    const isLoading = (miningInitiated && !isMiningInProgress) || (isMiningInProgress && !miningInitiated);

    return (
        <MinerContainer>
            <TileContainer>
                <Tile
                    title={t('cpu-power')}
                    stats={isCpuMiningEnabled && cpu_is_mining ? formatHashrate(cpu_hash_rate, false) : '-'}
                    isLoading={isCpuMiningEnabled && (isLoading || isWaitingForCPUHashRate)}
                    chipValue={undefined}
                    unit="H/s"
                    useLowerCase
                />
                <Tile
                    title={t('gpu-power')}
                    stats={isGpuMiningEnabled && gpu_is_mining ? formatHashrate(gpu_hash_rate, false) : '-'}
                    isLoading={isGpuMiningEnabled && (isLoading || isWaitingForGPUHashRate)}
                    chipValue={undefined}
                    unit="H/s"
                    useLowerCase
                />
                <ModeSelect />
                <PoolStatsTile />
            </TileContainer>
        </MinerContainer>
    );
}
