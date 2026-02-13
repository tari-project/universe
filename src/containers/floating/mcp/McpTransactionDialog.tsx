import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useMcpStore, setMcpPendingTransaction } from '@app/store/useMcpStore';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography';

const TIMEOUT_SECS = 120;

export default function McpTransactionDialog() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const pending = useMcpStore((s) => s.pendingTransaction);
    const [pin, setPin] = useState('');
    const [countdown, setCountdown] = useState(TIMEOUT_SECS);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!pending) return;
        setPin('');
        setCountdown(TIMEOUT_SECS);
        setError(null);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setMcpPendingTransaction(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [pending]);

    const handleApprove = useCallback(async () => {
        if (!pending || !pin) return;
        setSubmitting(true);
        setError(null);
        try {
            await invoke('mcp_transaction_dialog_response', {
                requestId: pending.request_id,
                approved: true,
                pin,
            });
            setMcpPendingTransaction(null);
        } catch (e) {
            setError(String(e));
        } finally {
            setSubmitting(false);
        }
    }, [pending, pin]);

    const handleDeny = useCallback(async () => {
        if (!pending) return;
        try {
            await invoke('mcp_transaction_dialog_response', {
                requestId: pending.request_id,
                approved: false,
                pin: null,
            });
        } catch (e) {
            console.error('Failed to deny transaction:', e);
        }
        setMcpPendingTransaction(null);
    }, [pending]);

    if (!pending) return null;

    const truncatedDest =
        pending.destination.length > 20
            ? `${pending.destination.slice(0, 10)}...${pending.destination.slice(-10)}`
            : pending.destination;

    return (
        <Dialog open={!!pending} onOpenChange={() => handleDeny()}>
            <DialogContent>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Typography variant="h4">{t('mcp.transaction-dialog.title')}</Typography>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                            <Typography variant="p" style={{ opacity: 0.6, fontSize: 11 }}>
                                {t('mcp.transaction-dialog.destination')}
                            </Typography>
                            <Typography variant="p" style={{ wordBreak: 'break-all', fontSize: 13 }}>
                                {truncatedDest}
                            </Typography>
                        </div>
                        <div>
                            <Typography variant="p" style={{ opacity: 0.6, fontSize: 11 }}>
                                {t('mcp.transaction-dialog.amount')}
                            </Typography>
                            <Typography variant="h5">{pending.amount_display}</Typography>
                            <Typography variant="p" style={{ opacity: 0.5, fontSize: 11 }}>
                                {t('mcp.transaction-dialog.micro-minotari', {
                                    amount: pending.amount_micro_minotari.toLocaleString(),
                                })}
                            </Typography>
                        </div>
                    </div>

                    <div>
                        <Typography variant="p" style={{ fontSize: 11, marginBottom: 4 }}>
                            {t('mcp.transaction-dialog.enter-pin')}
                        </Typography>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={6}
                            placeholder="PIN"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: 16,
                                letterSpacing: 8,
                                textAlign: 'center',
                                borderRadius: 8,
                                border: '1px solid rgba(128,128,128,0.3)',
                                background: 'transparent',
                                color: 'inherit',
                            }}
                            autoFocus
                            disabled={submitting}
                        />
                    </div>

                    {error && (
                        <Typography variant="p" style={{ color: '#e55', fontSize: 11 }}>
                            {error}
                        </Typography>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="p" style={{ opacity: 0.5, fontSize: 11 }}>
                            {t('mcp.transaction-dialog.remaining', { countdown })}
                        </Typography>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={handleDeny}
                                disabled={submitting}
                                style={{ padding: '8px 20px', cursor: 'pointer', borderRadius: 8 }}
                            >
                                {t('mcp.transaction-dialog.deny')}
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={submitting || pin.length < 4}
                                style={{
                                    padding: '8px 20px',
                                    cursor: pin.length >= 4 ? 'pointer' : 'default',
                                    borderRadius: 8,
                                    opacity: pin.length >= 4 ? 1 : 0.5,
                                }}
                            >
                                {submitting ? '...' : t('mcp.transaction-dialog.approve')}
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
