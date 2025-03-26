import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { CustomPowerLevelsDialog } from './CustomPowerLevelsDialog';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect } from 'react';
import { getMaxAvailableThreads, setCustomLevelsDialogOpen } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore.ts';

export const CustomPowerLevelsDialogContainer = () => {
    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const maxThreads = useMiningStore((s) => s.maxAvailableThreads);
    const hardwarePhaseComplete = useSetupStore((s) => s.hardwarePhaseComplete);

    const handleClose = () => {
        setCustomLevelsDialogOpen(false);
    };
    useEffect(() => {
        if (!maxThreads && hardwarePhaseComplete) {
            getMaxAvailableThreads();
        }
    }, [maxThreads, hardwarePhaseComplete]);

    return (
        <Dialog
            open={customLevelsDialogOpen && Boolean(maxThreads)}
            onOpenChange={setCustomLevelsDialogOpen}
            disableClose={isChangingMode}
        >
            <DialogContent>
                {maxThreads && <CustomPowerLevelsDialog maxAvailableThreads={maxThreads} handleClose={handleClose} />}
            </DialogContent>
        </Dialog>
    );
};
