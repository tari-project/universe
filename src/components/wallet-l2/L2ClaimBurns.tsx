import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import type { L2Account, L2Burn } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 } as const;

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
            {open.map((burn) => (
                <div key={burn.commitment} style={rowStyle} data-testid="l2-claim-row">
                    <Typography variant="p" title={burn.commitment}>
                        {`${formatNumber(burn.amount, FormatPreset.XTM_LONG)} XTR · ${truncateMiddle(burn.commitment, 6)}`}
                    </Typography>
                    {burn.status === 'claimable' ? (
                        <Button
                            size="small"
                            variant="black"
                            disabled={claiming !== null}
                            onClick={() => claim(burn.commitment)}
                            data-testid="l2-claim-button"
                        >
                            {claiming === burn.commitment ? t('l2.claim.claiming') : t('l2.claim.cta')}
                        </Button>
                    ) : (
                        <Typography variant="p">{t('l2.claim.pending')}</Typography>
                    )}
                </div>
            ))}
            {message && (
                <Typography variant="p" style={{ wordBreak: 'break-all' }} data-testid="l2-claim-message">
                    {message}
                </Typography>
            )}
        </div>
    );
}
