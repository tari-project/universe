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
import { invoke } from '@tauri-apps/api/core';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';

export const PinMarkup = () => {
    const { t } = useTranslation(['settings', 'staged-security'], { useSuspense: false });
    const [isPinLocked, setIsPinLocked] = useState(false);

    useEffect(() => {
        invoke('is_pin_locked').then((result) => {
            setIsPinLocked(result);
        });
    }, []);

    const setPin = useCallback(() => {
        invoke('create_pin')
            .then(() => {
                console.info('Pin created successfully');
                setIsPinLocked(true);
            })
            .catch((error) => {
                console.error('Failed to create PIN:', error);
            });
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
                    <AlertChip text={t('intro.warning', { ns: 'staged-security' })} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    ) : null;
};
