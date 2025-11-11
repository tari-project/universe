import { memo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { BaseItemProps, HistoryListItemProps } from '../types.ts';
import { formatTimeStamp } from './helpers.ts';
import ItemHover from './HoveredItem';
import {
    BlockInfoWrapper,
    Chip,
    Content,
    ContentWrapper,
    CurrencyText,
    ItemWrapper,
    TimeWrapper,
    TitleWrapper,
    ValueChangeWrapper,
    ValueWrapper,
} from './ListItem.styles.ts';
import { useUIStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { getTxTitle, getTxTypeByStatus } from '@app/utils/getTxStatus.ts';
import { TransactionDirection } from '@app/types/transactions.ts';
import BridgeItemHover from './BridgeHoveredItem.tsx';

const BaseItem = memo(function BaseItem({
    title,
    time,
    value,
    direction,
    chip,
    onClick,
    hideWalletBalance,
}: BaseItemProps) {
    // note re. isPositiveValue:
    // amounts in the tx response are always positive numbers but
    // if the transaction is Outbound, the value is negative

    const isPositiveValue = direction === TransactionDirection.Inbound;
    const displayTitle = title.length > 26 ? truncateMiddle(title, 8) : title;
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
                    {!hideWalletBalance && (
                        <ValueChangeWrapper $isPositiveValue={isPositiveValue}>
                            {isPositiveValue ? `+` : `-`}
                        </ValueChangeWrapper>
                    )}
                    {value}
                    <CurrencyText>{`XTM`}</CurrencyText>
                </ValueWrapper>
            </Content>
        </ContentWrapper>
    );
});

const HistoryListItem = memo(function ListItem({
    item,
    index,
    itemIsNew = false,
    setDetailsItem,
}: HistoryListItemProps) {
    const { t } = useTranslation('wallet');
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const ref = useRef<HTMLDivElement>(null);

    const itemType = getTxTypeByStatus(item);

    const isMined = itemType === 'mined';

    const [hovering, setHovering] = useState(false);

    const itemTitle = getTxTitle(item);
    const earningsFormatted = hideWalletBalance
        ? `***`
        : formatNumber(item.tokenAmount, FormatPreset.XTM_COMPACT).toLowerCase();
    const itemTime = formatTimeStamp(item.createdAt);

    const baseItem = (
        <BaseItem
            title={itemTitle}
            time={itemTime}
            value={earningsFormatted}
            direction={item.walletTransactionDetails.direction}
            chip={itemIsNew ? t('new') : ''}
            hideWalletBalance={hideWalletBalance}
        />
    );

    const detailsButton = !isMined ? (
        <Button
            size="smaller"
            variant="outlined"
            onClick={(e) => {
                e.stopPropagation();
                setDetailsItem?.(item);
            }}
        >
            {t(`history.view-details`)}
        </Button>
    ) : null;

    return (
        <ItemWrapper
            ref={ref}
            data-index={index}
            style={{ height: 48 }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {item.bridgeTransactionDetails ? (
                <AnimatePresence>{hovering && <BridgeItemHover button={detailsButton} />}</AnimatePresence>
            ) : (
                <AnimatePresence>{hovering && <ItemHover item={item} button={detailsButton} />}</AnimatePresence>
            )}
            {baseItem}
        </ItemWrapper>
    );
});

export { HistoryListItem };
