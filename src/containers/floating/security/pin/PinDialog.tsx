import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';

import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

import CreatePin from '@app/components/security/pin/CreatePin.tsx';
import EnterPin from '@app/components/security/pin/EnterPin.tsx';
import CreateComplete from '@app/components/security/pin/CreateComplete.tsx';
import { Header, Heading, Wrapper } from './styles.ts';

export default function PinDialog() {
    const { t } = useTranslation('wallet');
    const [showComplete, setShowComplete] = useState(false);
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'enterPin' || dialogToShow === 'createPin';

    function handleClose() {
        void emit('pin-dialog-response', { pin: undefined });
        setDialogToShow(null);
        setShowComplete(false);
    }

    function handleSubmit(pin: string) {
        emit('pin-dialog-response', Number(pin)).then(() => {
            setShowComplete(true);
        });
    }

    async function handleForgotPin() {
        // Import seed words to create new PIN
    }

    const createMarkup = showComplete ? (
        <CreateComplete onClose={handleClose} />
    ) : (
        <CreatePin onSubmit={handleSubmit} onClose={handleClose} />
    );

    const headerMarkup =
        dialogToShow === 'enterPin' ? (
            <Header>
                <Heading>{t('security.pin.enter')}</Heading> <CloseButton onClick={handleClose} />
            </Header>
        ) : (
            <Header>
                <div /> <CloseButton onClick={handleClose} />
            </Header>
        );
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    {headerMarkup}
                    {dialogToShow === 'createPin' && createMarkup}
                    {dialogToShow === 'enterPin' && <EnterPin onSubmit={handleSubmit} onForgot={handleForgotPin} />}
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
