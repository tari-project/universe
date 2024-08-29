import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner/AutoMiner.tsx';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';
import { Divider } from '@mui/material';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { formatNumber } from '@app/utils/formatNumber.ts';
import { useTranslation } from 'react-i18next';

function Miner() {
    const { t } = useTranslation('common', { useSuspense: false });

    const { cpu: cpuHardwareStatus } = useHardwareStatus();
    const { isWaitingForHashRate } = useMiningControls();

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const estimated_earnings = useCPUStatusStore((s) => s.estimated_earnings);

    const hardwareValSplit = cpuHardwareStatus?.label?.split(' ');
    const hardwareVal = hardwareValSplit?.[0] + ' ' + hardwareValSplit?.[1];

    const hashRateOver1k = hash_rate > 1000; // TODO: add proper generic number format helper
    const hashRateVal = hashRateOver1k ? hash_rate / 1000 : hash_rate;
    const hashRateStr = hashRateVal
        .toLocaleString(undefined, {
            maximumFractionDigits: 2,
        })
        .replace(/,/g, '.');

    return (
        <MinerContainer>
            <AutoMiner />
            <Divider />
            <TileContainer>
                <Tile title={t('resources')} stats="CPU" />
                <ModeSelect />
                <Tile
                    title={`${t('hashrate')} (H/s)`}
                    stats={`${hashRateStr}${hashRateOver1k ? 'k' : ''}`}
                    isLoading={isWaitingForHashRate}
                />
                <Tile
                    title={`CPU ${t('utilization')}`}
                    stats={
                        (cpuHardwareStatus?.usage_percentage || 0).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                        }) + '%'
                    }
                />
                <Tile title="CHIP/GPU" stats={hardwareVal || t('unknown')} />
                <Tile
                    title="Est tXTM/day"
                    stats={formatNumber(estimated_earnings / 1000000)}
                    isLoading={isWaitingForHashRate}
                />
            </TileContainer>
        </MinerContainer>
    );
}

export default Miner;
