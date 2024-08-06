import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner.tsx';
import useAppStateStore from '../../../store/appStateStore.ts';
import ModeSelect from './components/ModeSelect.tsx';

function Miner() {
  const { cpuUsage, hashRate, cpuBrand, estimatedEarnings } = useAppStateStore(
    (state) => ({
      cpuUsage: state.cpuUsage,
      hashRate: state.hashRate,
      cpuBrand: state.cpuBrand,
      estimatedEarnings: state.estimatedEarnings,
    })
  );
  const truncateString = (str: string, num: number): string => {
    if (str.length <= num) {
      return str;
    }
    return str.slice(0, num) + '...';
  };

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
      <TileContainer>
        <Tile title="Resources" stats="CPU" />
        <ModeSelect />
        {/*<Tile title="GPU Utilization" stats="23%" />*/}
        <Tile title="Hashrate (to remove)" stats={hashRate + ' H/s'} />
        <Tile title="CPU Utilization" stats={cpuUsage + '%'} />
        <Tile title="CHIP/GPU" stats={truncateString(cpuBrand, 10)} />
        <Tile
          title="Est Earnings"
          stats={formatNumber(estimatedEarnings / 1000000) + ' XTM/24h'}
        />
      </TileContainer>
    </MinerContainer>
  );
}

export default Miner;
