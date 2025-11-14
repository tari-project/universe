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
} from './MinotariHistoryItem.styles.ts';
import { useUIStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { getTxTitle, getTxTypeByStatus } from '@app/utils/getTxStatus.ts';
import { TransactionDirection } from '@app/types/transactions.ts';
import { MinotariWalletTransaction } from '@app/types/app-status.ts';
import MinotariHoverItem from './MinotariHoverItem.tsx';

export interface HistoryListItemProps {
    transaction: MinotariWalletTransaction;
    index: number;
    itemIsNew?: boolean;
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

const MinotariHistoryListItem = memo(function MinotariListItem({
    transaction,
    index,
    itemIsNew = false,
}: HistoryListItemProps) {
    const { t } = useTranslation('wallet');
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const ref = useRef<HTMLDivElement>(null);

    // const itemType = getTxTypeByStatus(item);

    // const isMined = itemType === 'mined';

    const [hovering, setHovering] = useState(false);

    // const itemTitle = getTxTitle(item);
    const earningsFormatted = hideWalletBalance
        ? `***`
        : formatNumber(transaction.transaction_balance, FormatPreset.XTM_COMPACT).toLowerCase();

    const baseItem = (
        <BaseItem
            title={'Placeholder Title'}
            time={transaction.effective_date}
            value={earningsFormatted}
            direction={transaction.is_negative ? TransactionDirection.Outbound : TransactionDirection.Inbound}
            chip={itemIsNew ? t('new') : ''}
            hideWalletBalance={hideWalletBalance}
        />
    );

    return (
        <ItemWrapper
            ref={ref}
            data-index={index}
            style={{ height: 48 }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <AnimatePresence>{hovering && <MinotariHoverItem transaction={transaction} />}</AnimatePresence>
            {baseItem}
        </ItemWrapper>
    );
});

export { MinotariHistoryListItem };
