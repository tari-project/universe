import { memo, useRef, useState } from 'react';
import { AnimatePresence, useInView } from 'motion/react';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { BaseItemProps, HistoryListItemProps } from '../types.ts';
import { getItemTitle, getItemType } from './helpers.ts';
import ItemExpand from './ExpandedItem';
import ItemHover from './HoveredItem';
import {
    ContentWrapper,
    ItemWrapper,
    TimeWrapper,
    TitleWrapper,
    ValueChangeWrapper,
    ValueWrapper,
    CurrencyText,
} from './ListItem.styles.ts';

const BaseItem = memo(function BaseItem({ title, time, value, type, chip, onClick }: BaseItemProps) {
    // note re. isPositiveValue:
    // amounts in the tx response are always positive numbers but
    // if the transaction type is 'sent' it must be displayed as a negative amount, with a leading `-`
    const isPositiveValue = type !== 'sent';
    const displayTitle = title.length > 30 ? truncateMiddle(title, 8) : title;
    return (
        <ContentWrapper onClick={onClick}>
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
});

const HistoryListItem = memo(function ListItem({ item, index, showReplay = false }: HistoryListItemProps) {
    const appLanguage = useAppConfigStore((s) => s.application_language);
    const systemLang = useAppConfigStore((s) => s.should_always_use_system_language);

    const clickRef = useRef(0);
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5, once: false });

    const itemType = getItemType(item);

    const isMined = itemType === 'mined';

    const [hovering, setHovering] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const itemTitle = getItemTitle({ itemType, blockHeight: item.mined_in_block_height, message: item.payment_id });
    const earningsFormatted = formatNumber(item.amount, FormatPreset.TXTM_COMPACT).toLowerCase();
    const itemTime = new Date(item.timestamp * 1000)?.toLocaleString(systemLang ? undefined : appLanguage, {
        month: 'short',
        day: '2-digit',
        hourCycle: 'h23',
        hour: 'numeric',
        minute: 'numeric',
    });

    function handleTxClick() {
        if (import.meta.env.MODE !== 'development' || showReplay) return;

        if (!expanded) {
            clickRef.current += 1;
            if (clickRef.current === 3) {
                setExpanded(true);
                clickRef.current = 0;
            }
        } else {
            setExpanded(false);
        }
    }

    const baseItem = (
        <BaseItem title={itemTitle} time={itemTime} value={earningsFormatted} type={itemType} onClick={handleTxClick} />
    );
    const itemHover = showReplay && isMined ? <ItemHover item={item} /> : null;
    const itemExpand = !isMined ? <ItemExpand item={item} /> : null;

    return (
        <ItemWrapper
            ref={ref}
            data-index={index}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ height: !isMined && expanded ? 'auto' : 48 }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <AnimatePresence>{hovering && itemHover}</AnimatePresence>
            {baseItem}
            <AnimatePresence>{expanded && itemExpand}</AnimatePresence>
        </ItemWrapper>
    );
});

export { HistoryListItem };
