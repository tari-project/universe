import { StatWrapper, TileItem, TileTop } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Chip } from '@app/components/elements/Chip.tsx';

interface TileProps {
    title: string;
    stats: string;
    unit?: string;
    chipValue?: number;
    isLoading?: boolean;
    useLowerCase?: boolean;
}

function Tile({ title, stats, chipValue, isLoading = false, useLowerCase = false }: TileProps) {
    return (
        <TileItem>
            <TileTop>
                <Typography>{title}</Typography>
                {chipValue ? (
                    <Chip size="small" background={'green'} color={'white'}>
                        {chipValue}
                    </Chip>
                ) : null}
            </TileTop>
            {isLoading ? (
                <StyledIcon />
            ) : (
                <StatWrapper $useLowerCase={useLowerCase}>
                    <Typography variant="h5" title={stats}>
                        {truncateString(stats, 8)}
                    </Typography>
                </StatWrapper>
            )}
        </TileItem>
    );
}

export default Tile;
