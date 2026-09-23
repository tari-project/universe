import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useMcpStore, setMcpPendingTransaction, setMcpTxStatus } from '@app/store/useMcpStore';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { SendReview } from '@app/components/transactions/send/SendReview/SendReview';
import { StyledForm, Wrapper } from '@app/components/transactions/send/Send.styles';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button';
import { TransactionContextSummary } from '@app/components/transactions/send/TransactionContextSummary';

const TIMEOUT_SECS = 120;
function noop() {
    // unused - SendReview requires setStatus but MCP controls status externally
}

export default function McpTransactionDialog() {
    const { t } = useTranslation(['wallet', 'settings'], { useSuspense: false });
    const pending = useMcpStore((s) => s.pendingTransaction);
    const mcpTxStatus = useMcpStore((s) => s.mcpTxStatus);
    const [countdown, setCountdown] = useState(TIMEOUT_SECS);
    const [submitting, setSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // An `app` origin means the send command itself asked the backend to confirm, because
    // no PIN is configured. The modal that started the send owns the progress/result UI,
    // so this dialog is a plain approve/deny prompt in that case.
    const isAppOrigin = pending?.origin === 'app';

    const handleDeny = useCallback(async () => {
        if (!pending) return;
        try {
            await invoke('mcp_transaction_dialog_response', {
                requestId: pending.request_id,
                approved: false,
            });
        } catch (e) {
            console.error('Failed to deny transaction:', e);
        }
        setMcpPendingTransaction(null);
    }, [pending]);

    const handleClose = useCallback(() => {
        setMcpPendingTransaction(null);
    }, []);

    useEffect(() => {
        if (!pending) return;
        setCountdown(TIMEOUT_SECS);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleDeny();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [pending, handleDeny]);

    const handleApprove = useCallback(async () => {
        if (!pending) return;
        setSubmitting(true);
        try {
            await invoke('mcp_transaction_dialog_response', {
                requestId: pending.request_id,
                approved: true,
            });
            if (isAppOrigin) {
                setMcpPendingTransaction(null);
            } else {
                setMcpTxStatus('processing');
            }
        } catch (e) {
            console.error('Failed to approve transaction:', e);
        } finally {
            setSubmitting(false);
        }
    }, [pending, isAppOrigin]);

    const handleFormSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (isAppOrigin || mcpTxStatus === 'reviewing') {
                handleApprove();
            }
        },
        [isAppOrigin, mcpTxStatus, handleApprove]
    );

    if (!pending) return null;

    // Convert micro minotari to XTM for SendReview (it expects XTM and multiplies by 1_000_000)
    const amountXtm = pending.amount_micro_minotari / 1_000_000;

    const getTitle = () => {
        if (!isAppOrigin && (mcpTxStatus === 'processing' || mcpTxStatus === 'completed')) {
            return undefined;
        }
        return isAppOrigin ? t('wallet:send.confirm-title') : t('wallet:send.review-title');
    };

    return (
        <TransactionModal
            show={!!pending}
            title={getTitle()}
            handleClose={!isAppOrigin && mcpTxStatus !== 'reviewing' ? handleClose : undefined}
            handleBack={isAppOrigin || mcpTxStatus === 'reviewing' ? handleDeny : undefined}
        >
            <Wrapper $isLoading={submitting}>
                <StyledForm ref={formRef} onSubmit={handleFormSubmit}>
                    {(isAppOrigin || mcpTxStatus === 'reviewing') && (
                        <Typography
                            variant="p"
                            style={{ opacity: 0.5, fontSize: 11, textAlign: 'center' }}
                            data-testid="mcp-tx-countdown"
                        >
                            {t('settings:mcp.transaction-dialog.remaining', { countdown })}
                        </Typography>
                    )}
                    {isAppOrigin ? (
                        <>
                            <TransactionContextSummary
                                amountMicroMinotari={pending.amount_micro_minotari}
                                destination={pending.destination}
                                paymentId={pending.payment_id}
                                subtitle={t('wallet:send.confirm-subtitle')}
                            />
                            <Button
                                type="submit"
                                fluid
                                size="xlarge"
                                variant="green"
                                disabled={submitting}
                                data-testid="app-tx-confirm-button"
                            >
                                {t('wallet:send.cta-confirm')}
                            </Button>
                        </>
                    ) : (
                        <SendReview
                            status={mcpTxStatus}
                            setStatus={noop}
                            amount={amountXtm}
                            address={pending.destination}
                            handleClose={handleClose}
                        />
                    )}
                </StyledForm>
            </Wrapper>
        </TransactionModal>
    );
}
