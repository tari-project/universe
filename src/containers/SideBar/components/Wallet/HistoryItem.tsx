import { EarningsWrapper, InfoWrapper, LeftContent, SquadIconWrapper, Wrapper } from './HistoryItem.styles.ts';
import { WonBlockItem } from '@app/types/balance.ts';
import { formatNumber } from '@app/utils/formatNumber.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTheme } from 'styled-components';
import { TariSvg } from '@app/assets/icons/tari.tsx';
interface HistoryItemProps {
    item: WonBlockItem;
}

const listItem = {
    hidden: { y: 5, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
    },
};

export default function HistoryItem({ item }: HistoryItemProps) {
    const earningsFormatted = formatNumber(item.earnings, 1).toLowerCase();
    const theme = useTheme();
    return (
        <Wrapper variants={listItem}>
            <LeftContent>
                <SquadIconWrapper>
                    <TariSvg />
                </SquadIconWrapper>
                <InfoWrapper>
                    <Typography>{`Solved block #${item.solvedBlock}`}</Typography>
                    <Typography variant="p">
                        {item.time
                            ?.toLocaleString(undefined, {
                                month: 'short',
                                day: '2-digit',
                                hourCycle: 'h11',
                                hour: 'numeric',
                                minute: 'numeric',
                            })
                            .replace('am', 'AM')
                            .replace('pm', 'PM')}
                    </Typography>
                </InfoWrapper>
            </LeftContent>
            <EarningsWrapper>
                <Typography variant="h5" style={{ color: theme.palette.success.main }}>{`+ `}</Typography>
                <Typography
                    variant="h5"
                    style={{ color: theme.palette.base }}
                >{`${earningsFormatted} tXTM`}</Typography>
            </EarningsWrapper>
        </Wrapper>
    );
}
