import { Button } from '@app/components/elements/Button';
import { Chip } from '@app/components/elements/Chip';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Divider } from '@app/components/elements/Divider';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { ExternalDependencyStatus, ExternalDependency } from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/tauri';
import { useCallback, useState } from 'react';
import { IoArrowDown, IoArrowDownCircleOutline, IoDownload } from 'react-icons/io5';

const mapStatusToText = (status: ExternalDependencyStatus) => {
    console.log('status', status);
    switch (status) {
        case ExternalDependencyStatus.Installed:
            return 'Installed';
        case ExternalDependencyStatus.NotInstalled:
            return 'Not installed';
        case ExternalDependencyStatus.Unknown:
            return 'Unknown';
    }
};

const getChipStylingForStatus = (status: ExternalDependencyStatus) => {
    switch (status) {
        case ExternalDependencyStatus.Installed:
            return { color: 'white', background: 'green' };
        case ExternalDependencyStatus.NotInstalled:
            return { color: 'white', background: 'red' };
        case ExternalDependencyStatus.Unknown:
            return { color: 'white', background: 'grey' };
    }
};

const ExternalDependencyCard = ({
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
    const fetchExternalDependencies = useAppStateStore((s) => s.fetchExternalDependencies);
    const setError = useAppStateStore((s) => s.setError);
    const { display_description, display_name, download_url, manufacturer, status, version } = missingDependency;

    const handleDownload = useCallback(async () => {
        try {
            occupyInstallationSlot();
            await invoke('download_and_start_installer', { missingDependency })
                .then(async () => {
                    await fetchExternalDependencies();
                })
                .catch((e) => {
                    setError(`Failed to download and start installer: ${e} Please try again.`);
                });
        } catch (e) {
            console.error(e);
        }

        freeInstallationSlot();
    }, [download_url]);

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
                        size="small"
                        variant="squared"
                        color="primary"
                        style={{ height: 'unset', width: '256px' }}
                        icon={isInInstallationSlot ? <CircularProgress /> : <IoArrowDownCircleOutline size={16} />}
                        iconPosition="start"
                        disabled={isInstallationSlotOccupied}
                    >
                        Download and install
                    </Button>
                )}
            </Stack>
        </Stack>
    );
};

export const ExternalDependenciesDialog = () => {
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);
    const externalDependencies = useAppStateStore((s) => s.externalDependencies);
    const setView = useUIStore((s) => s.setView);
    const setCriticalError = useAppStateStore((s) => s.setCriticalError);
    const [isRestarting, setIsRestarting] = useState(false);

    const [instalationSlot, setInstalationSlot] = useState<number | null>(null);

    const handleRestart = useCallback(async () => {
        try {
            setIsRestarting(true);
            await invoke('restart_application');
        } catch (e) {
            console.error(e);
        }
        setIsRestarting(false);
    }, []);

    const handleContinue = useCallback(() => {
        invoke('setup_application').catch((e) => {
            setCriticalError(`Failed to setup application: ${e}`);
            setView('mining');
        });
    }, []);

    const shouldAllowContinue = Object.values(externalDependencies).every(
        (missingDependency) => missingDependency.status === ExternalDependencyStatus.Installed
    );

    return (
        <Dialog open={!!showExternalDependenciesDialog}>
            <DialogContent>
                <Stack gap={16}>
                    <Stack gap={4}>
                        <Typography variant="h4">External Dependencies</Typography>
                        <Typography variant="p">
                            The following external dependencies are required for the application to function correctly.
                        </Typography>
                    </Stack>

                    {Object.values(externalDependencies).map((missingDependency, index, array) => (
                        <>
                            <ExternalDependencyCard
                                key={missingDependency.display_name}
                                missingDependency={missingDependency}
                                freeInstallationSlot={() => setInstalationSlot(null)}
                                isInInstallationSlot={instalationSlot === index}
                                isInstallationSlotOccupied={instalationSlot !== null}
                                occupyInstallationSlot={() => setInstalationSlot(index)}
                            />
                            {index === array.length - 1 ? null : <Divider />}
                        </>
                    ))}
                    <Stack direction="row" justifyContent="flex-end" gap={8}>
                        <Button
                            variant="squared"
                            color="secondary"
                            size="medium"
                            onClick={handleContinue}
                            disabled={isRestarting || !shouldAllowContinue}
                            style={{ width: '100px' }}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="squared"
                            color="error"
                            size="medium"
                            onClick={handleRestart}
                            disabled={isRestarting}
                            style={{ width: '100px' }}
                        >
                            Restart
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
