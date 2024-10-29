import { EarningsWrapper, InfoWrapper, LeftContent, SquadIconWrapper, Wrapper } from './HistoryItem.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTheme } from 'styled-components';
import { TariSvg } from '@app/assets/icons/tari.tsx';

import { useFormatBalance } from '@app/utils/formatBalance.ts';
import { useTranslation } from 'react-i18next';
import { Transaction } from '@app/types/wallet.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
interface HistoryItemProps {
    item: Transaction;
}

const listItem = {
    hidden: { y: 5, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
    },
};

const randomGradientColours = [
    { colour: '#9F42FF', colour1: '#FF1493', colour2: '#2172EF' },
    { colour: '#FF1493', colour1: '#FF4500', colour2: '#e3bf31' },
    { colour: '#9F42FF', colour1: '#2172EF', colour2: '#1ccf31' },
    { colour: '#FF1493', colour1: '#4d6fe8', colour2: '#9F42FF' },
    { colour: '#5db2fd', colour1: '#1ccf31', colour2: '#4d6fe8' },
    { colour: '#FF8C00', colour1: '#FF1493', colour2: '#FF8C00' },
    { colour: '#2172EF', colour1: '#FF1493', colour2: '#9F42FF' },
    { colour: '#1ccf31', colour1: '#4d6fe8', colour2: '#5db2fd' },
    { colour: '#9F42FF', colour1: '#FF1493', colour2: '#4d6fe8' },
];

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

export default function HistoryItem({ item }: HistoryItemProps) {
    const theme = useTheme();
    const appLanguage = useAppConfigStore((s) => s.application_language);
    const systemLang = useAppConfigStore((s) => s.should_always_use_system_language);
    const { t } = useTranslation('sidebar');
    const earningsFormatted = useFormatBalance(item.amount).toLowerCase();
    const { colour, colour1, colour2 } = randomGradientColours[getRandomInt(9)];

    if (!item.blockHeight || item.payment_id?.length > 0) {
        return null;
    }

    const itemTitle = `${t('block')} #${item.blockHeight}`;

    return (
        <Wrapper variants={listItem}>
            <LeftContent>
                <SquadIconWrapper $colour={colour} $colour1={colour1} $colour2={colour2}>
                    <TariSvg />
                </SquadIconWrapper>
                <InfoWrapper>
                    <Typography>{itemTitle}</Typography>
                    <Typography variant="p">
                        {new Date(item.timestamp * 1000)?.toLocaleString(systemLang ? undefined : appLanguage, {
                            month: 'short',
                            day: '2-digit',
                            hourCycle: 'h24',
                            hour: 'numeric',
                            minute: 'numeric',
                        })}
                    </Typography>
                </InfoWrapper>
            </LeftContent>
            <EarningsWrapper>
                <Typography variant="h5" style={{ color: theme.palette.success.main }}>
                    {`+ `}
                </Typography>
                <Typography variant="h5" style={{ color: '#fff' }}>{`${earningsFormatted} tXTM`}</Typography>
            </EarningsWrapper>
        </Wrapper>
    );
}
