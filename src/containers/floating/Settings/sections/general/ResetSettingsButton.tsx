import { useState } from 'react';
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
import ResetSettingsDialog from '@app/containers/floating/Settings/sections/general/ResetSettingsDialog.tsx';

export const ResetSettingsButton = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [open, setOpen] = useState(false);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('reset-settings')}</Typography>
                        </SettingsGroupTitle>
                    </SettingsGroupContent>
                    <SettingsGroupAction>
                        <Button onClick={() => setOpen(true)}>{t('reset-settings')}</Button>
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            <ResetSettingsDialog isOpen={open} onOpenChange={setOpen} />
        </>
    );
};
