import ActiveDevTapplet from '@app/components/ootle/ActiveDevTapplet';
import { useTappletsStore } from '@app/store/useTappletsStore';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useCallback } from 'react';
import { Typography } from '@app/components/elements/Typography';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useTranslation } from 'react-i18next';
import { TappletsOverview } from './TappletsOverview';

export const OotleSettings = () => {
    const { t } = useTranslation('settings');
    const ootleMode = useAppConfigStore((s) => s.ootle_enabled);

    const setOotleMode = useAppConfigStore((s) => s.setOotleMode);

    const handleSwitch = useCallback(() => {
        setOotleMode(!ootleMode);
    }, [setOotleMode, ootleMode]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('tabs.ootle')}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction style={{ alignItems: 'center' }}>
                    <ToggleSwitch checked={ootleMode} onChange={handleSwitch} />
                </SettingsGroupAction>
            </SettingsGroup>
            <TappletsOverview />
        </SettingsGroupWrapper>
    );
};
