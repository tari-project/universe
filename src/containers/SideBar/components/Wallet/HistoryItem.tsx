import {
    EarningsWrapper,
    FlexButton,
    GemImage,
    GemPill,
    HoverWrapper,
    InfoWrapper,
    LeftContent,
    SquadIconWrapper,
    Wrapper,
} from './HistoryItem.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTheme } from 'styled-components';
import { TariSvg } from '@app/assets/icons/tari.tsx';
import { TransactionInfo } from '@app/types/app-status.ts';
import formatBalance from '@app/utils/formatBalance.ts';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import gemImage from '../../../Airdrop/AirdropGiftTracker/images/gem.png';
import { useShareRewardStore } from '@app/store/useShareRewardStore.ts';
interface HistoryItemProps {
    item: TransactionInfo;
}

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
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const [hovering, setHovering] = useState(false);
    const setShowModal = useShareRewardStore((s) => s.setShowModal);

    const earningsFormatted = useMemo(() => formatBalance(item.amount).toLowerCase(), [item.amount]);
    const { colour, colour1, colour2 } = useMemo(() => {
        return randomGradientColours[getRandomInt(9)];
    }, []);

    const block = item.message.split(': ')[1];

    return (
        <Wrapper onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            <AnimatePresence>
                {hovering && (
                    <HoverWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <FlexButton
                            initial={{ x: 20, y: '-50%' }}
                            animate={{ x: 0, y: '-50%' }}
                            exit={{ x: 20, y: '-50%' }}
                            onClick={() =>
                                setShowModal({
                                    showModal: true,
                                    block: block,
                                    contributed: 20000,
                                    reward: item.amount,
                                })
                            }
                        >
                            {t('share-button')}
                            <GemPill>
                                5,000 <GemImage src={gemImage} alt="" />
                            </GemPill>
                        </FlexButton>
                    </HoverWrapper>
                )}
            </AnimatePresence>

            <LeftContent className="hover-target">
                <SquadIconWrapper $colour={colour} $colour1={colour1} $colour2={colour2}>
                    <TariSvg />
                </SquadIconWrapper>
                <InfoWrapper>
                    <Typography>
                        {t('block')} #{block}
                    </Typography>
                    <Typography variant="p">
                        {new Date(item.timestamp * 1000)?.toLocaleString(undefined, {
                            month: 'short',
                            day: '2-digit',
                            hourCycle: 'h24',
                            hour: 'numeric',
                            minute: 'numeric',
                        })}
                    </Typography>
                </InfoWrapper>
            </LeftContent>

            <EarningsWrapper className="hover-target">
                <Typography variant="h5" style={{ color: theme.palette.success.main }}>{`+ `}</Typography>
                <Typography variant="h5" style={{ color: '#fff' }}>{`${earningsFormatted} tXTM`}</Typography>
            </EarningsWrapper>
        </Wrapper>
    );
}
