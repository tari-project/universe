import { memo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { BridgeBaseItemProps, BridgeHistoryListItemProps } from '../types.ts';
import BridgeItemHover from './BridgeHoveredItem.tsx';
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
import { formatTimeStamp, getTimestampFromTransaction } from './helpers.ts';

const BaseItem = memo(function BaseItem({ title, time, value, chip, onClick }: BridgeBaseItemProps) {
    // note re. isPositiveValue:
    // amounts in the tx response are always positive numbers but
    // if the transaction is Outbound, the value is negative

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
                    <ValueChangeWrapper $isPositiveValue={false}>{`-`}</ValueChangeWrapper>
                    {value}
                    <CurrencyText>{`XTM`}</CurrencyText>
                </ValueWrapper>
            </Content>
        </ContentWrapper>
    );
});

const BridgeHistoryListItem = memo(function ListItem({
    item,
    index,
    itemIsNew = false,
    setDetailsItem,
}: BridgeHistoryListItemProps) {
    const { t } = useTranslation('wallet');
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const ref = useRef<HTMLDivElement>(null);

    const [hovering, setHovering] = useState(false);

    const earningsFormatted = hideWalletBalance
        ? `***`
        : formatNumber(Number(item.tokenAmount), FormatPreset.XTM_COMPACT).toLowerCase();
    const time = formatTimeStamp(getTimestampFromTransaction(item));

    const baseItem = (
        <BaseItem
            title={'Bridge XTM to WXTM'}
            time={time}
            value={earningsFormatted}
            status={item?.status}
            chip={itemIsNew ? t('new') : ''}
        />
    );

    const detailsButton = (
        <Button
            size="smaller"
            variant="outlined"
            onClick={(e) => {
                e.stopPropagation();
                setDetailsItem?.({ ...item, createdAt: time });
            }}
        >
            {t(`history.view-details`)}
        </Button>
    );

    return (
        <ItemWrapper
            ref={ref}
            data-index={index}
            style={{ height: 48 }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <AnimatePresence>{hovering && <BridgeItemHover button={detailsButton} />}</AnimatePresence>
            {baseItem}
        </ItemWrapper>
    );
});

export { BridgeHistoryListItem };
