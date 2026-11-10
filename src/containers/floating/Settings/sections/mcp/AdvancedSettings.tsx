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
import { setMcpPortError, useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import styled from 'styled-components';

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

const PortErrorMessage = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.error.main};
    font-size: 12px;
    margin-top: 4px;
`;

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const portError = useMcpStore((s) => s.portError);
    const [portValue, setPortValue] = useState(String(storePort));
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPortValue(val);
        if (portError) {
            setMcpPortError(null);
        }
        const trimmed = val.trim();
        const num = Number(trimmed);
        if (trimmed !== '' && (isNaN(num) || num < 1024 || num > 65535)) {
            setValidationError(t('mcp.advanced.port-range-error'));
        } else {
            setValidationError(null);
        }
    };

    const commitPort = useCallback(async () => {
        const trimmed = portValue.trim();
        const num = Number(trimmed);
        if (trimmed === '' || isNaN(num) || num < 1024 || num > 65535) {
            setValidationError(t('mcp.advanced.port-range-error'));
            return;
        }
        setValidationError(null);
        if (num === storePort && !portError) return;
        try {
            await invoke('set_mcp_port', { port: num });
            useConfigMcpStore.setState((c) => ({ ...c, port: num }));
            setMcpPortError(null);
        } catch (e) {
            console.error('Failed to set MCP port:', e);
            useConfigMcpStore.setState((c) => ({ ...c, port: num }));
            setMcpPortError(t('mcp.advanced.port-in-use', { port: num }));
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

    const activeError = validationError || portError;

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.advanced.port')}</Typography>
                    </SettingsGroupTitle>
                    {activeError && <PortErrorMessage data-testid="mcp-port-error">{activeError}</PortErrorMessage>}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="number"
                        min={1024}
                        max={65535}
                        data-testid="mcp-port-input"
                        value={portValue}
                        onChange={handlePortChange}
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
