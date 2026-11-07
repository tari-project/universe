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
import { setMcpServerError, useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const configuredPort = useConfigMcpStore((s) => s.port);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const serverError = useMcpStore((s) => s.serverError);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        setMcpServerError(null);
        try {
            await invoke('set_mcp_enabled', { enabled: checked });
            useConfigMcpStore.setState((c) => ({ ...c, enabled: checked }));
        } catch (e) {
            console.error('Failed to toggle MCP server:', e);
            const errStr = String(e);
            if (errStr.includes('failed to bind to configured port')) {
                setMcpServerError(t('mcp.advanced.port-in-use', { port: configuredPort }));
            } else {
                setMcpServerError(errStr);
            }
        } finally {
            setLoading(false);
        }
    };

    const statusText =
        serverRunning && serverPort
            ? t('mcp.server-toggle.status-running', { port: serverPort })
            : enabled
              ? t('mcp.server-toggle.status-stopped-port', { port: configuredPort })
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
                    {serverError && (
                        <Typography
                            variant="p"
                            style={{ color: '#ff4d4f', marginTop: 4 }}
                            data-testid="mcp-server-error"
                        >
                            {serverError}
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
