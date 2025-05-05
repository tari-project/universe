import { memo, useRef, useState } from 'react';
import { AnimatePresence, useInView } from 'motion/react';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { BaseItemProps, HistoryListItemProps } from '../types.ts';
import { formatTimeStamp, getItemTitle, getItemType } from './helpers.ts';
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
    Chip,
    BlockInfoWrapper,
    Content,
} from './ListItem.styles.ts';
import { useUIStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';

const BaseItem = memo(function BaseItem({ title, time, value, type, chip, onClick }: BaseItemProps) {
    // note re. isPositiveValue:
    // amounts in the tx response are always positive numbers but
    // if the transaction type is 'sent' it must be displayed as a negative amount, with a leading `-`
    const isPositiveValue = type !== 'sent';
    const displayTitle = title.length > 30 ? truncateMiddle(title, 8) : title;
    return (
        <ContentWrapper onClick={onClick}>
            <Content>
                <BlockInfoWrapper>
                    <TitleWrapper title={title}>{displayTitle}</TitleWrapper>
                    <TimeWrapper variant="p">{time}</TimeWrapper>
                </BlockInfoWrapper>
            </Content>
            <Content>
                {chip ? (
                    <Chip>
                        <span>{chip}</span>
                    </Chip>
                ) : null}

                <ValueWrapper>
                    <ValueChangeWrapper $isPositiveValue={isPositiveValue}>
                        {isPositiveValue ? `+` : `-`}
                    </ValueChangeWrapper>
                    {value}
                    <CurrencyText>{`XTM`}</CurrencyText>
                </ValueWrapper>
            </Content>
        </ContentWrapper>
    );
});

const HistoryListItem = memo(function ListItem({ item, index, itemIsNew = false }: HistoryListItemProps) {
    const { t } = useTranslation('wallet');
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const clickRef = useRef(0);
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5, once: false });

    const itemType = getItemType(item);

    const isMined = itemType === 'mined';

    const [hovering, setHovering] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const itemTitle = getItemTitle({ itemType, blockHeight: item.mined_in_block_height, message: item.payment_id });
    const earningsFormatted = hideWalletBalance
        ? `***`
        : formatNumber(item.amount, FormatPreset.XTM_COMPACT).toLowerCase();
    const itemTime = formatTimeStamp(item.timestamp);

    function handleTxClick() {
        if (import.meta.env.MODE !== 'development' || isMined) return;

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
        <BaseItem
            title={itemTitle}
            time={itemTime}
            value={earningsFormatted}
            type={itemType}
            status={item?.status}
            onClick={handleTxClick}
            chip={itemIsNew ? t('new') : ''}
        />
    );

    const detailsButton = !isMined ? (
        <Button
            size="smaller"
            variant="outlined"
            onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
            }}
        >
            {t(`history.view-details`)}
        </Button>
    ) : null;

    return (
        <>
            <ItemWrapper
                ref={ref}
                data-index={index}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                style={{ height: 48 }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
            >
                <AnimatePresence>{hovering && <ItemHover item={item} button={detailsButton} />}</AnimatePresence>
                {baseItem}
            </ItemWrapper>
            {!isMined && (
                <ItemExpand
                    item={item}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    handleClose={() => setExpanded(false)}
                />
            )}
        </>
    );
});

export { HistoryListItem };
