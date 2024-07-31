import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner.tsx';
import Scheduler from './components/Scheduler.tsx';
import useAppStateStore from '../../../store/appStateStore.ts';
import ModeSelect from './components/ModeSelect.tsx';

function Miner() {
  const { cpuUsage, hashRate } = useAppStateStore((state) => ({
    cpuUsage: state.cpuUsage,
    hashRate: state.hashRate,
  }));

  return (
    <MinerContainer>
      <AutoMiner />
      <Scheduler />
      <TileContainer>
        <Tile title="Resources" stats="GPU" />
        <ModeSelect />
        {/*<Tile title="GPU Utilization" stats="23%" />*/}
        <Tile title="Hashrate (to remove)" stats={hashRate + ' H/s'} />
        <Tile title="CPU Utilization" stats={cpuUsage + '%'} />
        <Tile title="CHIP/GPU" stats="RTX 4090" />
        <Tile title="Est Earnings" stats="6.25 XTM/24h" />
      </TileContainer>
    </MinerContainer>
  );
}

export default Miner;
