import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import type { L2Account, L2BalanceChange, L2Burn } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset } from '@app/utils';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { formatEffectiveDate } from '@app/components/transactions/history/helpers.ts';
import { EmptyText, ListItemWrapper, ListWrapper } from '@app/components/transactions/history/List.styles.ts';
import {
    BlockInfoWrapper,
    ButtonWrapper,
    Chip,
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
const formatWait = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
};

type Row = { change: L2BalanceChange; burn?: never } | { burn: L2Burn; change?: never };
const rowTime = (row: Row) => (row.change ?? row.burn).timestamp;

// History and burns in one feed, newest first. `filter` is the FilterSelect value.
export default function L2Activity({ account, filter }: { account: L2Account; filter: string }) {
    const { t } = useTranslation('wallet');
    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [burns, setBurns] = useState<L2Burn[]>([]);
    const [claiming, setClaiming] = useState<string | null>(null);

    // Every L2 state update hands us a new account, including the one sent when a claim
    // is accepted and its burn moves to claimed, so the list follows the state.
    useEffect(() => {
        invoke<L2Burn[]>('l2_claimable_burns')
            .then(setBurns)
            .catch((e) => console.warn('Could not load L2 burns:', e));
    }, [account]);

    async function claim(commitment: string) {
        setClaiming(commitment);
        try {
            await invoke('l2_claim_burn', { commitment });
            addToast({ title: t('l2.claim.submitted'), type: 'success' });
        } catch (e) {
            addToast({ title: t('l2.claim.failed'), text: String(e), type: 'error' });
        } finally {
            setClaiming(null);
        }
    }

    const rows: Row[] = [
        ...(filter === 'l2.filter.waiting-claims' ? [] : account.history.map((change) => ({ change }))),
        ...(filter === 'transactions' ? [] : burns.filter((b) => b.status !== 'claimed').map((burn) => ({ burn }))),
    ].sort((a, b) => rowTime(b) - rowTime(a));

    const xtr = (value: number) =>
        hideBalance ? '***' : formatNumber(Math.abs(value), FormatPreset.XTM_COMPACT).toLowerCase();
    const selected = account.history.find((change) => change.id === selectedId);
    const tx = selected?.transaction_id
        ? account.transactions.find((transaction) => transaction.id === selected.transaction_id)
        : undefined;

    return (
        <ListWrapper>
            {!rows.length && <EmptyText data-testid="l2-history-empty">{t('l2.empty')}</EmptyText>}
            <ListItemWrapper>
                {rows.map(({ change, burn }) =>
                    burn ? (
                        <L2BurnRow
                            key={burn.commitment}
                            burn={burn}
                            amount={xtr(burn.amount)}
                            claiming={claiming}
                            onClaim={() => claim(burn.commitment)}
                        />
                    ) : (
                        <L2HistoryRow key={change.id} onDetails={() => setSelectedId(change.id)}>
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
                    )
                )}
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

interface L2BurnRowProps {
    burn: L2Burn;
    amount: string;
    claiming: string | null;
    onClaim: () => void;
}

// A burn row: a Pending chip until it's mined, a Waiting chip until the L2 has imported
// the L1 block it was mined in, then the Claim button. Without the mined height or the
// L2 height the button shows, so nothing gets stuck.
function L2BurnRow({ burn, amount, claiming, onClaim }: L2BurnRowProps) {
    const { t } = useTranslation('wallet');
    const stats = useL2WalletStore((s) => s.networkStats);
    const blocksToWait = burn.mined_height === null || !stats ? 0 : Math.max(0, burn.mined_height - stats.block_height);
    const waiting = burn.status === 'claimable' && blocksToWait > 0;

    let status = t('l2.claim.ready');
    if (burn.status === 'pending') status = t('l2.claim.pending');
    else if (burn.status === 'foreign') status = t('l2.claim.foreign');
    else if (waiting && stats) {
        status = t('l2.claim.claimable-in', {
            count: blocksToWait,
            time: formatWait(blocksToWait * stats.block_target_secs),
        });
    }
    let chip = '';
    if (burn.status === 'pending') chip = t('l2.claim.chip-pending');
    else if (waiting) chip = t('l2.claim.chip-waiting');

    return (
        <ItemWrapper style={{ minHeight: 48 }} title={burn.commitment} data-testid="l2-claim-row">
            <ContentWrapper>
                <Content>
                    <BlockInfoWrapper>
                        <TitleWrapper>{t('tabs.burn')}</TitleWrapper>
                        <TimeWrapper variant="p" data-testid="l2-claim-status">
                            {status}
                        </TimeWrapper>
                    </BlockInfoWrapper>
                </Content>
                <Content>
                    {chip && (
                        <Chip data-testid="l2-claim-chip">
                            <span>{chip}</span>
                        </Chip>
                    )}
                    <ValueWrapper>
                        {amount}
                        <CurrencyText>{`XTR`}</CurrencyText>
                    </ValueWrapper>
                    {burn.status === 'claimable' && !waiting && (
                        <Button
                            size="smaller"
                            variant="black"
                            disabled={claiming !== null}
                            onClick={onClaim}
                            data-testid="l2-claim-button"
                        >
                            {claiming === burn.commitment ? t('l2.claim.claiming') : t('l2.claim.cta')}
                        </Button>
                    )}
                </Content>
            </ContentWrapper>
        </ItemWrapper>
    );
}
// A history row with the same hover-to-reveal View details button as the L1 rows.
function L2HistoryRow({ onDetails, children }: { onDetails: () => void; children: React.ReactNode }) {
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
