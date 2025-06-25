import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { Wrapper } from './styles';
import { useConfigMiningStore } from '@app/store/useAppConfigStore';
import { formatHashrate } from '@app/utils';
import { useMiningStore } from '@app/store';
import Tile from './components/Tile/Tile';
import { useTranslation } from 'react-i18next';

export default function MiningTiles() {
    const { t } = useTranslation(['mining-view', 'p2p']);
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);

    const miningCpuInitiated = useMiningStore((s) => s.isCpuMiningInitiated);
    const miningGpuInitiated = useMiningStore((s) => s.isGpuMiningInitiated);
    const isCpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);

    const cpu_hash_rate = useMiningMetricsStore((s) => s.cpu_mining_status.hash_rate);
    const cpu_is_mining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);

    const gpu_hash_rate = useMiningMetricsStore((s) => s.gpu_mining_status.hash_rate);
    const gpu_is_mining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);

    const isMiningInProgress = cpu_is_mining || gpu_is_mining;

    const isWaitingForCPUHashRate = isCpuMiningEnabled && cpu_is_mining && cpu_hash_rate <= 0;
    const isWaitingForGPUHashRate = isGpuMiningEnabled && gpu_is_mining && gpu_hash_rate <= 0;
    const isCpuLoading = (miningCpuInitiated && !isMiningInProgress) || (isMiningInProgress && !miningCpuInitiated);
    const isGpuLoading = (miningGpuInitiated && !isMiningInProgress) || (isMiningInProgress && !miningGpuInitiated);

    const fmtCPU = formatHashrate(cpu_hash_rate, false);
    const fmtGPU = formatHashrate(gpu_hash_rate, false);

    return (
        <Wrapper>
            <Tile
                title={`CPU`}
                isEnabled={isCpuMiningEnabled}
                isLoading={isCpuMiningEnabled && (isCpuLoading || isWaitingForCPUHashRate)}
                isMining={isCpuMiningEnabled && cpu_is_mining}
                pillValue={fmtCPU.value}
                pillUnit={fmtCPU.unit}
                mainNumber={pool_status?.unpaid || 0}
                mainUnit="XTM"
                mainLabel={t('p2p:stats.tile-heading')}
            />
            <Tile
                title={`GPU`}
                isEnabled={isGpuMiningEnabled}
                isLoading={isGpuMiningEnabled && (isGpuLoading || isWaitingForGPUHashRate)}
                isMining={isGpuMiningEnabled && gpu_is_mining}
                pillValue={fmtGPU.value}
                pillUnit={fmtGPU.unit}
                mainNumber={fmtGPU.value}
                mainUnit={fmtGPU.unit}
                mainLabel={t('gpu-power')}
            />
        </Wrapper>
    );
}
