import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore.ts';
import type { L2Account, L2BalanceChange } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset } from '@app/utils';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { formatEffectiveDate } from '@app/components/transactions/history/helpers.ts';
import { EmptyText, ListItemWrapper, ListWrapper } from '@app/components/transactions/history/List.styles.ts';
import {
    BlockInfoWrapper,
    ButtonWrapper,
    HoverWrapper,
    Content,
    ContentWrapper,
    CurrencyText,
    ItemWrapper,
    TimeWrapper,
    TitleWrapper,
    ValueChangeWrapper,
    ValueWrapper,
} from '@app/components/transactions/history/transactionHistoryItem/HistoryItem.styles.ts';
import { Wrapper as DetailsWrapper } from '@app/components/transactions/history/transactionDetails/styles.ts';

// The backend sends unix seconds; formatEffectiveDate wants an ISO string.
const date = (seconds: number) => formatEffectiveDate(new Date(seconds * 1000).toISOString());
// Same preset choice as the L1 transaction details.
const detail = (value: number) =>
    `${formatNumber(value, value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS)} XTR`;

export default function L2History({ account }: { account: L2Account }) {
    const { t } = useTranslation('wallet');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const xtr = (value: number) =>
        hideBalance ? '***' : formatNumber(Math.abs(value), FormatPreset.XTM_COMPACT).toLowerCase();
    const selected = account.history.find((change) => change.id === selectedId);
    const tx = selected?.transaction_id
        ? account.transactions.find((transaction) => transaction.id === selected.transaction_id)
        : undefined;

    return (
        <ListWrapper>
            {!account.history.length && <EmptyText data-testid="l2-history-empty">{t('l2.empty')}</EmptyText>}
            <ListItemWrapper>
                {account.history.map((change) => (
                    <L2HistoryRow key={change.id} change={change} onDetails={() => setSelectedId(change.id)}>
                        <ContentWrapper onClick={() => setSelectedId(change.id)}>
                            <Content>
                                <BlockInfoWrapper>
                                    <TitleWrapper>{t(`l2.source.${change.source}`)}</TitleWrapper>
                                    <TimeWrapper variant="p">{date(change.timestamp)}</TimeWrapper>
                                </BlockInfoWrapper>
                            </Content>
                            <Content>
                                <ValueWrapper>
                                    {!hideBalance && (
                                        <ValueChangeWrapper $isPositiveValue={change.amount >= 0}>
                                            {change.amount >= 0 ? `+` : `-`}
                                        </ValueChangeWrapper>
                                    )}
                                    {xtr(change.amount)}
                                    <CurrencyText>{`XTR`}</CurrencyText>
                                </ValueWrapper>
                            </Content>
                        </ContentWrapper>
                    </L2HistoryRow>
                ))}
            </ListItemWrapper>

            <TransactionModal
                show={Boolean(selected)}
                title={t('history.transaction-details')}
                handleClose={() => setSelectedId(null)}
            >
                {selected && (
                    <DetailsWrapper>
                        <StatusList
                            entries={[
                                {
                                    label: t('l2.details.amount'),
                                    value: `${selected.amount < 0 ? '-' : '+'}${detail(Math.abs(selected.amount))}`,
                                },
                                { label: t('l2.details.source'), value: t(`l2.source.${selected.source}`) },
                                { label: t('l2.details.date'), value: date(selected.timestamp) },
                                { label: t('l2.details.transaction-id'), value: selected.transaction_id },
                                { label: t('l2.details.status'), value: tx?.status },
                                { label: t('l2.details.fee'), value: tx?.fee != null ? detail(tx.fee) : null },
                                { label: t('l2.details.invalid-reason'), value: tx?.invalid_reason },
                            ]}
                        />
                    </DetailsWrapper>
                )}
            </TransactionModal>
        </ListWrapper>
    );
}

// A history row with the same hover-to-reveal View details button as the L1 rows.
function L2HistoryRow({
    change,
    onDetails,
    children,
}: {
    change: L2BalanceChange;
    onDetails: () => void;
    children: React.ReactNode;
}) {
    const { t } = useTranslation('wallet');
    const [hovering, setHovering] = useState(false);
    return (
        <ItemWrapper
            style={{ height: 48 }}
            data-testid="l2-history-row"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <AnimatePresence>
                {hovering && (
                    <HoverWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ButtonWrapper
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                        >
                            <Button
                                size="smaller"
                                variant="outlined"
                                data-testid="l2-row-details"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDetails();
                                }}
                            >
                                {t('history.view-details')}
                            </Button>
                        </ButtonWrapper>
                    </HoverWrapper>
                )}
            </AnimatePresence>
            {children}
        </ItemWrapper>
    );
}
