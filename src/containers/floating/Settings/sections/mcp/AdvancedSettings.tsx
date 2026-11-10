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
import { isMcpPortBindError, setMcpPortError, setMcpServerStatus, useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import styled from 'styled-components';

const PortInput = styled.input<{ $hasError?: boolean }>`
    width: 90px;
    font-size: 14px;
    height: 32px;
    border: 1px solid
        ${({ theme, $hasError }) => ($hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10])};
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

const PortErrorMessage = styled.p`
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.palette.error.main};
`;

const isValidPortString = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1024 || num > 65535) return null;
    return num;
};

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const portError = useMcpStore((s) => s.portError);
    const [portValue, setPortValue] = useState(String(storePort));

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const commitPort = useCallback(async () => {
        const num = isValidPortString(portValue);
        if (num === null) {
            setMcpPortError({ type: 'out-of-range' });
            return;
        }
        if (num === storePort && serverRunning && !portError) return;
        setMcpPortError(null);
        try {
            await invoke('set_mcp_port', { port: num });
            useConfigMcpStore.setState((c) => ({ ...c, port: num }));
        } catch (e) {
            console.error('Failed to set MCP port:', e);
            useConfigMcpStore.setState((c) => ({ ...c, port: num }));
            setPortValue(String(num));
            setMcpServerStatus(false, null);
            if (isMcpPortBindError(e)) {
                setMcpPortError({ type: 'in-use', port: num });
            } else {
                setMcpPortError({ type: 'in-use', port: num });
            }
        }
    }, [portValue, storePort, serverRunning, portError]);

    if (!enabled) return null;

    const portErrorText =
        portError?.type === 'in-use'
            ? t('mcp.advanced.port-in-use', { port: portError.port })
            : portError?.type === 'out-of-range'
              ? t('mcp.advanced.port-range-error')
              : null;

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
                    {portErrorText && (
                        <PortErrorMessage role="alert" data-testid="mcp-port-error">
                            {portErrorText}
                        </PortErrorMessage>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="number"
                        min={1024}
                        max={65535}
                        $hasError={Boolean(portErrorText)}
                        aria-invalid={Boolean(portErrorText)}
                        data-testid="mcp-port-input"
                        value={portValue}
                        onChange={(e) => {
                            setPortValue(e.target.value);
                            if (portError?.type === 'out-of-range') {
                                setMcpPortError(null);
                            }
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
