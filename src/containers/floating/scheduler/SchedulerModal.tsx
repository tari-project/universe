import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { setShowScheduler, useModalStore } from '@app/store/stores/useModalStore.ts';

export default function SchedulerModal() {
    const showScheduler = useModalStore((s) => s.showScheduler);

    return (
        <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
            <DialogContent>
                <div>
                    <p>{`meow`}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
