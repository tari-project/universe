import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner.tsx';

import ModeSelect from './components/ModeSelect.tsx';
import { useAppStatusStore } from '../../../store/useAppStatusStore.ts';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';
import { Divider } from '@mui/material';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

function Miner() {
    const { cpu: cpuHardwareStatus } = useHardwareStatus();

    const cpu = useAppStatusStore((s) => s.cpu);
    const { hash_rate, estimated_earnings = 0 } = cpu || {};

    const truncateString = (str: string, num: number): string => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };
    const cpu_usage = useCPUStatusStore((s) => s.cpu_usage);
    const cpu_brand = useCPUStatusStore((s) => s.cpu_brand);
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
                <Tile title="Hashrate (to remove)" stats={hash_rate + ' H/s'} />
                <Tile title="CPU Utilization" stats={cpu_usage + '%'} />
                <Tile title="CHIP/GPU" stats={cpu_brand} />
                <Tile title="CPU Utilization" stats={(cpuHardwareStatus?.usage_percentage || 0).toString() + '%'} />
                <Tile title="CHIP/GPU" stats={truncateString(cpuHardwareStatus?.label || 'Unknown', 10)} />
                <Tile title="Est Earnings" stats={formatNumber(estimated_earnings / 1000000) + ' XTM/24h'} />
            </TileContainer>
        </MinerContainer>
    );
}

export default Miner;
