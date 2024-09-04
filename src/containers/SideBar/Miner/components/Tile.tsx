import { StatWrapper, TileItem } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles';
import { Typography } from '@app/components/elements/Typography.tsx';

interface TileProps {
    title: string;
    stats: string;
    isLoading?: boolean;
}

function Tile({ title, stats, isLoading }: TileProps) {
    return (
        <TileItem>
            <Typography>{title}</Typography>
            {isLoading ? (
                <StyledIcon />
            ) : (
                <StatWrapper>
                    <Typography variant="h5" title={stats}>
                        {truncateString(stats, 8)}
                    </Typography>
                </StatWrapper>
            )}
        </TileItem>
    );
}

export default Tile;
