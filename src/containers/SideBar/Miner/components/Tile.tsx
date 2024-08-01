import { Typography } from '@mui/material';
import { TileItem } from '../styles';

interface TileProps {
  title: string;
  stats: string;
}

function Tile({ title, stats }: TileProps) {
  return (
    <TileItem>
      <Typography variant="body2">{title}</Typography>
      <Typography variant="h5">{stats}</Typography>
    </TileItem>
  );
}

export default Tile;
