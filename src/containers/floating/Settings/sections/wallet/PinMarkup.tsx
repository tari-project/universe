import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useCallback, useEffect, useState } from 'react';
import { Warning } from '@app/containers/floating/StagedSecurity/sections/ProtectIntro/styles.ts';
import { invoke } from '@tauri-apps/api/core';
import { setDialogToShow } from '@app/store';

export const PinMarkup = () => {
    const { t } = useTranslation(['settings', 'staged-security'], { useSuspense: false });
    const [isPinLocked, setIsPinLocked] = useState(false);

    useEffect(() => {
        invoke('is_pin_locked').then((result) => {
            setIsPinLocked(result);
        });
    }, []);

    const setPin = useCallback(() => {
        setDialogToShow('createPin');
    }, []);

    return !isPinLocked ? (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('pin', { ns: 'settings' })}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Button onClick={setPin}>{t('setup-pin', { ns: 'settings' })}</Button>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Warning style={{ fontSize: '12px', textWrap: 'nowrap' }}>
                        {t('intro.warning', { ns: 'staged-security' })}
                    </Warning>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    ) : null;
};
