import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import {
    ButtonWrapper,
    EarningsWrapper,
    FlexButton,
    GemImage,
    GemPill,
    HoverWrapper,
    InfoWrapper,
    LeftContent,
    ReplayButton,
    SquadIconWrapper,
    Wrapper,
} from './HistoryItem.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTheme } from 'styled-components';
import { TariSvg } from '@app/assets/icons/tari.tsx';

import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import gemImage from '../../../Airdrop/AirdropGiftTracker/images/gem.png';
import { useShareRewardStore } from '@app/store/useShareRewardStore.ts';
import { Transaction } from '@app/types/wallet.ts';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { ReplaySVG } from '@app/assets/icons/replay';
import { formatNumber, FormatPreset } from '@app/utils/formatters.ts';

interface HistoryItemProps {
    item: Transaction;
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
    const appLanguage = useAppConfigStore((s) => s.application_language);
    const systemLang = useAppConfigStore((s) => s.should_always_use_system_language);
    const sharingEnabled = useAppConfigStore((s) => s.sharing_enabled);

    const handleWinReplay = useBlockchainVisualisationStore((s) => s.handleWinReplay);

    const { t } = useTranslation('sidebar', { useSuspense: false });
    const earningsFormatted = formatNumber(item.amount, FormatPreset.TXTM_COMPACT).toLowerCase();
    const referralQuestPoints = useAirdropStore((s) => s.referralQuestPoints);
    const airdropTokens = useAirdropStore((s) => s.airdropTokens);

    const [hovering, setHovering] = useState(false);
    const { setShowModal, setItemData } = useShareRewardStore((s) => s);

    const { colour, colour1, colour2 } = useMemo(() => {
        return randomGradientColours[getRandomInt(9)];
    }, []);

    const handleReplay = useCallback(() => {
        handleWinReplay(item);
    }, [handleWinReplay, item]);

    // if (!item.blockHeight || item.payment_id?.length > 0) {
    //     return null;
    // }

    const itemTitle = `${t('block')} #${item.blockHeight}`;
    const itemTime = new Date(item.timestamp * 1000)?.toLocaleString(systemLang ? undefined : appLanguage, {
        month: 'short',
        day: '2-digit',
        hourCycle: 'h23',
        hour: 'numeric',
        minute: 'numeric',
    });
    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    const handleShareClick = () => {
        setShowModal(true);
        setItemData(item);
    };
    const isLoggedIn = !!airdropTokens;
    const showShareButton = sharingEnabled && isLoggedIn;
    return (
        <Wrapper onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            <AnimatePresence>
                {hovering && (
                    <HoverWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ButtonWrapper
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                        >
                            {showShareButton && (
                                <FlexButton onClick={handleShareClick}>
                                    {t('share.history-item-button')}
                                    <GemPill>
                                        <span>{gemsValue}</span>
                                        <GemImage src={gemImage} alt="" />
                                    </GemPill>
                                </FlexButton>
                            )}
                            <ReplayButton onClick={handleReplay}>
                                <ReplaySVG />
                            </ReplayButton>
                        </ButtonWrapper>
                    </HoverWrapper>
                )}
            </AnimatePresence>
            <LeftContent>
                <SquadIconWrapper $colour={colour} $colour1={colour1} $colour2={colour2}>
                    <TariSvg />
                </SquadIconWrapper>
                <InfoWrapper>
                    {item.blockHeight ? (
                        <>
                            <Typography>{itemTitle}</Typography>
                            <Typography variant="p">{itemTime}</Typography>
                        </>
                    ) : (
                        <Typography>{itemTime}</Typography>
                    )}
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
