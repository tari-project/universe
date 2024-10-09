import { Button } from '@app/components/elements/Button';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Divider } from '@app/components/elements/Divider';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { ExternalDependencyStatus } from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/tauri';
import { useCallback, useState } from 'react';
import { ExternalDependencyCard } from './ExternalDependencyCard';
import { useTranslation } from 'react-i18next';

export const ExternalDependenciesDialog = () => {
    const { t } = useTranslation('external-dependency-dialog', { useSuspense: false });
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);
    const setShowExternalDependenciesDialog = useUIStore((s) => s.setShowExternalDependenciesDialog);
    const externalDependencies = useAppStateStore((s) => s.externalDependencies);
    const setView = useUIStore((s) => s.setView);
    const setCriticalError = useAppStateStore((s) => s.setCriticalError);
    const [isRestarting, setIsRestarting] = useState(false);

    const [installationSlot, setInstallationSlot] = useState<number | null>(null);

    const handleRestart = useCallback(async () => {
        try {
            setIsRestarting(true);
            await invoke('restart_application');
        } catch (e) {
            console.error('Error restarting application:', e);
        }
        setIsRestarting(false);
    }, []);

    const handleContinue = useCallback(() => {
        setShowExternalDependenciesDialog(false);
        invoke('setup_application').catch((e) => {
            setCriticalError(`Failed to setup application: ${e}`);
            setView('mining');
        });
    }, [setCriticalError, setShowExternalDependenciesDialog, setView]);

    const shouldAllowContinue = Object.values(externalDependencies).every(
        (missingDependency) => missingDependency.status === ExternalDependencyStatus.Installed
    );

    return (
        <Dialog open={!!showExternalDependenciesDialog}>
            <DialogContent>
                <Stack gap={16}>
                    <Stack gap={4}>
                        <Typography variant="h4">{t('title')}</Typography>
                        <Typography variant="p">{t('description')}</Typography>
                    </Stack>

                    {Object.values(externalDependencies).map((missingDependency, index, array) => (
                        <>
                            <ExternalDependencyCard
                                key={missingDependency.display_name}
                                missingDependency={missingDependency}
                                freeInstallationSlot={() => setInstallationSlot(null)}
                                isInInstallationSlot={installationSlot === index}
                                isInstallationSlotOccupied={installationSlot !== null}
                                occupyInstallationSlot={() => setInstallationSlot(index)}
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
                            {t('continue')}
                        </Button>
                        <Button
                            variant="squared"
                            color="error"
                            size="medium"
                            onClick={handleRestart}
                            disabled={isRestarting}
                            style={{ width: '100px' }}
                        >
                            {t('restart')}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
