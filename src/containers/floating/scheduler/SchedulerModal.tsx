import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { setShowScheduler, useModalStore } from '@app/store/stores/useModalStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import Scheduler from '@app/components/scheduler/Scheduler.tsx';

export default function SchedulerModal() {
    const showScheduler = useModalStore((s) => s.showScheduler);
    function onClose() {
        setShowScheduler(false);
    }
    return (
        <Dialog open={true} onOpenChange={setShowScheduler}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={onClose} />}>
                <Scheduler />
            </DialogContent>
        </Dialog>
    );
}
