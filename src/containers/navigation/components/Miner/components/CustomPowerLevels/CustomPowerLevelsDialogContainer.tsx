import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { CustomPowerLevelsDialog } from './CustomPowerLevelsDialog';
import { useMiningStore } from '@app/store/useMiningStore';
import { setCustomLevelsDialogOpen } from '@app/store';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore';

export const CustomPowerLevelsDialogContainer = () => {
    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const isCpuMiningUnlocked = useSetupStore((s) => s.cpuMiningUnlocked);
    const isGpuMiningUnlocked = useSetupStore((s) => s.gpuMiningUnlocked);
    const isModeSelectionEnabled = isCpuMiningUnlocked || isGpuMiningUnlocked;

    const handleClose = () => {
        setCustomLevelsDialogOpen(false);
    };

    return (
        <Dialog
            open={customLevelsDialogOpen && isModeSelectionEnabled}
            onOpenChange={setCustomLevelsDialogOpen}
            disableClose={isChangingMode}
        >
            <DialogContent>
                {isModeSelectionEnabled ? <CustomPowerLevelsDialog handleClose={handleClose} /> : <CircularProgress />}
            </DialogContent>
        </Dialog>
    );
};
