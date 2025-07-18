import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';

import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import MinerTile from './Miner.tsx';

export default function CPUTile() {
    const miningInitiated = useMiningStore((s) => s.isCpuMiningInitiated);
    const cpuEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const cpu_mining_status = useMiningMetricsStore((s) => s.cpu_mining_status);
    const isCpuPoolEnabled = useConfigPoolsStore((s) => s.cpu_pool_enabled);
    const cpuPoolStats = useMiningPoolsStore((s) => s.cpuPoolStats);
    const { hash_rate, is_mining } = cpu_mining_status;

    return (
        <MinerTile
            title="CPU"
            mainLabelKey="cpu-power"
            enabled={cpuEnabled}
            isMining={is_mining}
            isMiningInitiated={miningInitiated}
            hashRate={hash_rate}
            isPoolEnabled={isCpuPoolEnabled}
            poolStats={cpuPoolStats}
            rewardThreshold={cpuPoolStats?.min_payout || 2000000} // 2.0 XTM in micro units
            showTooltip={true}
        />
    );
}
