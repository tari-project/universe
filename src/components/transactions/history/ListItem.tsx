import { TransactionInfo, TxType } from '@app/types/app-status.ts';
import {
    ContentWrapper,
    ItemWrapper,
    TimeWrapper,
    TitleWrapper,
    ValueChangeWrapper,
    ValueWrapper,
    HoverWrapper,
    ReplayButton,
    ButtonWrapper,
    FlexButton,
    GemImage,
    GemPill,
    CurrencyText,
} from './ListItem.styles.ts';
import { useRef, useState } from 'react';
import { AnimatePresence, useInView } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { handleWinReplay } from '@app/store/useBlockchainVisualisationStore.ts';
import { ReplaySVG } from '@app/assets/icons/replay.tsx';

import gemImage from '@app/containers/main/Airdrop/AirdropGiftTracker/images/gem.png';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useShareRewardStore } from '@app/store/useShareRewardStore.ts';

interface HistoryListItemProps {
    item: TransactionInfo;
    showReplay?: boolean;
    index: number;
}

interface BaseItemProps {
    title: string;
    type: TxType;
    time: string;
    value: string;
    chip?: string;
}

function ItemHover({ item }: { item: TransactionInfo }) {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const sharingEnabled = useAppConfigStore((s) => s.sharing_enabled);
    const referralQuestPoints = useAirdropStore((s) => s.referralQuestPoints);
    const airdropTokens = useAirdropStore((s) => s.airdropTokens);
    const { setShowModal, setItemData } = useShareRewardStore((s) => s);

    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    const handleShareClick = () => {
        setShowModal(true);
        setItemData(item);
    };
    const isLoggedIn = !!airdropTokens;
    const showShareButton = sharingEnabled && isLoggedIn;
    return (
        <HoverWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ButtonWrapper initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
                {showShareButton && (
                    <FlexButton onClick={handleShareClick}>
                        {t('share.history-item-button')}
                        <GemPill>
                            <span>{gemsValue}</span>
                            <GemImage src={gemImage} alt="" />
                        </GemPill>
                    </FlexButton>
                )}

                <ReplayButton onClick={() => handleWinReplay(item)}>
                    <ReplaySVG />
                </ReplayButton>
            </ButtonWrapper>
        </HoverWrapper>
    );
}

function BaseItem({ title, time, value, type, chip }: BaseItemProps) {
    // TODO: check formatter - need to handle negative values
    const isPositiveValue = type !== 'sent';
    const displayTitle = truncateMiddle(title, 12);
    return (
        <ContentWrapper>
            <TitleWrapper title={title}>{displayTitle}</TitleWrapper>
            <TimeWrapper variant="p">{time}</TimeWrapper>
            <ValueWrapper>
                {chip && <TimeWrapper variant="p">{chip}</TimeWrapper>}
                <ValueChangeWrapper $isPositiveValue={isPositiveValue}>
                    {isPositiveValue ? `+` : `-`}
                </ValueChangeWrapper>
                {value}
                <CurrencyText>{`tXTM`}</CurrencyText>
            </ValueWrapper>
        </ContentWrapper>
    );
}
export function ListItem({ item, index, showReplay = false }: HistoryListItemProps) {
    const { t } = useTranslation(['sidebar', 'common'], { useSuspense: false });

    const appLanguage = useAppConfigStore((s) => s.application_language);
    const systemLang = useAppConfigStore((s) => s.should_always_use_system_language);

    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5, once: false });

    const [hovering, setHovering] = useState(false);

    const itemTitle =
        item.txType === 'mined' ? `${t('block')} #${item.mined_in_block_height}` : t(`common:${item.txType}`);
    const earningsFormatted = formatNumber(item.amount, FormatPreset.TXTM_COMPACT).toLowerCase();

    const itemTime = new Date(item.timestamp * 1000)?.toLocaleString(systemLang ? undefined : appLanguage, {
        month: 'short',
        day: '2-digit',
        hourCycle: 'h23',
        hour: 'numeric',
        minute: 'numeric',
    });

    const baseItem = (
        <BaseItem title={itemTitle} time={itemTime} value={earningsFormatted} type={item.txType ?? 'unknown'} />
    );
    const itemHover = showReplay ? <ItemHover item={item} /> : null;

    return (
        <ItemWrapper
            ref={ref}
            data-index={index}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <AnimatePresence>{hovering && itemHover}</AnimatePresence>
            {baseItem}
        </ItemWrapper>
    );
}
