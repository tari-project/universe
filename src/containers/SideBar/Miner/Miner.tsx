import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer, Unit } from './styles.ts';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

import { formatNumber } from '@app/utils/formatNumber.ts';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { ExpandableTile } from '@app/containers/SideBar/Miner/components/ExpandableTile.tsx';
import formatBalance from '@app/utils/formatBalance.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    ExpandableTileItem,
    ExpandedContentTile,
} from '@app/containers/SideBar/Miner/components/ExpandableTile.styles.ts';

export default function Miner() {
    const { cpu: cpuHardwareStatus, gpu: gpuHardwareStatus } = useHardwareStatus();

    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isMiningInProgress = useMiningStore((s) => s.isMiningInProgress);

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const gpu_hash_rate = useGPUStatusStore((s) => s.hash_rate) || 0;

    const estimated_earnings = useCPUStatusStore((s) => s.estimated_earnings);
    const gpu_estimated_earnings = useGPUStatusStore((s) => s.estimated_earnings) || 0;
    //TODO - dedup these states
    const isCpuMiningEnabled = useAppStatusStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppStatusStore((s) => s.gpu_mining_enabled);

    const isWaitingForCPUHashRate = miningInitiated && hash_rate <= 0;
    const isWaitingForGPUHashRate = miningInitiated && gpu_hash_rate <= 0;

    const totalEarnings = estimated_earnings + gpu_estimated_earnings;
    const earningsLoading = totalEarnings <= 0 && (isWaitingForCPUHashRate || isWaitingForGPUHashRate);
    const tileStats = {
        cpu: {
            title: 'CPU Power',
            chipValue: cpuHardwareStatus?.usage_percentage,
            loading: isCpuMiningEnabled && isWaitingForCPUHashRate,
            stats: isCpuMiningEnabled && isMiningInProgress ? formatNumber(hash_rate) : '-',
            unit: 'H/s',
        },
        gpu: {
            title: 'GPU Power',
            chipValue: gpuHardwareStatus?.usage_percentage,
            loading: isGpuMiningEnabled && isWaitingForGPUHashRate,
            stats: isGpuMiningEnabled && isMiningInProgress ? formatNumber(gpu_hash_rate) : '-',
            unit: 'H/s',
        },
    };

    return (
        <MinerContainer>
            <TileContainer>
                <Tile
                    title={tileStats.cpu.title}
                    stats={tileStats.cpu.stats}
                    isLoading={tileStats.cpu.loading}
                    chipValue={tileStats.cpu.chipValue}
                    unit={tileStats.cpu.unit}
                    useLowerCase
                />
                <Tile
                    title={tileStats.gpu.title}
                    stats={tileStats.gpu.stats}
                    isLoading={tileStats.gpu.loading}
                    chipValue={tileStats.gpu.chipValue}
                    unit={tileStats.gpu.unit}
                    useLowerCase
                />
                <ModeSelect />
                <ExpandableTile
                    title="Est tXTM/day"
                    stats={isMiningInProgress && totalEarnings ? formatBalance(totalEarnings) : '-'}
                    isLoading={earningsLoading}
                >
                    <Typography variant="h5" style={{ color: '#000' }}>
                        Estimated earnings
                    </Typography>
                    <Typography>You earn rewards for mining CPU and GPU separately</Typography>
                    <ExpandedContentTile>
                        <Typography>CPU Estimated earnings</Typography>
                        <ExpandableTileItem>
                            <Typography
                                variant="h5"
                                style={{
                                    textTransform: 'lowercase',
                                    fontWeight: 500,
                                    lineHeight: '1.02',
                                }}
                            >
                                {isMiningInProgress && isCpuMiningEnabled ? formatBalance(estimated_earnings) : '-'}
                            </Typography>
                            <Unit>
                                <Typography>tXTM/day</Typography>
                            </Unit>
                        </ExpandableTileItem>
                    </ExpandedContentTile>
                    <ExpandedContentTile>
                        <Typography>GPU Estimated earnings</Typography>
                        <ExpandableTileItem>
                            <Typography
                                variant="h5"
                                style={{
                                    textTransform: 'lowercase',
                                    fontWeight: 500,
                                    lineHeight: '1.02',
                                }}
                            >
                                {isMiningInProgress && isGpuMiningEnabled ? formatBalance(gpu_estimated_earnings) : '-'}
                            </Typography>
                            <Unit>
                                <Typography>tXTM/day</Typography>
                            </Unit>
                        </ExpandableTileItem>
                    </ExpandedContentTile>
                </ExpandableTile>
            </TileContainer>
        </MinerContainer>
    );
}
