import { emit } from '@tauri-apps/api/event';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Header, Wrapper } from './styles.ts';
import { useState } from 'react';
import CreateComplete from '@app/components/security/pin/CreateComplete.tsx';
import CreatePin from '@app/components/security/pin/CreatePin.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

export default function CreatePinDialog() {
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);

    const [showComplete, setShowComplete] = useState(false);
    const isOpen = modal === 'create_pin';

    function handleClose() {
        void emit('pin-dialog-response', { pin: undefined });
        setShowComplete(false);
        setModal(null);
    }

    function handleSubmit(pin: string) {
        emit('pin-dialog-response', Number(pin)).then(() => {
            if (!showComplete) {
                setShowComplete(true);
            } else {
                setShowComplete(false);
                setModal(null);
            }
        });
    }

    const markup = showComplete ? (
        <CreateComplete onClose={handleClose} />
    ) : (
        <CreatePin onSubmit={handleSubmit} onClose={handleClose} />
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <div /> <CloseButton onClick={handleClose} />
                    </Header>
                    {markup}
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
