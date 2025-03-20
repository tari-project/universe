import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { CustomPowerLevelsDialog } from './CustomPowerLevelsDialog';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect } from 'react';
import { getMaxAvailableThreads, setCustomLevelsDialogOpen } from '@app/store';

export const CustomPowerLevelsDialogContainer = () => {
    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const maxThreads = useMiningStore((s) => s.maxAvailableThreads);

    const handleClose = () => {
        setCustomLevelsDialogOpen(false);
    };

    useEffect(() => {
        if (!maxThreads) {
            getMaxAvailableThreads();
        }
    }, [maxThreads]);

    return (
        <Dialog
            open={customLevelsDialogOpen && Boolean(maxThreads)}
            onOpenChange={setCustomLevelsDialogOpen}
            disableClose={isChangingMode}
        >
            <DialogContent>
                {maxThreads && maxThreads.max_cpu_threads && (
                    <CustomPowerLevelsDialog maxAvailableThreads={maxThreads} handleClose={handleClose} />
                )}
            </DialogContent>
        </Dialog>
    );
};
