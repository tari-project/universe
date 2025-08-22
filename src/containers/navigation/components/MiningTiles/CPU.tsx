import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';

import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import MinerTile from './Miner.tsx';
import { useEffect, useRef } from 'react';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';

export default function CPUTile() {
    const cpuPoolStats = useMiningPoolsStore((s) => s.cpuPoolStats);
    const cpuRewards = useMiningPoolsStore((s) => s.cpuRewards);

    const statsRef = useRef(cpuPoolStats);
    const rewardsRef = useRef(cpuRewards);

    const miningInitiated = useMiningStore((s) => s.isCpuMiningInitiated);
    const cpuEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const cpu_mining_status = useMiningMetricsStore((s) => s.cpu_mining_status);
    const isCpuPoolEnabled = useConfigPoolsStore((s) => s.cpu_pool_enabled);
    const { hash_rate, is_mining } = cpu_mining_status;

    useEffect(() => useMiningPoolsStore.subscribe((s) => (statsRef.current = s.cpuPoolStats)), []);
    useEffect(() => useMiningPoolsStore.subscribe((s) => (rewardsRef.current = s.cpuRewards)), []);

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
            poolStats={statsRef.current}
            rewardThreshold={statsRef.current?.min_payout || 2000000} // 2.0 XTM in micro units
            showTooltip={true}
            progressDiff={rewardsRef.current?.rewardValue}
            unpaidFMT={rewardsRef.current?.unpaidFMT || '-'}
            minerModuleState={cpuMiningModuleState}
        />
    );
}
