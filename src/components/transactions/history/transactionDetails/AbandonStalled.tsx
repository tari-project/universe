import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ErrorText } from '@app/components/transactions/components/TxInput.style.ts';
import { commandErrorCode, commandErrorMessage, sendErrorKey } from '@app/components/transactions/send/types.ts';

// Why the wallet refused to abandon, by the backend's error code.
const ABANDON_ERROR_KEYS: Record<string, string> = {
    abandon_not_found: 'abandon.error-not-found',
    abandon_not_pending: 'abandon.error-not-pending',
    abandon_not_stalled: 'abandon.error-not-stalled',
    abandon_input_spent: 'abandon.error-input-spent',
    abandon_change_in_use: 'abandon.error-change-in-use',
    abandon_change_already_mined: 'abandon.error-change-already-mined',
};

type Step = 'idle' | 'confirm' | 'confirm-unreconcilable' | 'done';

interface Props {
    transactionId: number;
    expanded: boolean;
}

/** For a send or burn the network keeps refusing: says so, and lets the user give it up. */
export function AbandonStalled({ transactionId, expanded }: Props) {
    const { t } = useTranslation('wallet');
    // The backend's id: a u64 that a JavaScript number can't always hold exactly.
    const [stalledId, setStalledId] = useState<string>();
    const [step, setStep] = useState<Step>('idle');
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!expanded) return;
        invoke('get_stalled_transaction_ids')
            .then((ids) => setStalledId(ids.find((id) => Number(id) === transactionId)))
            .catch((e) => console.error('Could not read stalled transactions:', e));
    }, [expanded, transactionId]);

    async function handleAbandon(acceptUnreconcilable: boolean) {
        if (!stalledId) return;
        setError(undefined);
        try {
            await invoke('abandon_stalled_transaction', { txId: stalledId, acceptUnreconcilable });
            setStep('done');
        } catch (e) {
            const code = commandErrorCode(e);
            if (code === 'abandon_no_change_output') {
                setStep('confirm-unreconcilable');
                return;
            }
            const key = (code && ABANDON_ERROR_KEYS[code]) || sendErrorKey(e);
            setError(key ? t(key) : `${t('abandon.error-message')}${commandErrorMessage(e)}`);
        }
    }

    if (step === 'done') {
        return <Typography variant="p">{t('abandon.done')}</Typography>;
    }
    if (!stalledId) return null;

    return (
        <div data-testid="tx-details-stalled">
            <Typography variant="p">{t('abandon.stalled')}</Typography>
            {step === 'idle' && (
                <Button size="large" fluid onClick={() => setStep('confirm')} data-testid="tx-details-abandon">
                    {t('abandon.cta')}
                </Button>
            )}
            {step === 'confirm' && (
                <>
                    <Typography variant="p">{t('abandon.note')}</Typography>
                    <Button
                        size="large"
                        fluid
                        onClick={() => handleAbandon(false)}
                        data-testid="tx-details-abandon-confirm"
                    >
                        {t('abandon.confirm')}
                    </Button>
                </>
            )}
            {step === 'confirm-unreconcilable' && (
                <>
                    <Typography variant="p">{t('abandon.unreconcilable-note')}</Typography>
                    <Button
                        size="large"
                        fluid
                        onClick={() => handleAbandon(true)}
                        data-testid="tx-details-abandon-anyway"
                    >
                        {t('abandon.confirm-anyway')}
                    </Button>
                </>
            )}
            {error && <ErrorText>{error}</ErrorText>}
        </div>
    );
}
