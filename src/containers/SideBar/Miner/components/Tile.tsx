import { Typography } from '@mui/material';
import { TileItem } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles';

interface TileProps {
    title: string;
    stats: string;
    isLoading?: boolean;
}

function Tile({ title, stats, isLoading }: TileProps) {
    return (
        <TileItem>
            <Typography variant="body2">{title}</Typography>
            {isLoading ? (
                <StyledIcon sx={{ height: 24, width: 24 }} />
            ) : (
                <Typography variant="h5" fontSize={18}>
                    {truncateString(stats, 10)}
                </Typography>
            )}
        </TileItem>
    );
}

export default Tile;
