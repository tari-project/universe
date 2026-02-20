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
import { requestPin } from '@app/store/useSecurityStore';
import { addToast } from '@app/components/ToastStack/useToastStore';

export default function TransactionSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const transactionsEnabled = useConfigMcpStore((s) => s.transactions_enabled);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        try {
            const pin = await requestPin();
            if (!pin) {
                setLoading(false);
                return;
            }
            await invoke('set_mcp_transactions_enabled', { enabled: checked, pin });
            useConfigMcpStore.setState((c) => ({ ...c, transactions_enabled: checked }));
        } catch (e) {
            addToast({ title: 'Failed to update transaction setting', text: String(e), type: 'error' });
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
