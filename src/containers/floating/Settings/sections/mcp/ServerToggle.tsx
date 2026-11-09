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
import { isPortInUseError } from './mcpPortError';

const ServerError = styled.p`
    margin: 4px 0 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.palette.error.main};
`;

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const configuredPort = useConfigMcpStore((s) => s.port);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Drop a stale error once the server is actually running again (the user fixed
    // the port) or the whole feature is disabled.
    useEffect(() => {
        if (serverRunning || !enabled) setError(null);
    }, [serverRunning, enabled]);

    const describeError = (e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        const portMatch = message.match(/port (\d+)/i);
        const port = portMatch ? Number(portMatch[1]) : configuredPort;
        if (isPortInUseError(e)) {
            return t('mcp.advanced.port-in-use', { port });
        }
        return t('mcp.advanced.port-error', { port });
    };

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        setError(null);
        try {
            await invoke('set_mcp_enabled', { enabled: checked });
            useConfigMcpStore.setState((c) => ({ ...c, enabled: checked }));
        } catch (e) {
            console.error('Failed to toggle MCP server:', e);
            // set_mcp_enabled saves the flag before it starts the listener, so a
            // failed start leaves MCP enabled-but-stopped. Keep the store in step
            // with that persisted state so the port field stays available.
            if (checked) useConfigMcpStore.setState((c) => ({ ...c, enabled: true }));
            setError(describeError(e));
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
                    {error && (
                        <ServerError data-testid="mcp-server-error" role="alert">
                            {error}
                        </ServerError>
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
