import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner/AutoMiner.tsx';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { formatNumber } from '@app/utils/formatNumber.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

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

    const { cpu: cpuHardwareStatus } = useHardwareStatus();
    const { isWaitingForHashRate, isMiningEnabled, isChangingMode } = useMiningControls();

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const gpu_hash_rate = useGPUStatusStore((s) => s.hash_rate) || 0;
    const estimated_earnings = useCPUStatusStore((s) => s.estimated_earnings);
    const gpu_estimated_earnings = useGPUStatusStore((s) => s.estimated_earnings);

    const hardwareValSplit = cpuHardwareStatus?.label?.split(' ');
    const hardwareVal = hardwareValSplit?.[0] + ' ' + hardwareValSplit?.[1];

    return (
        <MinerContainer>
            <AutoMiner />
            <Divider />
            <TileContainer>
                <ModeSelect />
                <Tile
                    title={`CPU ${t('hashrate')} (H/s)`}
                    stats={formatNumber(hash_rate)}
                    isLoading={isWaitingForHashRate}
                    useLowerCase
                />
                <Tile title="CHIP/GPU" stats={hardwareVal || t('unknown')} />
                <Tile
                    title={`Est tXTM/${t('day')}`}
                    stats={formatNumber(estimated_earnings / 1000000)}
                    isLoading={isWaitingForHashRate}
                    useLowerCase
                />
                <Tile title={`GPU ${t('hashrate')} (H/s)`} stats={formatNumber(gpu_hash_rate)} useLowerCase />
                <Tile
                    title={`GPU Est tXTM/${t('day')}`}
                    stats={formatNumber(gpu_estimated_earnings / 1000000)}
                    useLowerCase
                />
                <AnimatePresence>
                    {isMiningEnabled || isChangingMode ? (
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
