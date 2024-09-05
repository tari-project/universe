import { StatWrapper, TileItem, TileTop, Unit } from '../styles';
import truncateString from '@app/utils/truncateString.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ReactNode } from 'react';

interface ExpandableTileProps {
    title: string;
    children?: ReactNode;
    stats?: string;
    unit?: string;
    chipValue?: number;
    isLoading?: boolean;
    useLowerCase?: boolean;
}

export function ExpandableTile({
    title,
    children,
    stats,
    unit,
    isLoading = false,
    useLowerCase = false,
}: ExpandableTileProps) {
    return (
        <TileItem>
            <TileTop>
                <Typography>{title}</Typography>
                <div>toggle</div>
            </TileTop>
        </TileItem>
    );
}
