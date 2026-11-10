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
import { clearMcpPortInUse, reportMcpPortInUse, setMcpServerStatus, useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import styled from 'styled-components';
import { mcpBindWasAttempted, portInUseFromInvokeError } from './portFeedback';

const FieldError = styled.p`
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: ${({ theme }) => theme.palette.error.main};
`;

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const portInUse = useMcpStore((s) => s.portInUse);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        clearMcpPortInUse();
        try {
            await invoke('set_mcp_enabled', { enabled: checked });
            useConfigMcpStore.setState((c) => ({ ...c, enabled: checked }));
            if (!checked) {
                setMcpServerStatus(false, null);
            }
        } catch (error) {
            // set_mcp_enabled saves `enabled` before it binds. A bind failure
            // leaves the server enabled and stopped on the saved port.
            const inUse = portInUseFromInvokeError(error);
            if (checked && mcpBindWasAttempted(error)) {
                useConfigMcpStore.setState((c) => ({ ...c, enabled: true }));
                if (inUse !== null) {
                    reportMcpPortInUse(inUse);
                    return;
                }
                setMcpServerStatus(false, null);
            }
            console.error('Failed to toggle MCP server:', error);
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
                    {portInUse !== null && !serverRunning && (
                        <FieldError role="alert" data-testid="mcp-port-in-use" data-port={portInUse}>
                            {t('mcp.advanced.port-in-use', { port: portInUse })}
                        </FieldError>
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
