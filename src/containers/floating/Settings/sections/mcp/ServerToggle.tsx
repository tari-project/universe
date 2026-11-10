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
import { isMcpPortBindError, setMcpPortError, setMcpServerStatus, useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import styled from 'styled-components';

const ToggleErrorMessage = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.palette.error.main};
    margin-top: 2px;
`;

function recordEnableFailure(error: unknown): string | null {
    if (isMcpPortBindError(error)) {
        const configuredPort = useConfigMcpStore.getState().port;
        useConfigMcpStore.setState((c) => ({ ...c, enabled: true }));
        setMcpServerStatus(false, null);
        setMcpPortError({ kind: 'in-use', port: configuredPort });
        return null;
    }
    return String(error);
}

// Persists the enabled flag and records a port conflict in the store when starting the listener
// fails on an occupied port, keeping the Advanced section visible so the user can pick a free port.
async function applyMcpServerToggle(checked: boolean): Promise<string | null> {
    try {
        await invoke('set_mcp_enabled', { enabled: checked });
        useConfigMcpStore.setState((c) => ({ ...c, enabled: checked }));
        setMcpPortError(null);
        return null;
    } catch (e) {
        console.error('Failed to toggle MCP server:', e);
        if (!checked) return null;
        return recordEnableFailure(e);
    }
}

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const [loading, setLoading] = useState(false);
    const [toggleError, setToggleError] = useState<string | null>(null);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        setToggleError(null);
        try {
            const failure = await applyMcpServerToggle(checked);
            setToggleError(failure);
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
                    {toggleError && (
                        <ToggleErrorMessage role="alert" data-testid="mcp-server-toggle-error">
                            {t('mcp.server-toggle.start-failed', { reason: toggleError })}
                        </ToggleErrorMessage>
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
