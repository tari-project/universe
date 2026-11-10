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
import {
    isMcpPortBindError,
    McpPortError,
    setMcpPortError,
    setMcpServerStatus,
    useMcpStore,
} from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import styled from 'styled-components';

const MIN_MCP_PORT = 1024;
const MAX_MCP_PORT = 65535;

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

const PortErrorMessage = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.palette.error.main};
    margin-top: 2px;
`;

type ParsedPortResult = { ok: true; port: number } | { ok: false; error: McpPortError };

function isPortWithinBounds(port: number): boolean {
    if (port < MIN_MCP_PORT) return false;
    return port <= MAX_MCP_PORT;
}

// Validates that the raw user input represents a base-10 unprivileged TCP port in 1024..=65535,
// distinguishing malformed inputs (empty, decimal, scientific notation) from out-of-range integers.
function parseMcpPort(raw: string): ParsedPortResult {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) {
        return { ok: false, error: { kind: 'invalid' } };
    }
    const port = Number(trimmed);
    if (!Number.isSafeInteger(port) || !isPortWithinBounds(port)) {
        return { ok: false, error: { kind: 'out-of-range' } };
    }
    return { ok: true, port };
}

function classifyPortFailure(port: number, error: unknown): McpPortError {
    if (isMcpPortBindError(error)) {
        return { kind: 'in-use', port };
    }
    return { kind: 'failed', reason: String(error) };
}

// Saves the validated port via Tauri and surfaces port-in-use bind failures while keeping the
// persisted port visible so the user knows which port conflicted.
async function persistMcpPort(port: number): Promise<void> {
    try {
        await invoke('set_mcp_port', { port });
        useConfigMcpStore.setState((c) => ({ ...c, port }));
        setMcpPortError(null);
    } catch (e) {
        console.error('Failed to set MCP port:', e);
        useConfigMcpStore.setState((c) => ({ ...c, port }));
        setMcpServerStatus(false, null);
        setMcpPortError(classifyPortFailure(port, e));
    }
}

async function toggleMcpTier(tier: 'read' | 'control', checked: boolean): Promise<void> {
    try {
        await invoke('set_mcp_tier_enabled', { tier, enabled: checked });
        const key = tier === 'read' ? 'read_tier_enabled' : 'control_tier_enabled';
        useConfigMcpStore.setState((c) => ({ ...c, [key]: checked }));
    } catch (e) {
        console.error(`Failed to toggle ${tier} tier:`, e);
    }
}

function renderPortErrorText(
    portError: McpPortError | null,
    t: (key: string, options?: Record<string, unknown>) => string
): string | null {
    if (!portError) return null;
    if (portError.kind === 'invalid') return t('mcp.advanced.port-invalid');
    if (portError.kind === 'out-of-range') return t('mcp.advanced.port-out-of-range');
    if (portError.kind === 'failed') return t('mcp.advanced.port-update-failed', { reason: portError.reason });
    return t('mcp.advanced.port-in-use', { port: portError.port });
}

function shouldSkipPortCommit(port: number, storePort: number): boolean {
    if (port !== storePort) return false;
    const { serverRunning, portError } = useMcpStore.getState();
    return serverRunning && !portError;
}

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const portError = useMcpStore((s) => s.portError);
    const [portValue, setPortValue] = useState(String(storePort));
    const commitInFlight = useRef(false);

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const commitPort = useCallback(async () => {
        if (commitInFlight.current) return;
        const parsed = parseMcpPort(portValue);
        if (!parsed.ok) {
            setMcpPortError(parsed.error);
            return;
        }
        if (shouldSkipPortCommit(parsed.port, storePort)) {
            setMcpPortError(null);
            return;
        }
        commitInFlight.current = true;
        try {
            await persistMcpPort(parsed.port);
        } finally {
            commitInFlight.current = false;
        }
    }, [portValue, storePort]);

    if (!enabled) return null;

    const errorMessage = renderPortErrorText(portError, t);

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mcp.advanced.port')}</Typography>
                    </SettingsGroupTitle>
                    {errorMessage && (
                        <PortErrorMessage role="alert" data-testid="mcp-port-error">
                            {errorMessage}
                        </PortErrorMessage>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="number"
                        min={MIN_MCP_PORT}
                        max={MAX_MCP_PORT}
                        data-testid="mcp-port-input"
                        $hasError={Boolean(portError)}
                        aria-invalid={Boolean(portError)}
                        value={portValue}
                        onChange={(e) => {
                            setPortValue(e.target.value);
                            setMcpPortError(null);
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
                        onChange={(e) => toggleMcpTier('read', e.target.checked)}
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
                        onChange={(e) => toggleMcpTier('control', e.target.checked)}
                        data-testid="mcp-tier-control"
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
