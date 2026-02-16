import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export default function TransactionSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const transactionsEnabled = useConfigMcpStore((s) => s.transactions_enabled);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
    const [pin, setPin] = useState('');

    const handleToggle = (checked: boolean) => {
        setError(null);
        setPin('');
        setPendingToggle(checked);
    };

    const handlePinSubmit = async () => {
        if (pin.length < 4 || pendingToggle === null) return;
        setLoading(true);
        setError(null);
        try {
            await invoke('set_mcp_transactions_enabled', { enabled: pendingToggle, pin });
            useConfigMcpStore.setState((c) => ({ ...c, transactions_enabled: pendingToggle }));
            setPendingToggle(null);
            setPin('');
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    if (!enabled) return null;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.transactions.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('mcp.transactions.description')}</Typography>
                    {pendingToggle !== null && (
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
                                disabled={loading}
                            />
                            <button
                                onClick={handlePinSubmit}
                                disabled={pin.length < 4 || loading}
                                style={{ fontSize: 11, cursor: pin.length >= 4 ? 'pointer' : 'default' }}
                            >
                                {t('mcp.transactions.confirm')}
                            </button>
                            <button
                                onClick={() => { setPendingToggle(null); setPin(''); setError(null); }}
                                style={{ fontSize: 11, cursor: 'pointer' }}
                                disabled={loading}
                            >
                                {t('mcp.transactions.cancel')}
                            </button>
                        </div>
                    )}
                    {error && (
                        <Typography variant="p" style={{ color: '#e55', fontSize: 11 }}>
                            {error}
                        </Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={transactionsEnabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                        disabled={loading}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
