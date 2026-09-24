import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import type { L2Account, L2Burn } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset } from '@app/utils';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    BlockInfoWrapper,
    Content,
    ContentWrapper,
    CurrencyText,
    ItemWrapper,
    TimeWrapper,
    TitleWrapper,
    ValueWrapper,
} from '@app/components/transactions/history/transactionHistoryItem/HistoryItem.styles.ts';

const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' } as const;

export default function L2ClaimBurns({ account }: { account: L2Account }) {
    const { t } = useTranslation('wallet');
    const [burns, setBurns] = useState<L2Burn[]>([]);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    // Every L2 state update hands us a new account, including the one sent when a claim
    // is accepted and its burn moves to claimed, so the list follows the state.
    useEffect(() => {
        invoke<L2Burn[]>('l2_claimable_burns')
            .then(setBurns)
            .catch((e) => console.warn('Could not load L2 burns:', e));
    }, [account]);

    async function claim(commitment: string) {
        setClaiming(commitment);
        setMessage('');
        try {
            await invoke('l2_claim_burn', { commitment });
            setMessage(t('l2.claim.submitted'));
        } catch (e) {
            setMessage(String(e));
        } finally {
            setClaiming(null);
        }
    }

    const open = burns.filter((burn) => burn.status !== 'claimed');
    if (!open.length && !message) return null;

    return (
        <div style={sectionStyle} data-testid="l2-claim-burns">
            <Typography variant="h6">{t('l2.claim.title')}</Typography>
            {/* The backend lists burns newest first. */}
            <div>
                {open.map((burn) => (
                    <ItemWrapper
                        key={burn.commitment}
                        style={{ height: 48 }}
                        title={burn.commitment}
                        data-testid="l2-claim-row"
                    >
                        <ContentWrapper>
                            <Content>
                                <BlockInfoWrapper>
                                    <TitleWrapper>{t('tabs.burn')}</TitleWrapper>
                                    <TimeWrapper variant="p">
                                        {burn.status === 'claimable' ? t('l2.claim.ready') : t('l2.claim.pending')}
                                    </TimeWrapper>
                                </BlockInfoWrapper>
                            </Content>
                            <Content>
                                <ValueWrapper>
                                    {formatNumber(burn.amount, FormatPreset.XTM_LONG_DEC)}
                                    <CurrencyText>{`XTR`}</CurrencyText>
                                </ValueWrapper>
                                {burn.status === 'claimable' && (
                                    <Button
                                        size="small"
                                        variant="black"
                                        disabled={claiming !== null}
                                        onClick={() => claim(burn.commitment)}
                                        data-testid="l2-claim-button"
                                    >
                                        {claiming === burn.commitment ? t('l2.claim.claiming') : t('l2.claim.cta')}
                                    </Button>
                                )}
                            </Content>
                        </ContentWrapper>
                    </ItemWrapper>
                ))}
            </div>
            {message && (
                <Typography variant="p" style={{ wordBreak: 'break-all' }} data-testid="l2-claim-message">
                    {message}
                </Typography>
            )}
        </div>
    );
}
