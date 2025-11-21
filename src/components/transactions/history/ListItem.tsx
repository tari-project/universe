import { memo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { HistoryListItemProps } from '../types.ts';
import { formatTimeStamp } from './helpers.ts';
import ItemHover from './HoveredItem';
import {
    BlockInfoWrapper,
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

const HistoryListItem = memo(function ListItem({ item, index, setDetailsItem }: HistoryListItemProps) {
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
    const earningsFull = hideWalletBalance
        ? `***`
        : formatNumber(item.tokenAmount, FormatPreset.XTM_LONG).toLowerCase();
    const itemTime = formatTimeStamp(item.createdAt);

    // note re. isPositiveValue:
    // amounts in the tx response are always positive numbers but
    // if the transaction is Outbound, the value is negative
    const isPositiveValue = item.walletTransactionDetails.direction === TransactionDirection.Inbound;
    const displayTitle = itemTitle.length > 26 ? truncateMiddle(itemTitle, 8) : itemTitle;

    const getValueMarkup = (fullValue = false) => (
        <ValueWrapper>
            {!hideWalletBalance && (
                <ValueChangeWrapper $isPositiveValue={isPositiveValue}>
                    {isPositiveValue ? `+` : `-`}
                </ValueChangeWrapper>
            )}
            {fullValue ? earningsFull : earningsFormatted}
            <CurrencyText>{`XTM`}</CurrencyText>
        </ValueWrapper>
    );
    const baseItem = (
        <ContentWrapper>
            <Content>
                <BlockInfoWrapper>
                    <TitleWrapper title={itemTitle}>{displayTitle}</TitleWrapper>
                    <TimeWrapper variant="p">{itemTime}</TimeWrapper>
                </BlockInfoWrapper>
            </Content>
            <Content>{getValueMarkup()}</Content>
        </ContentWrapper>
    );

    const detailsButton = !isMined ? (
        <>
            {getValueMarkup(true)}
            <Button
                size="xs"
                variant="outlined"
                onClick={(e) => {
                    e.stopPropagation();
                    setDetailsItem?.(item);
                }}
            >
                {t(`Details`)}
            </Button>
        </>
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
