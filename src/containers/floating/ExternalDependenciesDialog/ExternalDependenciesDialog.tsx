import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Divider } from '@app/components/elements/Divider';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalDependencyCard } from './ExternalDependencyCard';
import { useTranslation } from 'react-i18next';
import { SystemDependencyStatus } from '@app/types/app-status';
import { setShowExternalDependenciesDialog } from '@app/store';
import { IoCloseOutline } from 'react-icons/io5';
import { CloseButton } from '../FailedModuleInitializationDialog/styles';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { CTAWrapper, Wrapper } from './styles.ts';

export default function ExternalDependenciesDialog() {
    const { t } = useTranslation('external-dependency-dialog', { useSuspense: false });
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);
    const externalDependencies = useAppStateStore((s) => s.systemDependencies);
    const [isRestarting, setIsRestarting] = useState(false);
    const [installationSlot, setInstallationSlot] = useState<number | null>(null);

    const dependenciesRequiredByApp = useMemo(() => {
        return Object.values(externalDependencies).filter((dep) => dep.required_by_app_modules.length === 0);
    }, [externalDependencies]);

    const isClosable = useMemo(() => {
        return dependenciesRequiredByApp.every((dep) => dep.status === SystemDependencyStatus.Installed);
    }, [dependenciesRequiredByApp]);

    const handleClose = useCallback(() => {
        if (isClosable) {
            setShowExternalDependenciesDialog(false);
        }
    }, [isClosable]);

    // Close dialog automatically when all dependencies are installed
    useEffect(() => {
        if (isClosable) {
            handleClose();
        }
    }, [externalDependencies, handleClose, isClosable]);

    const handleRestart = useCallback(async () => {
        try {
            setIsRestarting(true);
            await invoke('restart_application');
        } catch (e) {
            console.error('Error restarting application:', e);
        }
        setIsRestarting(false);
    }, []);

    return (
        <Dialog open={showExternalDependenciesDialog} onOpenChange={handleClose}>
            <DialogContent>
                {isClosable && (
                    <CloseButton onClick={handleClose}>
                        <IoCloseOutline size={14} />
                    </CloseButton>
                )}
                <Wrapper>
                    <Stack gap={4}>
                        <Typography variant="h3">{t('title')}</Typography>
                        <Typography variant="p">{t('description')}</Typography>
                    </Stack>

                    {Object.values(externalDependencies).map((missingDependency, index, array) => (
                        <Stack key={`dependency:${index}:${missingDependency.ui_info.display_name}`}>
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
                </Wrapper>
                <CTAWrapper>
                    <Button onClick={handleRestart} disabled={isRestarting} size="medium" variant="outlined">
                        {t('restart')}
                    </Button>
                </CTAWrapper>
            </DialogContent>
        </Dialog>
    );
}
