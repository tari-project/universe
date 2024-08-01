import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner.tsx';
import Scheduler from './components/Scheduler.tsx';
import useAppStateStore from '../../../store/appStateStore.ts';
import ModeSelect from './components/ModeSelect.tsx';

function Miner() {
  const { cpuUsage, hashRate, cpuBrand, estimatedEarnings } = useAppStateStore((state) => ({
    cpuUsage: state.cpuUsage,
    hashRate: state.hashRate,
      cpuBrand: state.cpuBrand,
estimatedEarnings: state.estimatedEarnings
  }));
    const truncateString = (str: string, num: number): string => {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    };

  return (
    <MinerContainer>
      <AutoMiner />
      <Scheduler />
      <TileContainer>
        <Tile title="Resources" stats="CPU" />
        <ModeSelect />
        {/*<Tile title="GPU Utilization" stats="23%" />*/}
        <Tile title="Hashrate (to remove)" stats={hashRate + ' H/s'} />
        <Tile title="CPU Utilization" stats={cpuUsage + '%'} />
        <Tile title="CHIP/GPU" stats={truncateString(cpuBrand, 10)} />
        <Tile title="Est Earnings" stats={ estimatedEarnings + " XTM/24h"} />
      </TileContainer>
    </MinerContainer>
  );
}

export default Miner;
