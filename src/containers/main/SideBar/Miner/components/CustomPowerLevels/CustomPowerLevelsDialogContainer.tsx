import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { CustomPowerLevelsDialog } from './CustomPowerLevelsDialog';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect } from 'react';

export const CustomPowerLevelsDialogContainer = () => {
    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const setCustomLevelsDialogOpen = useMiningStore((s) => s.setCustomLevelsDialogOpen);

    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const maxThreads = useMiningStore((s) => s.maxAvailableThreads);
    const fetchMaxThreads = useMiningStore((s) => s.getMaxAvailableThreads);

    const handleClose = () => {
        setCustomLevelsDialogOpen(false);
    };

    useEffect(() => {
        if (!maxThreads) {
            fetchMaxThreads();
        }
    }, [fetchMaxThreads, maxThreads]);

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
