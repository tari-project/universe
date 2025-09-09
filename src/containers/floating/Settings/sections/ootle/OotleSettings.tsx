import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useConfigUIStore } from '@app/store/useAppConfigStore';

import { Typography } from '@app/components/elements/Typography';

import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useCallback } from 'react';
import { TappletsOverview } from './TappletsOverview';
import { setShowOotleSettings } from '@app/store/actions/appConfigStoreActions';

export const OotleSettings = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const showOotle = useConfigUIStore((s) => s.show_ootle_settings);

    const handleOotleSwitch = useCallback(() => {
        setShowOotleSettings(!showOotle);
    }, [showOotle]);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('Ootle', { ns: 'settings' })}</Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('Enable or disable the Tari Ootle')}</Typography>
                    </SettingsGroupContent>
                    <SettingsGroupAction style={{ alignItems: 'center' }}>
                        <ToggleSwitch checked={showOotle} onChange={handleOotleSwitch} />
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            {showOotle && (
                <>
                    <SettingsGroupWrapper>
                        <TappletsOverview />
                    </SettingsGroupWrapper>
                </>
            )}
        </>
    );
};
