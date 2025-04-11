import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
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
import { setPreRelease, useConfigCoreStore } from '@app/store';

export default function PreReleaseSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const isPreRelease = useConfigCoreStore((s) => s.pre_release);
    const [isDialogOpen, setDialogOpen] = useState(false);

    const closeDialog = useCallback(() => {
        setDialogOpen(false);
    }, [setDialogOpen]);

    const askForConfirmation = useCallback(() => {
        setDialogOpen(true);
    }, [setDialogOpen]);

    const applyChange = useCallback(() => {
        setPreRelease(!isPreRelease).then(() => {
            closeDialog();
        });
    }, [closeDialog, isPreRelease]);

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
                <ConfirmationDialog
                    description={isPreRelease ? 'stable-version-note' : 'pre-release-note'}
                    onConfirm={applyChange}
                    onCancel={closeDialog}
                />
            )}
        </SettingsGroupWrapper>
    );
}
