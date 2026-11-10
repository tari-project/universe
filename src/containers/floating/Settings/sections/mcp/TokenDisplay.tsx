import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { invoke } from '@tauri-apps/api/core';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { useCallback, useState } from 'react';
import { requestPin } from '@app/store/useSecurityStore';
import { addToast } from '@app/components/ToastStack/useToastStore';

interface EpochTimestamp {
    secs_since_epoch: number;
}

const formatEpochDate = (ts?: EpochTimestamp): string =>
    ts ? new Date(ts.secs_since_epoch * 1000).toLocaleDateString() : '';

const computeDaysRemaining = (expiresAt?: EpochTimestamp | null): number | null =>
    expiresAt ? Math.max(0, Math.ceil((expiresAt.secs_since_epoch * 1000 - Date.now()) / (1000 * 60 * 60 * 24))) : null;

// Fail closed while the PIN state is unknown (undefined): only a wallet known
// to have no PIN reveals the token without a PIN prompt (#3518).
async function requestUnredactedMcpToken(isPinLocked: boolean | undefined): Promise<string | null | 'cancelled'> {
    if (isPinLocked === false) {
        return invoke<string | null>('get_mcp_token', { pin: null });
    }
    const pin = await requestPin();
    if (!pin) return 'cancelled';
    return invoke<string | null>('get_mcp_token', { pin });
}

async function refreshTokenExpiry(): Promise<void> {
    try {
        await invoke('refresh_mcp_token_expiry');
    } catch (e) {
        console.error('Failed to refresh token expiry:', e);
    }
}

async function revokeMcpToken(confirmText: string, onRevoked: () => void): Promise<void> {
    if (!confirm(confirmText)) return;
    try {
        await invoke('revoke_mcp_token');
        onRevoked();
    } catch (e) {
        console.error('Failed to revoke token:', e);
    }
}

function TokenExpiryFooter({
    createdAt,
    expiresAt,
}: {
    createdAt?: EpochTimestamp | null;
    expiresAt?: EpochTimestamp | null;
}) {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    if (!createdAt) return null;
    const daysRemaining = computeDaysRemaining(expiresAt);

    return (
        <Typography variant="p" style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            {t('mcp.token-display.created')}: {formatEpochDate(createdAt)}
            {expiresAt && ` · ${t('mcp.token-display.expires')}: ${formatEpochDate(expiresAt)}`}
            {daysRemaining !== null && ` (${t('mcp.token-display.days-remaining', { days: daysRemaining })})`}
        </Typography>
    );
}

function useTokenRevealAndCopy(isPinLocked: boolean | undefined) {
    const [revealed, setRevealed] = useState(false);
    const [fullToken, setFullToken] = useState<string | null>(null);
    const { copyToClipboard, isCopied: copied } = useCopyToClipboard();

    const clearRevealed = useCallback(() => {
        setRevealed(false);
        setFullToken(null);
    }, []);

    const handleReveal = useCallback(async () => {
        if (revealed) {
            clearRevealed();
            return;
        }
        try {
            const token = await requestUnredactedMcpToken(isPinLocked);
            if (token === 'cancelled') return;
            setFullToken(token);
            setRevealed(true);
        } catch (e) {
            addToast({ title: 'Failed to reveal token', text: String(e), type: 'error' });
        }
    }, [clearRevealed, isPinLocked, revealed]);

    const handleCopy = useCallback(async () => {
        if (fullToken) {
            copyToClipboard(fullToken);
            return;
        }
        try {
            const token = await requestUnredactedMcpToken(isPinLocked);
            if (token && token !== 'cancelled') {
                copyToClipboard(token);
            }
        } catch (e) {
            addToast({ title: 'Failed to copy token', text: String(e), type: 'error' });
        }
    }, [copyToClipboard, fullToken, isPinLocked]);

    return { revealed, fullToken, copied, clearRevealed, handleReveal, handleCopy };
}

export default function TokenDisplay() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const redactedToken = useConfigMcpStore((s) => s.bearer_token_redacted);
    const tokenCreatedAt = useConfigMcpStore((s) => s.token_created_at);
    const tokenExpiresAt = useConfigMcpStore((s) => s.token_expires_at);
    const isPinLocked = useWalletStore((s) => s.is_pin_locked);

    const { revealed, fullToken, copied, clearRevealed, handleReveal, handleCopy } =
        useTokenRevealAndCopy(isPinLocked);

    const handleRevoke = useCallback(
        () => revokeMcpToken(t('mcp.token-display.revoke-confirm'), clearRevealed),
        [clearRevealed, t]
    );

    if (!enabled || !redactedToken) return null;

    const displayToken = revealed && fullToken ? fullToken : redactedToken;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.token-display.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('mcp.token-display.description')}</Typography>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <code style={{ fontSize: 12, wordBreak: 'break-all' }} data-testid="mcp-token-value">
                            {displayToken}
                        </code>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                            onClick={handleReveal}
                            style={{ fontSize: 11, cursor: 'pointer' }}
                            data-testid="mcp-token-reveal"
                        >
                            {revealed ? t('mcp.token-display.hide') : t('mcp.token-display.reveal')}
                        </button>
                        <button
                            onClick={handleCopy}
                            style={{ fontSize: 11, cursor: 'pointer' }}
                            data-testid="mcp-token-copy"
                        >
                            {copied ? t('mcp.token-display.copied') : t('mcp.token-display.copy')}
                        </button>
                        <button
                            onClick={refreshTokenExpiry}
                            style={{ fontSize: 11, cursor: 'pointer' }}
                            data-testid="mcp-token-refresh"
                        >
                            {t('mcp.token-display.refresh-expiry')}
                        </button>
                        <button
                            onClick={handleRevoke}
                            style={{ fontSize: 11, cursor: 'pointer', color: '#e55' }}
                            data-testid="mcp-token-revoke"
                        >
                            {t('mcp.token-display.revoke')}
                        </button>
                    </div>
                    <TokenExpiryFooter createdAt={tokenCreatedAt} expiresAt={tokenExpiresAt} />
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
