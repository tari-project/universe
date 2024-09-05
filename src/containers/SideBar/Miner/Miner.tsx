import Tile from './components/Tile.tsx';
import { MinerContainer, StatWrapper, TileContainer } from './styles.ts';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

import { formatNumber } from '@app/utils/formatNumber.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

import { useTranslation } from 'react-i18next';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { ExpandableTile } from '@app/containers/SideBar/Miner/components/ExpandableTile.tsx';
import formatBalance from '@app/utils/formatBalance.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ExpandedContentTile } from '@app/containers/SideBar/Miner/components/ExpandableTile.styles.ts';

export default function Miner() {
    const { t } = useTranslation('common', { useSuspense: false });

    const { cpu: cpuHardwareStatus, gpu: gpuHardwareStatus } = useHardwareStatus();

    const miningInitiated = useMiningStore((s) => s.miningInitiated);

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const gpu_hash_rate = useGPUStatusStore((s) => s.hash_rate) || 0;

    const estimated_earnings = useCPUStatusStore((s) => s.estimated_earnings);
    const gpu_estimated_earnings = useGPUStatusStore((s) => s.estimated_earnings) || 0;

    const isCpuMiningEnabled = useAppStatusStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppStatusStore((s) => s.gpu_mining_enabled);

    const hardwareValSplit = cpuHardwareStatus?.label?.split(' ');
    const hardwareVal = hardwareValSplit?.[0] + ' ' + hardwareValSplit?.[1];

    const isWaitingForCPUHashRate = miningInitiated && hash_rate <= 0;
    const isWaitingForGPUHashRate = miningInitiated && gpu_hash_rate <= 0;

    const totalEarnings = estimated_earnings + gpu_estimated_earnings;

    const tileStats = {
        cpu: {
            title: 'CPU Power',
            chipValue: cpuHardwareStatus?.usage_percentage,
            hidden: !isCpuMiningEnabled,
            loading: isWaitingForCPUHashRate,
            stats: formatNumber(hash_rate),
            unit: 'H/s',
        },
        gpu: {
            title: 'GPU Power',
            chipValue: gpuHardwareStatus?.usage_percentage,
            hidden: !isGpuMiningEnabled,
            loading: isWaitingForGPUHashRate,
            stats: formatNumber(gpu_hash_rate),
            unit: 'H/s',
        },
    };

    return (
        <MinerContainer>
            <Divider />
            <TileContainer>
                <ModeSelect />
                <Tile title="CHIP/GPU" stats={hardwareVal || t('unknown')} />
                {isCpuMiningEnabled ? (
                    <Tile
                        title={tileStats.cpu.title}
                        stats={tileStats.cpu.stats}
                        isLoading={tileStats.cpu.loading}
                        chipValue={tileStats.cpu.chipValue}
                        unit={tileStats.cpu.unit}
                        useLowerCase
                    />
                ) : null}
                {isGpuMiningEnabled ? (
                    <Tile
                        title={tileStats.gpu.title}
                        stats={tileStats.gpu.stats}
                        isLoading={tileStats.gpu.loading}
                        chipValue={tileStats.gpu.chipValue}
                        unit={tileStats.gpu.unit}
                        useLowerCase
                    />
                ) : null}
                <ExpandableTile title="Est tXTM/day" stats={formatBalance(totalEarnings)}>
                    <Typography>You earn rewards for mining CPU and GPU separately</Typography>
                    <ExpandedContentTile>
                        <Typography variant="p">CPU Estimated earnings</Typography>
                        <StatWrapper>
                            <Typography
                                variant="h5"
                                style={{
                                    textTransform: 'lowercase',
                                    lineHeight: '1.02',
                                }}
                            >
                                {formatBalance(estimated_earnings)}
                            </Typography>
                        </StatWrapper>
                    </ExpandedContentTile>
                    <ExpandedContentTile>
                        <Typography variant="p">GPU Estimated earnings</Typography>
                        <StatWrapper>
                            <Typography
                                variant="h5"
                                style={{
                                    textTransform: 'lowercase',
                                    lineHeight: '1.02',
                                }}
                            >
                                {formatBalance(gpu_estimated_earnings)}
                            </Typography>
                        </StatWrapper>
                    </ExpandedContentTile>
                </ExpandableTile>
            </TileContainer>
        </MinerContainer>
    );
}
