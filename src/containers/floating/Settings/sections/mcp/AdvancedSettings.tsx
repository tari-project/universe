import { useCallback, useEffect, useRef, useState } from 'react';
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

const PortError = styled.p`
    margin: 0;
    font-size: 13px;
    color: ${({ theme }) => theme.palette.error.main};
`;

// Marker in the error built by McpServerManager::start (src-tauri/src/mcp/server.rs)
// when the configured port cannot be bound.
const BIND_ERROR_MARKER = 'failed to bind to configured port';

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const [portValue, setPortValue] = useState(String(storePort));
    const [portError, setPortError] = useState<string | null>(null);
    const commitInFlight = useRef(false);

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const commitPort = useCallback(async () => {
        // The field must hold a plain whole number written out in digits.
        // Number() alone would also accept "4e3" (4000), "0x1000" (4096) or
        // "4444.0", silently configuring a port the user never typed. Input
        // that is not a number at all gets its own message so the user fixes
        // the right problem; a whole number outside the allowed range gets
        // the range message.
        if (!/^\d+$/.test(portValue)) {
            setPortError(t('mcp.advanced.port-invalid-error'));
            return;
        }
        const num = Number(portValue);
        if (num < 1024 || num > 65535) {
            setPortError(t('mcp.advanced.port-range-error'));
            return;
        }
        // Committing the saved value again is only a no-op while the server
        // is already running on it with no error showing. When the server is
        // stopped - for example the toggle failed to start it because the
        // port was occupied - or an error is showing, it is a retry: whatever
        // blocked the port may have gone away since the failed attempt.
        if (num === storePort && serverRunning && !portError) {
            return;
        }
        // Enter and blur can both fire for a single edit; never run two
        // commits (and two server restarts) at the same time.
        if (commitInFlight.current) return;
        commitInFlight.current = true;
        try {
            await invoke('set_mcp_port', { port: num });
            // The backend persists the port before restarting, and the panel
            // is the source the user reads the configured port from, so keep
            // the store in step on success and on a bind failure alike.
            useConfigMcpStore.setState((c) => ({ ...c, port: num }));
            setPortError(null);
        } catch (e) {
            console.error('Failed to set MCP port:', e);
            if (String(e).includes(BIND_ERROR_MARKER)) {
                useConfigMcpStore.setState((c) => ({ ...c, port: num }));
                setPortError(t('mcp.advanced.port-in-use', { port: num }));
            } else {
                // The port was never persisted (a save error returns before
                // the backend emits), so the field must go back to the port
                // that is actually configured - otherwise the panel keeps
                // showing a value that was never saved. The generic message
                // stays: unlike a silent revert, the user sees why it moved.
                setPortValue(String(storePort));
                setPortError(t('mcp.advanced.port-update-failed'));
            }
        } finally {
            commitInFlight.current = false;
        }
    }, [portValue, storePort, serverRunning, portError, t]);

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
                    <PortInput
                        type="number"
                        min={1024}
                        max={65535}
                        data-testid="mcp-port-input"
                        aria-invalid={Boolean(portError)}
                        aria-describedby={portError ? 'mcp-port-error' : undefined}
                        $hasError={Boolean(portError)}
                        value={portValue}
                        onChange={(e) => {
                            setPortValue(e.target.value);
                            setPortError(null);
                        }}
                        onBlur={commitPort}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPort();
                        }}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
            {portError ? (
                <SettingsGroup>
                    <SettingsGroupContent>
                        <PortError id="mcp-port-error" role="alert" data-testid="mcp-port-error">
                            {portError}
                        </PortError>
                    </SettingsGroupContent>
                </SettingsGroup>
            ) : null}
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
