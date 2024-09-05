import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

import { formatNumber } from '@app/utils/formatNumber.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';

const variants = {
    hidden: {
        y: '150%',
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
    },
};
export default function Miner() {
    const { t } = useTranslation('common', { useSuspense: false });

    const { cpu: cpuHardwareStatus, gpu: gpuHardwareStatus } = useHardwareStatus();

    const miningInitiated = useMiningStore((s) => s.miningInitiated);

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const gpu_hash_rate = useGPUStatusStore((s) => s.hash_rate) || 0;

    const isCpuMiningEnabled = useAppStatusStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppStatusStore((s) => s.gpu_mining_enabled);

    const hardwareValSplit = cpuHardwareStatus?.label?.split(' ');
    const hardwareVal = hardwareValSplit?.[0] + ' ' + hardwareValSplit?.[1];

    const isWaitingForCPUHashRate = miningInitiated && hash_rate <= 0;
    const isWaitingForGPUHashRate = miningInitiated && gpu_hash_rate <= 0;

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
                ) : null}{' '}
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
                <AnimatePresence>
                    {isCpuMiningEnabled && miningInitiated && !isWaitingForCPUHashRate ? (
                        <>
                            <motion.div variants={variants} initial="hidden" animate="visible" exit="hidden">
                                <Tile
                                    title={`CPU ${t('utilization')}`}
                                    stats={
                                        (cpuHardwareStatus?.usage_percentage || 0).toLocaleString(undefined, {
                                            maximumFractionDigits: 0,
                                        }) + '%'
                                    }
                                />
                            </motion.div>
                            <motion.div variants={variants} initial="hidden" animate="visible" exit="hidden">
                                <Tile
                                    title={`CPU ${t('temperature')}`}
                                    stats={`${cpuHardwareStatus?.current_temperature || 0}°C`}
                                />
                            </motion.div>
                        </>
                    ) : null}
                </AnimatePresence>
            </TileContainer>
        </MinerContainer>
    );
}
