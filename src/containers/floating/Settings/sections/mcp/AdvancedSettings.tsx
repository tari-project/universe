import { useCallback, useEffect, useId, useState } from 'react';
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
import styled from 'styled-components';
import { mcpBindWasAttempted, parsePortDraft, portInUseFromInvokeError } from './portFeedback';

const PortInput = styled.input<{ $invalid?: boolean }>`
    width: 90px;
    font-size: 14px;
    height: 32px;
    border: 1px solid
        ${({ theme, $invalid }) => ($invalid ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10])};
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: 8px;
    padding: 4px 8px;
    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;
`;

const FieldError = styled.p`
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: ${({ theme }) => theme.palette.error.main};
`;

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const portInUse = useMcpStore((s) => s.portInUse);
    const [portValue, setPortValue] = useState(String(storePort));
    const [invalidPort, setInvalidPort] = useState(false);
    const errorId = useId();

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const commitPort = useCallback(
        async (retry: boolean) => {
            const parsed = parsePortDraft(portValue);
            if (!parsed) {
                setInvalidPort(true);
                clearMcpPortInUse();
                return;
            }

            setInvalidPort(false);
            const unchanged = parsed.port === storePort;
            // Blur on an unchanged field does nothing. Enter retries a port that
            // failed to bind, or starts a stopped server, without making the user toggle it.
            if (unchanged && (!retry || (serverRunning && portInUse === null))) {
                return;
            }

            clearMcpPortInUse();
            try {
                await invoke('set_mcp_port', { port: parsed.port });
                useConfigMcpStore.setState((c) => ({ ...c, port: parsed.port }));
            } catch (error) {
                // The command saves the port before it restarts. Only a bind
                // failure means that new port is the one now configured.
                if (mcpBindWasAttempted(error)) {
                    useConfigMcpStore.setState((c) => ({ ...c, port: parsed.port }));
                    const inUse = portInUseFromInvokeError(error);
                    if (inUse !== null) {
                        reportMcpPortInUse(inUse);
                        return;
                    }
                    setMcpServerStatus(false, null);
                } else {
                    setPortValue(String(storePort));
                }
                console.error('Failed to set MCP port:', error);
            }
        },
        [portInUse, portValue, serverRunning, storePort]
    );

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

    let errorText: string | null = null;
    if (invalidPort) {
        errorText = t('mcp.advanced.port-invalid');
    } else if (portInUse !== null) {
        errorText = t('mcp.advanced.port-in-use', { port: portInUse });
    }

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.advanced.port')}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={errorText !== null}
                        aria-describedby={errorText ? errorId : undefined}
                        $invalid={errorText !== null}
                        data-testid="mcp-port-input"
                        value={portValue}
                        onChange={(e) => {
                            setPortValue(e.target.value);
                            setInvalidPort(false);
                            if (useMcpStore.getState().portInUse !== null) {
                                clearMcpPortInUse();
                            }
                        }}
                        onBlur={() => {
                            void commitPort(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void commitPort(true);
                            }
                        }}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
            {errorText && (
                <FieldError
                    id={errorId}
                    role="alert"
                    data-testid="mcp-port-error"
                    data-port={invalidPort ? undefined : (portInUse ?? undefined)}
                >
                    {errorText}
                </FieldError>
            )}
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
