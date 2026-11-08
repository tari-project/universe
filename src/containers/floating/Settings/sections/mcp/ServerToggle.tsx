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
import styled from 'styled-components';

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

    const describeError = (e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        const lower = message.toLowerCase();
        const portMatch = message.match(/port (\d+)/i);
        const port = portMatch ? Number(portMatch[1]) : configuredPort;
        if (
            lower.includes('failed to bind') ||
            lower.includes('address already in use') ||
            lower.includes('eaddrinuse')
        ) {
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
                    {error && <ServerError data-testid="mcp-server-error">{error}</ServerError>}
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
