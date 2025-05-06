import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroupWrapper,
    SettingsGroupTitle,
    SettingsGroupContent,
    SettingsGroup,
    SettingsGroupAction,
} from '../../components/SettingsGroup.styles';
import { useTranslation } from 'react-i18next';
import { setAutoUpdate, useConfigCoreStore } from '@app/store';

const AutoUpdate = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const autoUpdate = useConfigCoreStore((s) => s.auto_update);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('use-auto-update.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('use-auto-update.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={autoUpdate} onChange={({ target }) => setAutoUpdate(target.checked)} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default AutoUpdate;
