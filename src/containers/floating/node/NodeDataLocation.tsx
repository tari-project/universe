import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { NodeDataLocation } from '@app/components/node/NodeDataLocation.tsx';

export default function NodeDataLocationModal() {
    return (
        <Dialog open={false}>
            <DialogContent variant="transparent">
                <NodeDataLocation />
            </DialogContent>
        </Dialog>
    );
}
