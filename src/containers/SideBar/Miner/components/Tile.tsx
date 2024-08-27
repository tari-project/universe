import { Typography } from '@mui/material';
import { StatWrapper, TileItem } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles';

interface TileProps {
    title: string;
    stats: string;
    unit?: string;
    isLoading?: boolean;
}

function Tile({ title, stats, isLoading, unit }: TileProps) {
    const unitMarkup = unit ? <Typography variant="h6">{unit}</Typography> : null;
    return (
        <TileItem>
            <Typography variant="body2">{title}</Typography>
            {isLoading ? (
                <StyledIcon sx={{ height: 24, width: 24 }} />
            ) : (
                <StatWrapper>
                    <Typography variant="h5" fontSize={18} title={stats}>
                        {truncateString(stats, 8)}
                    </Typography>
                    {unitMarkup}
                </StatWrapper>
            )}
        </TileItem>
    );
}

export default Tile;
