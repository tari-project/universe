import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { Wrapper } from './styles';
import { useConfigMiningStore } from '@app/store/useAppConfigStore';
import { formatHashrate } from '@app/utils';
import { useMiningStore } from '@app/store';
import Tile from './components/Tile/Tile';

export default function MiningTiles() {
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

    return (
        <Wrapper>
            <Tile
                title={`CPU`}
                isLoading={isCpuMiningEnabled && (isCpuLoading || isWaitingForCPUHashRate)}
                isMining={isCpuMiningEnabled && cpu_is_mining}
                pillValue={isCpuMiningEnabled && cpu_is_mining ? formatHashrate(cpu_hash_rate, false) : '-'}
                pillUnit="kH/s"
                mainNumber={1.75}
                mainUnit="XTM"
                mainLabel={`Rewards In Progress`}
            />
            <Tile
                title={`GPU`}
                isLoading={isGpuMiningEnabled && (isGpuLoading || isWaitingForGPUHashRate)}
                isMining={isGpuMiningEnabled && gpu_is_mining}
                pillValue={isGpuMiningEnabled && gpu_is_mining ? formatHashrate(gpu_hash_rate, false) : '-'}
                pillUnit="kH/s"
                mainNumber={18.7}
                mainUnit="KH/s"
                mainLabel={`GPU Power`}
            />
        </Wrapper>
    );
}
