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
import { updateServerSettings } from './serverSettings';

export default function ServerToggle() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const enabled = useConfigMcpStore((s) => s.enabled);
    const serverRunning = useMcpStore((s) => s.serverRunning);
    const serverPort = useMcpStore((s) => s.serverPort);
    const configuredPort = useConfigMcpStore((s) => s.port);
    const loading = useMcpStore((s) => s.settingsPending);
    const error = useMcpStore((s) => s.settingsError);

    const handleToggle = (checked: boolean) =>
        updateServerSettings({ command: 'set_mcp_enabled', args: { enabled: checked } });

    const statusText =
        serverRunning && serverPort
            ? t('mcp.server-toggle.status-running', { port: serverPort })
            : t('mcp.server-toggle.status-stopped', { port: configuredPort });

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
                    {error && (
                        <Typography variant="p" role="alert">
                            {error.kind === 'port-in-use'
                                ? t('mcp.server-toggle.port-in-use', { port: error.port })
                                : t('mcp.server-toggle.update-failed')}
                        </Typography>
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
