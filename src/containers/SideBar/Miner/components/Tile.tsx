import { Typography } from '@mui/material';
import { TileItem } from '../styles';
import truncateString from '@app/utils/truncateString.ts';

interface TileProps {
    title: string;
    stats: string;
}

function Tile({ title, stats }: TileProps) {
    return (
        <TileItem>
            <Typography variant="body2">{title}</Typography>
            <Typography variant="h5" fontSize={18}>
                {truncateString(stats, 10)}
            </Typography>
        </TileItem>
    );
}

export default Tile;
