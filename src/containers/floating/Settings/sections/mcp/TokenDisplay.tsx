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
import { useCallback, useState } from 'react';

export default function TokenDisplay() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const redactedToken = useConfigMcpStore((s) => s.bearer_token_redacted);
    const tokenCreatedAt = useConfigMcpStore((s) => s.token_created_at);
    const tokenExpiresAt = useConfigMcpStore((s) => s.token_expires_at);
    const isPinLocked = useWalletStore((s) => s.is_pin_locked);
    const [revealed, setRevealed] = useState(false);
    const [fullToken, setFullToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [pinPrompt, setPinPrompt] = useState<'reveal' | 'copy' | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async (pinValue?: string) => {
        return invoke<string | null>('get_mcp_token', { pin: pinValue ?? null });
    }, []);

    const handlePinSubmit = useCallback(async () => {
        if (pin.length < 4) return;
        setError(null);
        try {
            const token = await fetchToken(pin);
            if (pinPrompt === 'reveal') {
                setFullToken(token);
                setRevealed(true);
            } else if (pinPrompt === 'copy' && token) {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
            setPinPrompt(null);
            setPin('');
        } catch (e) {
            setError(String(e));
        }
    }, [pin, pinPrompt, fetchToken]);

    const handleReveal = useCallback(async () => {
        if (revealed) {
            setRevealed(false);
            setFullToken(null);
            return;
        }
        setError(null);
        if (isPinLocked) {
            setPin('');
            setPinPrompt('reveal');
        } else {
            try {
                const token = await fetchToken();
                setFullToken(token);
                setRevealed(true);
            } catch (e) {
                setError(String(e));
            }
        }
    }, [revealed, isPinLocked, fetchToken]);

    const handleCopy = useCallback(async () => {
        setError(null);
        if (fullToken) {
            await navigator.clipboard.writeText(fullToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
        }
        if (isPinLocked) {
            setPin('');
            setPinPrompt('copy');
        } else {
            try {
                const token = await fetchToken();
                if (token) {
                    await navigator.clipboard.writeText(token);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            } catch (e) {
                setError(String(e));
            }
        }
    }, [fullToken, isPinLocked, fetchToken]);

    const handleRefreshExpiry = useCallback(async () => {
        try {
            await invoke('refresh_mcp_token_expiry');
        } catch (e) {
            console.error('Failed to refresh token expiry:', e);
        }
    }, []);

    const handleRevoke = useCallback(async () => {
        if (!confirm(t('mcp.token-display.revoke-confirm'))) return;
        try {
            await invoke('revoke_mcp_token');
            setRevealed(false);
            setFullToken(null);
        } catch (e) {
            console.error('Failed to revoke token:', e);
        }
    }, [t]);

    if (!enabled || !redactedToken) return null;

    const displayToken = revealed && fullToken ? fullToken : redactedToken;

    const formatDate = (ts?: { secs_since_epoch: number }) => {
        if (!ts) return '';
        return new Date(ts.secs_since_epoch * 1000).toLocaleDateString();
    };

    const daysRemaining = tokenExpiresAt
        ? Math.max(0, Math.ceil((tokenExpiresAt.secs_since_epoch * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.token-display.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('mcp.token-display.description')}</Typography>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{displayToken}</code>
                    </div>
                    {pinPrompt && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                                maxLength={6}
                                placeholder="PIN"
                                style={{
                                    padding: '4px 8px',
                                    fontSize: 13,
                                    letterSpacing: 4,
                                    width: 100,
                                    borderRadius: 6,
                                    border: '1px solid rgba(128,128,128,0.3)',
                                    background: 'transparent',
                                    color: 'inherit',
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handlePinSubmit}
                                disabled={pin.length < 4}
                                style={{ fontSize: 11, cursor: pin.length >= 4 ? 'pointer' : 'default' }}
                            >
                                {t('mcp.token-display.confirm')}
                            </button>
                            <button
                                onClick={() => {
                                    setPinPrompt(null);
                                    setPin('');
                                    setError(null);
                                }}
                                style={{ fontSize: 11, cursor: 'pointer' }}
                            >
                                {t('mcp.token-display.cancel')}
                            </button>
                        </div>
                    )}
                    {error && (
                        <Typography variant="p" style={{ color: '#e55', fontSize: 11, marginTop: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button onClick={handleReveal} style={{ fontSize: 11, cursor: 'pointer' }}>
                            {revealed ? t('mcp.token-display.hide') : t('mcp.token-display.reveal')}
                        </button>
                        <button onClick={handleCopy} style={{ fontSize: 11, cursor: 'pointer' }}>
                            {copied ? t('mcp.token-display.copied') : t('mcp.token-display.copy')}
                        </button>
                        <button onClick={handleRefreshExpiry} style={{ fontSize: 11, cursor: 'pointer' }}>
                            {t('mcp.token-display.refresh-expiry')}
                        </button>
                        <button onClick={handleRevoke} style={{ fontSize: 11, cursor: 'pointer', color: '#e55' }}>
                            {t('mcp.token-display.revoke')}
                        </button>
                    </div>
                    {tokenCreatedAt && (
                        <Typography variant="p" style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                            {t('mcp.token-display.created')}: {formatDate(tokenCreatedAt)}
                            {tokenExpiresAt && ` · ${t('mcp.token-display.expires')}: ${formatDate(tokenExpiresAt)}`}
                            {daysRemaining !== null &&
                                ` (${t('mcp.token-display.days-remaining', { days: daysRemaining })})`}
                        </Typography>
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
