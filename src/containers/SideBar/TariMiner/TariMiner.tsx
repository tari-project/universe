import { Typography, Stack, IconButton } from '@mui/material';
import Tile from './components/Tile';
import { MinerContainer, TileContainer } from './styles';
import { IoResize } from 'react-icons/io5';
import AutoMiner from './components/AutoMiner';
import useAppStateStore from '../../../store/appStateStore.ts';
import SettingsDialog from '../Settings/Settings.tsx';
import ModeSelect from './components/ModeSelect.tsx';

function TariMiner() {
  const { cpuUsage, hashRate } = useAppStateStore((state) => ({
    cpuUsage: state.cpuUsage,
    hashRate: state.hashRate,
  }));

  return (
    <MinerContainer>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3">Tari Miner</Typography>
        <Stack direction="row" spacing={0.5}>
          <SettingsDialog />
          <IconButton onClick={() => console.log('Expand Sidebar')}>
            <IoResize size={16} />
          </IconButton>
        </Stack>
      </Stack>
      <AutoMiner />
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

export default TariMiner;
