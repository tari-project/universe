import { useCallback, useEffect, useState } from 'react';
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
import styled from 'styled-components';
import { isPortInUseError } from './mcpPortError';

const PortError = styled.p`
    margin: 4px 0 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.palette.error.main};
`;

const PortInput = styled.input`
    width: 90px;
    font-size: 14px;
    height: 32px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: 8px;
    padding: 4px 8px;
    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const [portValue, setPortValue] = useState(String(storePort));
    const [portError, setPortError] = useState<string | null>(null);

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const commitPort = useCallback(async () => {
        const trimmed = portValue.trim();
        const num = Number(trimmed);
        if (trimmed === '' || !Number.isInteger(num) || num < 1024 || num > 65535) {
            setPortError(t('mcp.advanced.port-invalid'));
            return;
        }
        setPortError(null);
        // Retry even when the value matches the saved port: after a bind failure the
        // saved port is the one that could not be bound, so pressing Enter again must
        // attempt the bind rather than do nothing.
        if (num === storePort && !portError) return;
        try {
            await invoke('set_mcp_port', { port: num });
        } catch (e) {
            console.error('Failed to set MCP port:', e);
            if (isPortInUseError(e)) {
                // The backend saves the port before restarting, so keep the configured port
                // in the panel even if the event that reports the saved config arrives later.
                useConfigMcpStore.setState((c) => ({ ...c, port: num }));
                setPortValue(String(num));
                setPortError(t('mcp.advanced.port-in-use', { port: num }));
            } else {
                setPortError(t('mcp.advanced.port-error', { port: num }));
            }
        }
    }, [portValue, storePort, portError, t]);

    if (!enabled) return null;

    const handleTierToggle = async (tier: string, checked: boolean) => {
        try {
            await invoke('set_mcp_tier_enabled', { tier, enabled: checked });
            if (tier === 'read') {
                useConfigMcpStore.setState((c) => ({ ...c, read_tier_enabled: checked }));
            } else if (tier === 'control') {
                useConfigMcpStore.setState((c) => ({ ...c, control_tier_enabled: checked }));
            }
        } catch (e) {
            console.error(`Failed to toggle ${tier} tier:`, e);
        }
    };

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.advanced.port')}</Typography>
                    </SettingsGroupTitle>
                    {portError && (
                        <PortError id="mcp-port-error" data-testid="mcp-port-error" role="alert">
                            {portError}
                        </PortError>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="number"
                        min={1024}
                        max={65535}
                        data-testid="mcp-port-input"
                        value={portValue}
                        aria-invalid={!!portError}
                        aria-describedby={portError ? 'mcp-port-error' : undefined}
                        onChange={(e) => {
                            setPortValue(e.target.value);
                            if (portError) setPortError(null);
                        }}
                        onBlur={commitPort}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPort();
                        }}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.advanced.read-tier')}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={readTier}
                        onChange={(e) => handleTierToggle('read', e.target.checked)}
                        data-testid="mcp-tier-read"
                    />
                </SettingsGroupAction>
            </SettingsGroup>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.advanced.control-tier')}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={controlTier}
                        onChange={(e) => handleTierToggle('control', e.target.checked)}
                        data-testid="mcp-tier-control"
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
