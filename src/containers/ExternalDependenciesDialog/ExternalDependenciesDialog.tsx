import { Button } from '@app/components/elements/Button';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import {
    ExternalDependencyStatus,
    ExternalDependencies,
    ExternalDependency,
    Manufacturer,
} from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/tauri';
import { useCallback, useState } from 'react';

const mapStatusToText = (status: ExternalDependencyStatus) => {
    switch (status) {
        case ExternalDependencyStatus.Installed:
            return 'Installed';
        case ExternalDependencyStatus.NotInstalled:
            return 'Not installed';
        case ExternalDependencyStatus.Unknown:
            return 'Unknown';
    }
};

const ExternalDependencyCard = ({ missingDependency }: { missingDependency: ExternalDependency }) => {
    const { display_description, display_name, download_url, manufacturer, status, version } = missingDependency;

    const handleDownload = useCallback(async () => {
        try {
            await invoke('download_and_start_installer', { missingDependency });
        } catch (e) {
            console.error(e);
        }
    }, [download_url]);

    return (
        <Stack flexDirection="row">
            <Stack>
                {manufacturer.logo && <img src={manufacturer.logo} alt={manufacturer.name} width={40} height={40} />}
            </Stack>
            <Stack>
                <Stack flexDirection="row">
                    <Typography variant="h5">{display_name}</Typography>
                    <Typography variant="p">{version}</Typography>
                </Stack>
                <Typography variant="p">{display_description}</Typography>
                <Stack>
                    <Button onClick={handleDownload}>Download</Button>
                    <Typography variant="p">{mapStatusToText(status)}</Typography>
                </Stack>
            </Stack>
        </Stack>
    );
};

export const ExternalDependenciesDialog = () => {
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);
    const externalDependencies = useAppStateStore((s) => s.externalDependencies);
    const fetchExternalDependencies = useAppStateStore((s) => s.fetchExternalDependencies);

    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = useCallback(async () => {
        try {
            setIsRestarting(true);
            await invoke('restart_application');
        } catch (e) {
            console.error(e);
        }
        setIsRestarting(false);
    }, []);

    const handleExit = useCallback(async () => {
        try {
            setIsRestarting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error(e);
        }
        setIsRestarting(false);
    }, []);

    <Dialog open={!!showExternalDependenciesDialog}>
        <DialogContent>
            {Object.values(externalDependencies).map((missingDependency) => (
                <ExternalDependencyCard key={missingDependency.display_name} missingDependency={missingDependency} />
            ))}
            <Stack>
                <Button onClick={fetchExternalDependencies}>Refresh</Button>
                <Button onClick={handleRestart} disabled={isRestarting}>
                    Restart
                </Button>
                <Button onClick={handleExit} disabled={isRestarting}>
                    Exit
                </Button>
            </Stack>
        </DialogContent>
    </Dialog>;
};
