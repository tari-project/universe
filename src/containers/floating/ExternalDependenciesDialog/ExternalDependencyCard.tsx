import { Chip } from '@app/components/elements/Chip';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { getChipStylingForStatus, mapStatusToText } from './ExternalDependenciesDialog.utils';
import { ExternalDependency, ExternalDependencyStatus } from '@app/types/app-status';
import { IoArrowDownCircleOutline } from 'react-icons/io5';
import { useAppStateStore } from '@app/store/appStateStore';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import * as Sentry from '@sentry/react';

import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';

export const ExternalDependencyCard = ({
    missingDependency,
    isInstallationSlotOccupied,
    occupyInstallationSlot,
    isInInstallationSlot,
    freeInstallationSlot,
}: {
    missingDependency: ExternalDependency;
    isInstallationSlotOccupied: boolean;
    isInInstallationSlot: boolean;
    occupyInstallationSlot: () => void;
    freeInstallationSlot: () => void;
}) => {
    const { t } = useTranslation('external-dependency-dialog', { useSuspense: false });
    const fetchExternalDependencies = useAppStateStore((s) => s.fetchExternalDependencies);
    const setError = useAppStateStore((s) => s.setError);
    const { display_description, display_name, manufacturer, status, version } = missingDependency;

    const handleDownload = useCallback(async () => {
        try {
            occupyInstallationSlot();
            await invoke('download_and_start_installer', { missingDependency })
                .then(async () => {
                    await fetchExternalDependencies();
                })
                .catch((e) => {
                    Sentry.captureException(e);
                    setError(`Failed to download and start installer: ${e} Please try again.`);
                });
        } catch (e) {
            Sentry.captureException(e);
            console.error('Error downloading installer: ', e);
        }

        freeInstallationSlot();
    }, [fetchExternalDependencies, freeInstallationSlot, missingDependency, occupyInstallationSlot, setError]);

    return (
        <Stack direction="row" alignItems="flex-start" gap={16} style={{ width: '100%' }}>
            <Stack gap={12} alignItems="center">
                {manufacturer.logo && <img src={manufacturer.logo} alt={manufacturer.name} width={40} height={40} />}
            </Stack>
            <Stack style={{ width: '100%' }} gap={12} alignItems="flex-start">
                <Stack gap={8} style={{ width: '100%' }} alignItems="flex-start">
                    <Stack direction="row" gap={6}>
                        <Typography variant="span" style={{ fontSize: '12px', color: 'CaptionText' }}>
                            {manufacturer.name}
                        </Typography>
                        <Chip size="small" {...getChipStylingForStatus(status)}>
                            {mapStatusToText(status)}
                        </Chip>
                    </Stack>

                    <Stack direction="row" gap={4}>
                        <Typography variant="h5">{display_name}</Typography>
                        <Typography variant="p">{version}</Typography>
                    </Stack>
                    <Typography variant="p">{display_description}</Typography>
                </Stack>
                {status === ExternalDependencyStatus.NotInstalled && (
                    <Button
                        onClick={handleDownload}
                        color="secondary"
                        size="small"
                        icon={isInInstallationSlot ? <SpinnerIcon /> : <IoArrowDownCircleOutline size={16} />}
                        iconPosition="start"
                        disabled={isInstallationSlotOccupied}
                    >
                        {t('download-and-install')}
                    </Button>
                )}
            </Stack>
        </Stack>
    );
};
