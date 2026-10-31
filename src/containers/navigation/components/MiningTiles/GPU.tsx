import { useConfigMiningStore, useConfigPoolsStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import MinerTile from './Miner';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';
import { useSetupStore } from '@app/store/useSetupStore';
import { getSelectedMiner } from '@app/store/selectors/miningStoreSelectors';

export default function GPUTile() {
    const gpuPoolStats = useMiningPoolsStore((s) => s.gpuPoolStats);
    const gpuRewards = useMiningPoolsStore((s) => s.gpuRewards);

    const gpuEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const miningInitiated = useMiningStore((s) => s.isGpuMiningInitiated);
    const hash_rate = useMiningMetricsStore((s) => s.gpu_mining_status.hash_rate);
    const is_mining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isGpuPoolEnabled = useConfigPoolsStore((s) => s.gpu_pool_enabled);
    const selectedMiner = useMiningStore(getSelectedMiner);

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
            poolStats={gpuPoolStats}
            rewardThreshold={gpuPoolStats?.min_payout || 2000000}
            showTooltip={true}
            progressDiff={gpuRewards?.rewardValue}
            unpaidFMT={gpuRewards?.unpaidFMT || '-'}
            minerModuleState={gpuMiningModuleState}
            algo={selectedMiner?.supported_algorithms?.[0]}
        />
    );
}
