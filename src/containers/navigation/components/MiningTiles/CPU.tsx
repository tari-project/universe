import { useTranslation } from 'react-i18next';
import { useConfigMiningStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import { formatHashrate } from '@app/utils';
import Tile from '@app/containers/navigation/components/MiningTiles/components/Tile/Tile.tsx';
import { useMiningTime } from '@app/hooks/mining/useMiningTime.ts';
import { useCPURewards } from '@app/containers/navigation/components/MiningTiles/useCPURewards.ts';

export default function CPUTile() {
    const { t } = useTranslation('p2p');
    const { progressDiff } = useCPURewards();
    const { daysString, hoursString, minutes, seconds } = useMiningTime();

    const miningInitated = useMiningStore((s) => s.isCpuMiningInitiated);
    const cpuEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const cpu_mining_status = useMiningMetricsStore((s) => s.cpu_mining_status);

    const { pool_status, hash_rate, is_mining } = cpu_mining_status;

    const hashrateLoading = cpuEnabled && is_mining && hash_rate <= 0;
    const isLoading = (miningInitated && !is_mining) || (is_mining && !miningInitated) || hashrateLoading;
    const poolStatsLoading = is_mining && !pool_status;

    const formatted = formatHashrate(hash_rate);

    return (
        <>
            <Tile
                title={`CPU`}
                isEnabled={cpuEnabled}
                isLoading={isLoading || poolStatsLoading}
                isMining={is_mining}
                pillValue={formatted.value}
                pillUnit={formatted.unit}
                mainNumber={(pool_status?.unpaid || 0) / 1_000_000}
                mainUnit="XTM"
                successValue={progressDiff}
                mainLabel={t('stats.tile-heading')}
            />
        </>
    );
}
