import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import MinerTile from './Miner';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore';

export default function GPUTile() {
    const gpuEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const miningInitiated = useMiningStore((s) => s.isGpuMiningInitiated);
    const gpu_mining_status = useMiningMetricsStore((s) => s.gpu_mining_status);
    const isGpuPoolEnabled = useConfigPoolsStore((s) => s.gpu_pool_enabled);
    const gpuPoolStats = useMiningPoolsStore((s) => s.gpuPoolStats);
    const { hash_rate, is_mining } = gpu_mining_status;

    return (
        <MinerTile
            title="GPU"
            mainLabelKey="gpu-power"
            enabled={gpuEnabled}
            isMining={is_mining}
            isMiningInitiated={miningInitiated}
            hashRate={hash_rate}
            isPoolEnabled={isGpuPoolEnabled}
            poolStats={gpuPoolStats}
            rewardThreshold={gpuPoolStats?.min_payout || 2.0}
        />
    );
}
