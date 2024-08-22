import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner/AutoMiner.tsx';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';
import { Divider } from '@mui/material';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useMining } from '@app/hooks/useMining.ts';

function Miner() {
    const { cpu: cpuHardwareStatus } = useHardwareStatus();
    const { isWaitingForHashRate } = useMining();

    const truncateString = (str: string, num: number): string => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const estimated_earnings = useCPUStatusStore((s) => s.estimated_earnings);

    function formatNumber(value: number): string {
        if (value < 0) {
            return value.toPrecision(1);
        } else if (value >= 1_000_000) {
            return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
        } else if (value >= 1_000) {
            return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
        } else {
            return value.toString();
        }
    }

    return (
        <MinerContainer>
            <AutoMiner />
            <Divider />
            <TileContainer>
                <Tile title="Resources" stats="CPU" />
                <ModeSelect />
                <Tile title="Hashrate" stats={hash_rate + ' H/s'} isLoading={isWaitingForHashRate} />
                <Tile title="CPU Utilization" stats={(cpuHardwareStatus?.usage_percentage || 0).toString() + '%'} />
                <Tile title="CHIP/GPU" stats={truncateString(cpuHardwareStatus?.label || 'Unknown', 10)} />
                <Tile title="Est Earnings" stats={formatNumber(estimated_earnings / 1000000) + ' XTM/24h'} />
            </TileContainer>
        </MinerContainer>
    );
}

export default Miner;
