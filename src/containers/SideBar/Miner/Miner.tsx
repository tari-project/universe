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
import { useShallow } from 'zustand/react/shallow';
import { LayoutGroup } from 'framer-motion';

export default function Miner() {
    const { cpu: cpuHardwareStatus, gpu: gpuHardwareStatus } = useHardwareStatus();
    const miningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const { isCpuMiningEnabled, isGpuMiningEnabled } = useAppStatusStore(
        useShallow((s) => ({
            isCpuMiningEnabled: s.cpu_mining_enabled,
            isGpuMiningEnabled: s.gpu_mining_enabled,
        }))
    );
    const { cpu_estimated_earnings, cpu_hash_rate, cpu_is_mining } = useCPUStatusStore(
        useShallow((s) => ({
            cpu_estimated_earnings: s.estimated_earnings,
            cpu_hash_rate: s.hash_rate,
            cpu_is_mining: s.is_mining,
        }))
    );
    const { gpu_estimated_earnings, gpu_hash_rate, gpu_is_mining } = useGPUStatusStore(
        useShallow((s) => ({
            gpu_estimated_earnings: s.estimated_earnings,
            gpu_hash_rate: s.hash_rate,
            gpu_is_mining: s.is_mining,
        }))
    );

    const isMiningInProgress = cpu_is_mining || gpu_is_mining;

    const isLoading = (miningInitiated && !isMiningInProgress) || (isMiningInProgress && !miningInitiated);
    const isWaitingForCPUHashRate = isMiningInProgress && cpu_hash_rate <= 0;
    const isWaitingForGPUHashRate = isMiningInProgress && gpu_hash_rate <= 0;

    const totalEarnings = cpu_estimated_earnings + gpu_estimated_earnings;
    const earningsLoading = totalEarnings <= 0 && (isWaitingForCPUHashRate || isWaitingForGPUHashRate);

    return (
        <MinerContainer layout>
            <TileContainer layout>
                <LayoutGroup id="miner-stat-tiles">
                    <Tile
                        title="CPU Power"
                        stats={isCpuMiningEnabled && isMiningInProgress ? formatNumber(cpu_hash_rate) : '-'}
                        isLoading={isLoading || (isCpuMiningEnabled && isWaitingForCPUHashRate)}
                        chipValue={cpuHardwareStatus?.usage_percentage}
                        unit="H/s"
                        useLowerCase
                    />
                    <Tile
                        title="GPU Power"
                        stats={isGpuMiningEnabled && isMiningInProgress ? formatNumber(gpu_hash_rate) : '-'}
                        isLoading={isLoading || (isGpuMiningEnabled && isWaitingForGPUHashRate)}
                        chipValue={gpuHardwareStatus?.usage_percentage}
                        unit="H/s"
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
                                    {isMiningInProgress && isCpuMiningEnabled
                                        ? formatBalance(cpu_estimated_earnings)
                                        : '-'}
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
                                    {isMiningInProgress && isGpuMiningEnabled
                                        ? formatBalance(gpu_estimated_earnings)
                                        : '-'}
                                </Typography>
                                <Unit>
                                    <Typography>tXTM/day</Typography>
                                </Unit>
                            </ExpandableTileItem>
                        </ExpandedContentTile>
                    </ExpandableTile>
                </LayoutGroup>
            </TileContainer>
        </MinerContainer>
    );
}
