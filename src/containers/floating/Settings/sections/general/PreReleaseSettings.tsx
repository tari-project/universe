import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useCallback, useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    SettingsGroupWrapper,
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupAction,
} from '../../components/SettingsGroup.styles';
import ConfirmationDialog from '@app/components/dialogs/ConfirmationDialog';

export default function PreReleaseSettings() {
    const isPreRelease = useAppConfigStore((s) => s.pre_release);
    const setPreRelease = useAppConfigStore((s) => s.setPreRelease);
    const { t } = useTranslation('settings', { useSuspense: false });
    const [isDialogOpen, setDialogOpen] = useState(false);

    const closeDialog = useCallback(() => {
        setDialogOpen(false);
    }, [setDialogOpen]);

    const askForConfirmation = useCallback(() => {
        setDialogOpen(true);
    }, [setDialogOpen]);

    const applyChange = useCallback(() => {
        closeDialog();
        setPreRelease(!isPreRelease);
    }, [closeDialog, isPreRelease, setPreRelease]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('pre-release.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('pre-release.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={isPreRelease} onChange={askForConfirmation} />
                </SettingsGroupAction>
            </SettingsGroup>

            {isDialogOpen && (
                <ConfirmationDialog description="pre-release-note" onConfirm={applyChange} onCancel={closeDialog} />
            )}
        </SettingsGroupWrapper>
    );
}
