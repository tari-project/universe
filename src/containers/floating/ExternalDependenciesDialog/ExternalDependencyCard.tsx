import { Chip } from '@app/components/elements/Chip';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { getChipStylingForStatus, mapStatusToText } from './ExternalDependenciesDialog.utils';
import { SystemDependency, SystemDependencyStatus } from '@app/types/app-status';
import { IoArrowDownCircleOutline } from 'react-icons/io5';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';
import { setError } from '@app/store';
import {
    ManufacturerLogoWrapper,
    ManufacturerWrapper,
} from '@app/containers/floating/ExternalDependenciesDialog/styles.ts';

export const ExternalDependencyCard = ({
    missingDependency,
    isInstallationSlotOccupied,
    occupyInstallationSlot,
    isInInstallationSlot,
    freeInstallationSlot,
}: {
    missingDependency: SystemDependency;
    isInstallationSlotOccupied: boolean;
    isInInstallationSlot: boolean;
    occupyInstallationSlot: () => void;
    freeInstallationSlot: () => void;
}) => {
    const { t } = useTranslation('external-dependency-dialog', { useSuspense: false });

    const {
        id,
        status,
        ui_info: { display_description, display_name, manufacturer },
    } = missingDependency;

    const handleDownload = useCallback(async () => {
        try {
            occupyInstallationSlot();
            await invoke('download_and_start_installer', { id }).catch((e) => {
                console.error('External dependency | caught error in download', e);
                setError(`Failed to download and start installer: ${e} Please try again.`);
            });
        } catch (e) {
            console.error('Error downloading installer: ', e);
        }

        freeInstallationSlot();
    }, [freeInstallationSlot, id, occupyInstallationSlot]);

    return (
        <Stack direction="row" alignItems="flex-start" gap={14} style={{ width: '100%', padding: 4 }}>
            <ManufacturerLogoWrapper>
                {manufacturer.logo_url?.length ? (
                    <img src={`/assets/img/${manufacturer.logo_url}`} alt={manufacturer.name} />
                ) : null}
            </ManufacturerLogoWrapper>
            <Stack style={{ width: '100%' }} gap={12} alignItems="flex-start">
                <ManufacturerWrapper>
                    <Stack direction="row" gap={6}>
                        <Typography variant="p">{manufacturer.name}</Typography>
                        <Chip size="small" {...getChipStylingForStatus(status)}>
                            {mapStatusToText(status)}
                        </Chip>
                    </Stack>

                    <Stack direction="row" gap={4}>
                        <Typography variant="h5">{display_name}</Typography>
                    </Stack>
                    <Typography variant="p">{display_description}</Typography>
                </ManufacturerWrapper>
                {status === SystemDependencyStatus.NotInstalled && (
                    <Button
                        onClick={handleDownload}
                        color="secondary"
                        size="smaller"
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
