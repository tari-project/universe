import { useTranslation } from 'react-i18next';
import { useConfigMiningStore, useMiningMetricsStore, useMiningStore } from '@app/store';
import { formatHashrate } from '@app/utils';
import Tile from '@app/containers/navigation/components/MiningTiles/components/Tile/Tile.tsx';

export default function GPUTile() {
    const { t } = useTranslation(['mining-view', 'p2p']);

    const gpuEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const miningInitiated = useMiningStore((s) => s.isGpuMiningInitiated);
    const gpu_mining_status = useMiningMetricsStore((s) => s.gpu_mining_status);

    const { hash_rate, is_mining } = gpu_mining_status;

    const hashrateLoading = gpuEnabled && is_mining && hash_rate <= 0;
    const isLoading = (miningInitiated && !is_mining) || (is_mining && !miningInitiated) || hashrateLoading;

    const fmtGPU = formatHashrate(hash_rate);

    return (
        <Tile
            title={`GPU`}
            isEnabled={gpuEnabled}
            isLoading={isLoading}
            isMining={is_mining}
            pillValue={fmtGPU.value}
            pillUnit={fmtGPU.unit}
            mainNumber={fmtGPU.value} //temporary until we get GPU rewards in progress
            mainUnit={fmtGPU.unit}
            mainLabel={t('gpu-power')}
        />
    );
}
