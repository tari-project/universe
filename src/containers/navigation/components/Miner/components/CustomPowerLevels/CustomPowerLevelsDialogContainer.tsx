import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { CustomPowerLevelsDialog } from './CustomPowerLevelsDialog';
import { useMiningStore } from '@app/store/useMiningStore';
import { setCustomLevelsDialogOpen } from '@app/store';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore';

export const CustomPowerLevelsDialogContainer = () => {
    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const isHardwarePhaseFinished = useSetupStore((s) => s.hardwarePhaseFinished);

    const handleClose = () => {
        setCustomLevelsDialogOpen(false);
    };

    return (
        <Dialog
            open={customLevelsDialogOpen && isHardwarePhaseFinished}
            onOpenChange={setCustomLevelsDialogOpen}
            disableClose={isChangingMode}
        >
            <DialogContent>
                {isHardwarePhaseFinished ? <CustomPowerLevelsDialog handleClose={handleClose} /> : <CircularProgress />}
            </DialogContent>
        </Dialog>
    );
};
