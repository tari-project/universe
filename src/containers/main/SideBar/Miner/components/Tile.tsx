import { StatWrapper, TileItem, TileTop, Unit } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Chip } from '@app/components/elements/Chip.tsx';
import { colorsAll } from '@app/theme/palettes/colors.ts';
import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';
import { formatNumber, FormatPreset } from '@app/utils/formatters';

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
    const chipColor = colorsAll.ramp[chipRange];
    const chipText = formatNumber(chipValue, FormatPreset.PERCENT);

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
                <SpinnerIcon />
            ) : (
                <StatWrapper $useLowerCase={useLowerCase} layout>
                    {truncateString(stats, 8)}
                    <Unit>{unit}</Unit>
                </StatWrapper>
            )}
        </TileItem>
    );
}

export default Tile;
