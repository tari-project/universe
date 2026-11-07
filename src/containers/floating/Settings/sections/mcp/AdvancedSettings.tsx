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
import { AddressErrorMessage as ErrorMessage } from '../connections/NodeTypeConfiguration.styles.ts';

const PORT_ERROR_ID = 'mcp-port-error';

const PortField = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
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

const MIN_PORT = 1024;
const MAX_PORT = 65535;

function isValidPort(value: string): boolean {
    if (value.trim() === '') return false;
    const num = Number(value);
    return Number.isInteger(num) && num >= MIN_PORT && num <= MAX_PORT;
}

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const [portValue, setPortValue] = useState(String(storePort));
    const [portInvalid, setPortInvalid] = useState(false);

    useEffect(() => {
        setPortValue(String(storePort));
        setPortInvalid(false);
    }, [storePort]);

    const commitPort = useCallback(async () => {
        const num = Number(portValue);
        if (!isValidPort(portValue)) {
            // Keep what the user typed so they can see and fix it.
            setPortInvalid(true);
            return;
        }
        setPortInvalid(false);
        if (num === storePort) return;
        try {
            await invoke('set_mcp_port', { port: num });
        } catch (e) {
            // A bind failure is shown by ServerToggle from the McpServerStatusUpdate event.
            // The backend has already sent the saved port, so read it fresh, not from this closure.
            console.warn('Failed to apply MCP port:', e);
            setPortValue(String(useConfigMcpStore.getState().port));
        }
    }, [portValue, storePort]);

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
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortField>
                        <PortInput
                            type="number"
                            min={MIN_PORT}
                            max={MAX_PORT}
                            data-testid="mcp-port-input"
                            aria-label={t('mcp.advanced.port')}
                            aria-invalid={portInvalid}
                            aria-describedby={portInvalid ? PORT_ERROR_ID : undefined}
                            value={portValue}
                            onChange={(e) => {
                                setPortValue(e.target.value);
                                setPortInvalid(false);
                            }}
                            onBlur={commitPort}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitPort();
                            }}
                        />
                        {portInvalid && (
                            <ErrorMessage id={PORT_ERROR_ID} role="alert" data-testid="mcp-port-error">
                                {t('mcp.advanced.port-invalid', { min: MIN_PORT, max: MAX_PORT })}
                            </ErrorMessage>
                        )}
                    </PortField>
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
