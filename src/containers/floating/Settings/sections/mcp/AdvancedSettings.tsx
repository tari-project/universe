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
import { useMcpStore, setMcpPortError } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import styled from 'styled-components';

const PortInput = styled.input<{ $hasError?: boolean }>`
    width: 90px;
    font-size: 14px;
    height: 32px;
    border: 1px solid ${({ theme, $hasError }) => ($hasError ? '#E53E3E' : theme.colorsAlpha.darkAlpha[10])};
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
    const storePortError = useMcpStore((s) => s.portError);
    const [portValue, setPortValue] = useState(String(storePort));
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const activeError = localError || storePortError;

    const commitPort = useCallback(async () => {
        const trimmed = portValue.trim();
        const num = Number(trimmed);
        if (!trimmed || isNaN(num) || !Number.isInteger(num) || num < 1024 || num > 65535) {
            setLocalError(t('mcp.advanced.port-invalid-range'));
            return;
        }
        setLocalError(null);
        setMcpPortError(null);
        if (num === storePort) return;
        try {
            await invoke('set_mcp_port', { port: num });
            useConfigMcpStore.setState((c) => ({ ...c, port: num }));
        } catch (e: unknown) {
            console.error('Failed to set MCP port:', e);
            const msg = t('mcp.advanced.port-in-use', { port: num });
            setLocalError(msg);
            setMcpPortError(msg);
        }
    }, [portValue, storePort, t]);

    const handlePortChange = (val: string) => {
        setPortValue(val);
        setLocalError(null);
        setMcpPortError(null);
    };

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
                    {activeError && (
                        <Typography
                            variant="p"
                            style={{ color: '#E53E3E', fontSize: 13, marginTop: 4 }}
                            data-testid="mcp-port-error"
                        >
                            {activeError}
                        </Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="number"
                        min={1024}
                        max={65535}
                        data-testid="mcp-port-input"
                        $hasError={Boolean(activeError)}
                        value={portValue}
                        onChange={(e) => handlePortChange(e.target.value)}
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
