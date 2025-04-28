import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { setAllowTelemetry } from '@app/store/actions/appConfigStoreActions.ts';
import { useConfigCoreStore } from '@app/store/useAppConfigStore.ts';

export default function AirdropPermissionSettings() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const allowTelemetry = useConfigCoreStore((s) => s.allow_telemetry);

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('permission.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('permission.text')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
