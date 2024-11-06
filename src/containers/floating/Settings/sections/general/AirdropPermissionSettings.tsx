import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

export default function AirdropPermissionSettings() {
    const airdropUIEnabled = useAppConfigStore((s) => s.airdrop_ui_enabled);
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">
                            {t(airdropUIEnabled ? 'permission.title' : 'permissionNoGems.title')}
                        </Typography>
                    </SettingsGroupTitle>
                    <Typography>{t(airdropUIEnabled ? 'permission.text' : 'permissionNoGems.text')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
