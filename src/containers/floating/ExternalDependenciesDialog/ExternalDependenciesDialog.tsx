import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Divider } from '@app/components/elements/Divider';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { ExternalDependencyStatus } from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useState } from 'react';
import { ExternalDependencyCard } from './ExternalDependencyCard';
import { useTranslation } from 'react-i18next';
import { setShowExternalDependenciesDialog } from '@app/store';

const ExternalDependenciesDialog = memo(function ExternalDependenciesDialog() {
    const { t } = useTranslation('external-dependency-dialog', { useSuspense: false });
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);
    const externalDependencies = useAppStateStore((s) => s.externalDependencies);
    const [isRestarting, setIsRestarting] = useState(false);
    const [installationSlot, setInstallationSlot] = useState<number | null>(null);

    const handleRestart = useCallback(async () => {
        try {
            setIsRestarting(true);
            await invoke('restart_application', { shouldStopMiners: true });
        } catch (e) {
            console.error('Error restarting application:', e);
        }
        setIsRestarting(false);
    }, []);

    const shouldAllowContinue = Object.values(externalDependencies).every(
        (missingDependency) => missingDependency.status === ExternalDependencyStatus.Installed
    );

    return (
        <Dialog open={showExternalDependenciesDialog}>
            <DialogContent>
                <Stack gap={16}>
                    <Stack gap={4}>
                        <Typography variant="h4">{t('title')}</Typography>
                        <Typography variant="p">{t('description')}</Typography>
                    </Stack>

                    {Object.values(externalDependencies).map((missingDependency, index, array) => (
                        <Stack key={`dependency:${index}:${missingDependency.display_name}`}>
                            <ExternalDependencyCard
                                missingDependency={missingDependency}
                                freeInstallationSlot={() => setInstallationSlot(null)}
                                isInInstallationSlot={installationSlot === index}
                                isInstallationSlotOccupied={installationSlot !== null}
                                occupyInstallationSlot={() => setInstallationSlot(index)}
                            />
                            {index === array.length - 1 ? null : <Divider />}
                        </Stack>
                    ))}
                    <Stack direction="row" justifyContent="flex-end" gap={8}>
                        <SquaredButton
                            color="grey"
                            size="medium"
                            onClick={() => setShowExternalDependenciesDialog(false)}
                            disabled={isRestarting || !shouldAllowContinue}
                            style={{ width: '100px' }}
                        >
                            {t('continue')}
                        </SquaredButton>
                        <SquaredButton
                            color="error"
                            size="medium"
                            onClick={handleRestart}
                            disabled={isRestarting}
                            style={{ width: '100px' }}
                        >
                            {t('restart')}
                        </SquaredButton>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
});
export default ExternalDependenciesDialog;
