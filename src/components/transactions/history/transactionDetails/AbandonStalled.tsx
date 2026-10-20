import { useState } from 'react';
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
    abandon_burn_unreconcilable: 'abandon.error-burn-unreconcilable',
};

type Step = 'idle' | 'confirm' | 'confirm-unreconcilable' | 'done';

interface Props {
    /** The backend's id of the stalled send or burn. */
    stalledId: string;
    isBurn?: boolean;
}

/** For a send or burn the network keeps refusing: says so, and lets the user give it up. */
export function AbandonStalled({ stalledId, isBurn = false }: Props) {
    const { t } = useTranslation('wallet');
    const [step, setStep] = useState<Step>('idle');
    const [error, setError] = useState<string>();

    async function handleAbandon(acceptUnreconcilable: boolean) {
        setError(undefined);
        try {
            await invoke('abandon_stalled_transaction', { txId: stalledId, acceptUnreconcilable });
            setStep('done');
        } catch (e) {
            const code = commandErrorCode(e);
            if (code === 'abandon_no_change_output') {
                // A burn is never abandoned without a change output: the wallet couldn't tell it landing.
                if (isBurn) {
                    setError(t('abandon.error-burn-unreconcilable'));
                } else {
                    setStep('confirm-unreconcilable');
                }
                return;
            }
            const key = (code && ABANDON_ERROR_KEYS[code]) || sendErrorKey(e);
            setError(key ? t(key) : `${t('abandon.error-message')}${commandErrorMessage(e)}`);
        }
    }

    if (step === 'done') {
        return <Typography variant="p">{t('abandon.done')}</Typography>;
    }

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
                    <Typography variant="p">{isBurn ? t('abandon.burn-note') : t('abandon.note')}</Typography>
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
