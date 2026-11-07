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
import { useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const storePort = useConfigMcpStore((s) => s.port);
    const [loading, setLoading] = useState(false);
    const [enableError, setEnableError] = useState<string | null>(null);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        setEnableError(null);
        try {
            await invoke('set_mcp_enabled', { enabled: checked });
            useConfigMcpStore.setState((c) => ({ ...c, enabled: checked }));
        } catch (e) {
            // Enabling starts the server, so a port that another process already
            // holds fails here instead of in the settings panel. Surface it.
            const message = typeof e === 'string' ? e : e instanceof Error ? e.message : String(e);
            const inUse = /failed to bind to configured port/i.test(message);
            const port = serverPort ?? storePort;
            setEnableError(
                inUse ? t('mcp.advanced.port-in-use', { port }) : t('mcp.advanced.port-error-generic', { port })
            );
            useConfigMcpStore.setState((c) => ({ ...c, enabled: false }));
        } finally {
            setLoading(false);
        }
    };

    const statusText =
        serverRunning && serverPort
            ? t('mcp.server-toggle.status-running', { port: serverPort })
            : t('mcp.server-toggle.status-stopped');

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.server-toggle.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('mcp.server-toggle.description')}</Typography>
                    <Typography variant="p" style={{ opacity: 0.7 }} data-testid="mcp-server-status">
                        {statusText}
                    </Typography>
                    {enableError && (
                        <Typography
                            variant="p"
                            role="alert"
                            data-testid="mcp-enable-error"
                            style={{ color: 'var(--color-error, #d32f2f)' }}
                        >
                            {enableError}
                        </Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={enabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                        disabled={loading}
                        data-testid="mcp-server-toggle"
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
