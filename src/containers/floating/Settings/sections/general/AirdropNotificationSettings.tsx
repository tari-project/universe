import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { setAllowNotifications } from '@app/store/actions/appConfigStoreActions.ts';
import { useConfigCoreStore } from '@app/store/useAppConfigStore.ts';

export default function AirdropNotificationsSettings() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const allowNotifications = useConfigCoreStore((s) => s.allow_notifications);

    const handleChange = useCallback(async () => {
        await setAllowNotifications(!allowNotifications);
    }, [allowNotifications]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('push-notifications.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('push-notifications.text')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={allowNotifications} onChange={handleChange} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
