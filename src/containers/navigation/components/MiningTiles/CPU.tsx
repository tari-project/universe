import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';

import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import MinerTile from './Miner.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';
import { MiningAlgorithm } from '@app/types/events-payloads.ts';

export default function CPUTile() {
    const cpuPoolStats = useMiningPoolsStore((s) => s.cpuPoolStats);
    const cpuRewards = useMiningPoolsStore((s) => s.cpuRewards);

    const miningInitiated = useMiningStore((s) => s.isCpuMiningInitiated);
    const cpuEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const hash_rate = useMiningMetricsStore((s) => s.cpu_mining_status.hash_rate);
    const is_mining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isCpuPoolEnabled = useConfigPoolsStore((s) => s.cpu_pool_enabled);

    const cpuMiningModuleState = useSetupStore(setupStoreSelectors.selectCpuMiningModule);

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
            progressDiff={cpuRewards?.rewardValue}
            unpaidFMT={cpuRewards?.unpaidFMT || '-'}
            minerModuleState={cpuMiningModuleState}
            algo={MiningAlgorithm.RandomX}
        />
    );
}
