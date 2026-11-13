import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import MinerTile from './Miner';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';
import { useSetupStore } from '@app/store/useSetupStore';
import { getSelectedMiner } from '@app/store/selectors/miningStoreSelectors';

export default function GPUTile() {
    const unpaid = useMiningPoolsStore((s) => s.gpuPoolStats?.unpaid);
    const minPayout = useMiningPoolsStore((s) => s.gpuPoolStats?.min_payout);
    const rewardValue = useMiningPoolsStore((s) => s.gpuRewards?.rewardValue);
    const unpaidFMT = useMiningPoolsStore((s) => s.gpuRewards?.unpaidFMT);

    const gpuEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const miningInitiated = useMiningStore((s) => s.isGpuMiningInitiated);
    const hash_rate = useMiningMetricsStore((s) => s.gpu_mining_status.hash_rate);
    const is_mining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isGpuPoolEnabled = useConfigPoolsStore((s) => s.gpu_pool_enabled);
    const selectedMinerAlgo = useMiningStore((s) => getSelectedMiner(s)?.supported_algorithms?.[0]);

    const gpuMiningModuleState = useSetupStore(setupStoreSelectors.selectGpuMiningModule);

    return (
        <MinerTile
            title="GPU"
            mainLabelKey="gpu-power"
            enabled={gpuEnabled}
            isMining={is_mining}
            isMiningInitiated={miningInitiated}
            hashRate={hash_rate}
            isPoolEnabled={isGpuPoolEnabled}
            unpaid={unpaid}
            rewardThreshold={minPayout || 2000000}
            showTooltip={true}
            progressDiff={rewardValue}
            unpaidFMT={unpaidFMT || '-'}
            minerModuleState={gpuMiningModuleState}
            algo={selectedMinerAlgo}
        />
    );
}
