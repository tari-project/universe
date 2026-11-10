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
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const StatusError = styled.p`
    margin: 0;
    font-size: 13px;
    color: ${({ theme }) => theme.palette.error.main};
`;

// Marker in the error built by McpServerManager::start (src-tauri/src/mcp/server.rs)
// when the configured port cannot be bound.
const BIND_ERROR_MARKER = 'failed to bind to configured port';

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const configuredPort = useConfigMcpStore((s) => s.port);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Drop a stale error once the server is actually running again (the user
    // fixed the port and the restart succeeded) or the server is off.
    useEffect(() => {
        if (serverRunning || !enabled) {
            setError(null);
        }
    }, [serverRunning, enabled]);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        setError(null);
        try {
            await invoke('set_mcp_enabled', { enabled: checked });
            useConfigMcpStore.setState((c) => ({ ...c, enabled: checked }));
        } catch (e) {
            console.error('Failed to toggle MCP server:', e);
            if (String(e).includes(BIND_ERROR_MARKER)) {
                // set_mcp_enabled saves `enabled` before attempting to bind,
                // so keep the store on the persisted value: the port field
                // stays visible and the user can pick another port.
                if (checked) {
                    useConfigMcpStore.setState((c) => ({ ...c, enabled: true }));
                }
                setError(t('mcp.server-toggle.port-in-use', { port: configuredPort }));
            } else {
                setError(t('mcp.server-toggle.start-failed'));
            }
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
                    {error ? (
                        <StatusError role="alert" data-testid="mcp-server-error">
                            {error}
                        </StatusError>
                    ) : null}
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
