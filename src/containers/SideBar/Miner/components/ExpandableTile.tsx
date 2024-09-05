import { StatWrapper, TileItem, TileTop } from '../styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ReactNode } from 'react';
import QuestionMarkSvg from '@app/components/svgs/QuestionMarkSvg.tsx';
import { TriggerWrapper } from '@app/containers/SideBar/Miner/components/ExpandableTile.styles.ts';
import { StyledIcon } from '@app/containers/Dashboard/MiningView/components/MiningButton.styles.ts';

interface ExpandableTileProps {
    title: string;
    children?: ReactNode;
    stats?: string;
    unit?: string;
    chipValue?: number;
    isLoading?: boolean;
    useLowerCase?: boolean;
}

export function ExpandableTile({ title, stats, isLoading = false, useLowerCase = false }: ExpandableTileProps) {
    return (
        <TileItem>
            <TileTop>
                <Typography>{title}</Typography>
                <TriggerWrapper>
                    <QuestionMarkSvg />
                </TriggerWrapper>
            </TileTop>
            {isLoading ? (
                <StyledIcon />
            ) : (
                <StatWrapper $useLowerCase={useLowerCase}>
                    <Typography
                        variant="h5"
                        title={stats}
                        style={{ textTransform: useLowerCase ? 'lowercase' : 'inherit', lineHeight: '1.02' }}
                    >
                        {stats}
                    </Typography>
                </StatWrapper>
            )}
        </TileItem>
    );
}
