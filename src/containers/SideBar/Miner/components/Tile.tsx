import { StatWrapper, TileItem, TileTop, Unit } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Chip } from '@app/components/elements/Chip.tsx';
import { formatPercent } from '@app/utils/formatNumber.ts';
import { colors } from '@app/theme/colors.ts';

export interface TileProps {
    title: string;
    stats: string;
    unit?: string;
    chipValue?: number;
    isLoading?: boolean;
    useLowerCase?: boolean;
}

function Tile({ title, stats, chipValue = 0, unit, isLoading = false, useLowerCase = false }: TileProps) {
    const chipRange = Math.ceil(chipValue / 10);
    const chipColor = colors.ramp[chipRange];
    const chipText = formatPercent(chipValue);

    return (
        <TileItem layoutId={`tile-item-${title}`}>
            <TileTop layout>
                <Typography>{title}</Typography>
                {chipValue ? (
                    <Chip size="small" background={chipColor} color={'#fff'}>
                        {chipText}
                    </Chip>
                ) : null}
            </TileTop>
            {isLoading ? (
                <StyledIcon />
            ) : (
                <StatWrapper $useLowerCase={useLowerCase} layout>
                    <Typography
                        variant="h5"
                        title={stats}
                        style={{ textTransform: useLowerCase ? 'lowercase' : 'inherit', lineHeight: '1.02' }}
                    >
                        {truncateString(stats, 8)}
                    </Typography>
                    <Unit>
                        <Typography>{unit}</Typography>
                    </Unit>
                </StatWrapper>
            )}
        </TileItem>
    );
}

export default Tile;
