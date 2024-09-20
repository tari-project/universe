import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useCallback } from 'react';
import { Text, TextWrapper, Title } from './styles';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function AirdropPermissionSettings() {
    const wipUI = useAirdropStore((state) => state.wipUI);
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return (
        <SettingsGroup>
            <SettingsGroupTitle>
                <Typography variant="h6">{t(wipUI ? 'permission.title' : 'permissionNoGems.title')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroupContent>
                <Typography>{t(wipUI ? 'permission.text' : 'permissionNoGems.text')}</Typography>
                <SettingsGroupAction>
                    <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
                </SettingsGroupAction>
            </SettingsGroupContent>
        </SettingsGroup>
    );
}
