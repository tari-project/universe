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
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export const PinMarkup = () => {
    const { t } = useTranslation(['settings', 'staged-security'], { useSuspense: false });
    const isPinLocked = useWalletStore((s) => s.is_pin_locked);

    const setPin = useCallback(() => {
        invoke('create_pin')
            .then(() => {
                console.info('Pin created successfully');
            })
            .catch((error) => {
                console.error('Failed to create PIN:', error);
            });
    }, []);

    return !isPinLocked ? (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6" style={{ textTransform: 'uppercase' }}>
                    {t('pin', { ns: 'settings' })}
                </Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Button variant="black" onClick={setPin}>
                            {t('setup-pin', { ns: 'settings' })}
                        </Button>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <AlertChip text={t('intro.warning', { ns: 'staged-security' })} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    ) : null;
};
