import { respondToPin, useIsWalletSecurityMandatory, useSecurityStore } from '@app/store/useSecurityStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Header, Wrapper } from './styles.ts';
import { useState } from 'react';
import CreateComplete from '@app/components/security/pin/CreateComplete.tsx';
import CreatePin from '@app/components/security/pin/CreatePin.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

export default function CreatePinDialog() {
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);
    const isMandatory = useIsWalletSecurityMandatory();

    const [showComplete, setShowComplete] = useState(false);
    const isOpen = modal === 'create_pin';
    const isBlocking = isMandatory && !showComplete;

    function handleClose() {
        if (isBlocking) {
            return;
        }
        if (!showComplete) {
            void respondToPin();
        }
        setShowComplete(false);
        setModal(null);
    }

    function handleSubmit(pin: string) {
        Promise.resolve(respondToPin(pin)).then(() => {
            useWalletStore.setState({ is_pin_locked: true });
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
        <Dialog open={isOpen} onOpenChange={handleClose} disableClose={isBlocking}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <div /> {!isBlocking && <CloseButton onClick={handleClose} />}
                    </Header>
                    {markup}
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
