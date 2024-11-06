import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useUIStore } from '@app/store/useUIStore.ts';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

const P2pMarkup = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isP2poolEnabled = useAppConfigStore((state) => state.p2pool_enabled);
    const setP2poolEnabled = useAppConfigStore((state) => state.setP2poolEnabled);
    const miningAllowed = useAppStateStore((s) => !s.isSettingUp);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const isDisabled = !miningAllowed;

    const handleP2poolEnabled = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            await setP2poolEnabled(event.target.checked);
            setDialogToShow('restart');
        },
        [setDialogToShow, setP2poolEnabled]
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">
                            {t('pool-mining', { ns: 'settings' })}
                            <b>&nbsp;({t('app-restart-required', { ns: 'settings' })})</b>
                        </Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('pool-mining-description', { ns: 'settings' })}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={isP2poolEnabled} disabled={isDisabled} onChange={handleP2poolEnabled} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default P2pMarkup;
