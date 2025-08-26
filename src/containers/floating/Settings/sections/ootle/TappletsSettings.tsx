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
import { setShowTappletsSettings } from '@app/store/actions/appConfigStoreActions';

export const TappletsSettings = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const showTapplets = useConfigUIStore((s) => s.show_tapplets_settings);

    const handleTappletsSwitch = useCallback(() => {
        setShowTappletsSettings(!showTapplets);
    }, [showTapplets]);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('tapplets', { ns: 'settings' })}</Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('Enable or disable the Tari Ootle')}</Typography>
                    </SettingsGroupContent>
                    <SettingsGroupAction style={{ alignItems: 'center' }}>
                        <ToggleSwitch checked={showTapplets} onChange={handleTappletsSwitch} />
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            {showTapplets && (
                <>
                    <SettingsGroupWrapper>
                        <TappletsOverview />
                    </SettingsGroupWrapper>
                </>
            )}
        </>
    );
};
