import { Typography, Stack, IconButton } from '@mui/material';
import Tile from './components/Tile';
import { MinerContainer, TileContainer } from './styles';
import { IoSettingsOutline, IoResize } from 'react-icons/io5';
import AutoMiner from './components/AutoMiner';

function TariMiner() {
  return (
    <MinerContainer>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3">Tari Miner</Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton onClick={() => console.log('Open Settings')}>
            <IoSettingsOutline size={16} />
          </IconButton>
          <IconButton onClick={() => console.log('Expand Sidebar')}>
            <IoResize size={16} />
          </IconButton>
        </Stack>
      </Stack>
      <AutoMiner />
      <TileContainer>
        <Tile title="Resources" stats="GPU" />
        <Tile title="Mode" stats="ECO" />
        <Tile title="GPU Utilization" stats="23%" />
        <Tile title="CPU Utilization" stats="5%" />
        <Tile title="CHIP/GPU" stats="RTX 4090" />
        <Tile title="Est Earnings" stats="6.25 XTM/24h" />
      </TileContainer>
    </MinerContainer>
  );
}

export default TariMiner;
