import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { setMineOnAppStart, useConfigMiningStore } from '@app/store';

export default function MineOnStartMarkup() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const mineOnAppStart = useConfigMiningStore((s) => s.mine_on_app_start);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('mine-on-app-start.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('mine-on-app-start.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={mineOnAppStart}
                        onChange={(event) => setMineOnAppStart(event.target.checked)}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
