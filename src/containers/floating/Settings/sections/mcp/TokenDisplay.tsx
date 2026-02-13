import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';

export default function TokenDisplay() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const redactedToken = useConfigMcpStore((s) => s.bearer_token_redacted);
    const tokenCreatedAt = useConfigMcpStore((s) => s.token_created_at);
    const tokenExpiresAt = useConfigMcpStore((s) => s.token_expires_at);
    const [revealed, setRevealed] = useState(false);
    const [fullToken, setFullToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleReveal = useCallback(async () => {
        if (revealed) {
            setRevealed(false);
            setFullToken(null);
            return;
        }
        try {
            const token = await invoke<string | null>('get_mcp_token');
            setFullToken(token);
            setRevealed(true);
        } catch (e) {
            console.error('Failed to get MCP token:', e);
        }
    }, [revealed]);

    const handleCopy = useCallback(async () => {
        try {
            const token = fullToken || (await invoke<string | null>('get_mcp_token'));
            if (token) {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (e) {
            console.error('Failed to copy token:', e);
        }
    }, [fullToken]);

    const handleRefreshExpiry = useCallback(async () => {
        try {
            await invoke('refresh_mcp_token_expiry');
            const config = await invoke<Record<string, unknown>>('get_mcp_config');
            useConfigMcpStore.setState((c) => ({ ...c, ...config }));
        } catch (e) {
            console.error('Failed to refresh token expiry:', e);
        }
    }, []);

    const handleRevoke = useCallback(async () => {
        if (!confirm(t('mcp.token-display.revoke-confirm'))) return;
        try {
            await invoke('revoke_mcp_token');
            useConfigMcpStore.setState((c) => ({
                ...c,
                enabled: false,
                bearer_token_redacted: undefined,
                token_created_at: undefined,
                token_expires_at: undefined,
            }));
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
