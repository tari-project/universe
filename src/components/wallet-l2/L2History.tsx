import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore.ts';
import type { L2Account } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset } from '@app/utils';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { formatEffectiveDate } from '@app/components/transactions/history/helpers.ts';
import { EmptyText, ListItemWrapper, ListWrapper } from '@app/components/transactions/history/List.styles.ts';
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
} from '@app/components/transactions/history/transactionHistoryItem/HistoryItem.styles.ts';
import { Wrapper as DetailsWrapper } from '@app/components/transactions/history/transactionDetails/styles.ts';

// The backend sends unix seconds; formatEffectiveDate wants an ISO string.
const date = (seconds: number) => formatEffectiveDate(new Date(seconds * 1000).toISOString());

export default function L2History({ account }: { account: L2Account }) {
    const { t } = useTranslation('wallet');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const xtr = (value: number) => (hideBalance ? '***' : formatNumber(Math.abs(value), FormatPreset.XTM_LONG_DEC));
    const selected = account.history.find((change) => change.id === selectedId);
    const tx = selected?.transaction_id
        ? account.transactions.find((transaction) => transaction.id === selected.transaction_id)
        : undefined;

    return (
        <ListWrapper>
            {!account.history.length && <EmptyText data-testid="l2-history-empty">{t('l2.empty')}</EmptyText>}
            <ListItemWrapper>
                {account.history.map((change) => (
                    <ItemWrapper key={change.id} style={{ height: 48 }} data-testid="l2-history-row">
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
                    </ItemWrapper>
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
                                    value: `${selected.amount < 0 ? '-' : ''}${xtr(selected.amount)} XTR`,
                                },
                                { label: t('l2.details.source'), value: t(`l2.source.${selected.source}`) },
                                { label: t('l2.details.date'), value: date(selected.timestamp) },
                                { label: t('l2.details.transaction-id'), value: selected.transaction_id },
                                { label: t('l2.details.status'), value: tx?.status },
                                { label: t('l2.details.fee'), value: tx?.fee != null ? `${xtr(tx.fee)} XTR` : null },
                                { label: t('l2.details.invalid-reason'), value: tx?.invalid_reason },
                            ]}
                        />
                    </DetailsWrapper>
                )}
            </TransactionModal>
        </ListWrapper>
    );
}
