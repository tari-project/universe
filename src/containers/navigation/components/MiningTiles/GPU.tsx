import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import MinerTile from './Miner';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore';
import { useEffect, useRef } from 'react';

export default function GPUTile() {
    const gpuPoolStats = useMiningPoolsStore((s) => s.gpuPoolStats);
    const gpuRewards = useMiningPoolsStore((s) => s.gpuRewards);

    const statsRef = useRef(gpuPoolStats);
    const rewardsRef = useRef(gpuRewards);

    const gpuEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const miningInitiated = useMiningStore((s) => s.isGpuMiningInitiated);
    const gpu_mining_status = useMiningMetricsStore((s) => s.gpu_mining_status);
    const isGpuPoolEnabled = useConfigPoolsStore((s) => s.gpu_pool_enabled);

    const { hash_rate, is_mining } = gpu_mining_status;

    useEffect(() => useMiningPoolsStore.subscribe((s) => (statsRef.current = s.gpuPoolStats)), []);
    useEffect(() => useMiningPoolsStore.subscribe((s) => (rewardsRef.current = s.gpuRewards)), []);

    return (
        <MinerTile
            title="GPU"
            mainLabelKey="gpu-power"
            enabled={gpuEnabled}
            isMining={is_mining}
            isMiningInitiated={miningInitiated}
            hashRate={hash_rate}
            isPoolEnabled={isGpuPoolEnabled}
            poolStats={statsRef.current}
            rewardThreshold={statsRef.current?.min_payout || 2000000}
            showTooltip={true}
            progressDiff={rewardsRef.current?.rewardValue}
            unpaidFMT={rewardsRef.current?.unpaidFMT || '-'}
        />
    );
}
