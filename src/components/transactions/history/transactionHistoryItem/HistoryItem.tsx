import { memo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
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
} from './HistoryItem.styles.ts';
import { useUIStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { TransactionDirection } from '@app/types/transactions.ts';
import { WalletTransaction, InternalTransactionType } from '@app/types/app-status.ts';
import HoverItem from './HoverItem.tsx';
import { formatEffectiveDate, resolveTransactionTitle, resolveTransactionType } from '../helpers.ts';

export interface HistoryListItemProps {
    transaction: WalletTransaction;
    index: number;
    itemIsNew?: boolean;
    setDetailsItem?: (item: WalletTransaction) => void;
}

export interface BaseItemProps {
    title: string;
    direction: TransactionDirection;
    time: string;
    value: string;
    chip?: string;
    onClick?: () => void;
    hideWalletBalance?: boolean;
}

const BaseItem = memo(function BaseItem({
    title,
    time,
    value,
    direction,
    chip,
    onClick,
    hideWalletBalance,
}: BaseItemProps) {
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

const HistoryListItem = memo(function HistoryListItem({
    transaction,
    index,
    itemIsNew = false,
    setDetailsItem,
}: HistoryListItemProps) {
    const { t } = useTranslation('wallet');
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const ref = useRef<HTMLDivElement>(null);

    const itemType = resolveTransactionType(transaction);
    const isMined = itemType === 'mined';

    const [hovering, setHovering] = useState(false);

    const itemTitle = resolveTransactionTitle(transaction);
    const earningsFormatted = hideWalletBalance
        ? `***`
        : formatNumber(transaction.transaction_balance, FormatPreset.XTM_COMPACT).toLowerCase();

    const baseItem = (
        <BaseItem
            title={itemTitle}
            time={formatEffectiveDate(transaction.effective_date)}
            value={earningsFormatted}
            direction={
                transaction.internal_transaction_type === 'Sent'
                    ? TransactionDirection.Outbound
                    : TransactionDirection.Inbound
            }
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
                setDetailsItem?.(transaction);
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
            <AnimatePresence>
                {hovering && <HoverItem transaction={transaction} button={detailsButton} />}
            </AnimatePresence>
            {baseItem}
        </ItemWrapper>
    );
});

export { HistoryListItem };
