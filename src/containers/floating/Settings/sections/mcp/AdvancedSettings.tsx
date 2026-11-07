import { useCallback, useEffect, useId, useRef, useState } from 'react';
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
import { setMcpServerError } from '@app/store/useMcpStore';
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
`;

export default function AdvancedSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const readTier = useConfigMcpStore((s) => s.read_tier_enabled);
    const controlTier = useConfigMcpStore((s) => s.control_tier_enabled);
    const storePort = useConfigMcpStore((s) => s.port);
    const [portValue, setPortValue] = useState(String(storePort));
    const [invalidPort, setInvalidPort] = useState(false);
    const [saving, setSaving] = useState(false);
    const committing = useRef(false);
    const portErrorId = useId();

    useEffect(() => {
        setPortValue(String(storePort));
    }, [storePort]);

    const commitPort = useCallback(async () => {
        if (committing.current) return;
        const num = Number(portValue);
        if (!/^\d+$/.test(portValue) || !Number.isInteger(num) || num < 1024 || num > 65535) {
            setInvalidPort(true);
            return;
        }
        setInvalidPort(false);
        if (num === storePort) return;
        committing.current = true;
        setSaving(true);
        setMcpServerError(null);
        try {
            await invoke('set_mcp_port', { port: num });
        } catch (e) {
            console.error('Failed to set MCP port:', e);
            setMcpServerError(e);
        } finally {
            committing.current = false;
            setSaving(false);
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
                    {invalidPort && (
                        <Typography variant="p" role="alert" id={portErrorId}>
                            {t('mcp.advanced.invalid-port')}
                        </Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <PortInput
                        type="text"
                        inputMode="numeric"
                        aria-label={t('mcp.advanced.port')}
                        aria-invalid={invalidPort}
                        aria-describedby={invalidPort ? portErrorId : undefined}
                        disabled={saving}
                        data-testid="mcp-port-input"
                        value={portValue}
                        onChange={(e) => {
                            setPortValue(e.target.value);
                            setInvalidPort(false);
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
