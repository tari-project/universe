import Tile from './components/Tile.tsx';
import { MinerWrapper, TileWrapper } from './styles.ts';
import AutoMiner from './components/AutoMiner.tsx';
import Scheduler from './components/Scheduler.tsx';
import ModeSelect from './components/ModeSelect.tsx';
import { useAppStatusStore } from '../../../store/useAppStatusStore.ts';
import { formatNumber } from '../../../utils';
import { useEffect } from 'react';

function Miner() {
    const cpu = useAppStatusStore((s) => s.cpu);
    const {
        cpu_usage,
        cpu_brand = '',
        hash_rate,
        estimated_earnings = 0,
    } = cpu || {};

    const truncateString = (str: string, num: number): string => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

  useEffect(() => {
    const resourceSwitcher = setInterval(() => {
      setCurrResource((prev) => (prev === "CPU" ? "GPU" : "CPU"));
    }, 5_000);

    return () => {
      clearInterval(resourceSwitcher);
    };
  }, []);

  const resourceBrand = currResource === "CPU" ? cpuBrand : gpuBrand;

    return (
        <MinerWrapper>
            <AutoMiner />
            <Scheduler />
            <TileWrapper>
                <Tile title="Resources" stats="CPU" />
                <ModeSelect />
                {/*<Tile title="GPU Utilization" stats="23%" />*/}
                <Tile title="Hashrate (to remove)" stats={hash_rate + ' H/s'} />
                <Tile title="CPU Utilization" stats={cpu_usage + '%'} />
                <Tile title="CHIP/GPU" stats={truncateString(cpu_brand, 10)} />
                <Tile
                    title="Est Earnings"
                    stats={
                        formatNumber(estimated_earnings / 1000000) + ' XTM/24h'
                    }
                />
            </TileWrapper>
        </MinerWrapper>
    );
}

export default Miner;

