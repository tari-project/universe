import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Header, Wrapper } from './styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

import CreatePin from '@app/components/security/pin/CreatePin.tsx';
import { emit } from '@tauri-apps/api/event';

export default function PinDialog() {
    // const { t } = useTranslation('wallet');
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'pin';

    function handleClose() {
        emit('pin-dialog-response', { pin: undefined });
        setDialogToShow(null);
    }

    function handleSubmit(pin: string) {
        emit('pin-dialog-response', Number(pin));
        setDialogToShow(null);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        {/*TODO - change this header based on dialog type*/}
                        <div /> <CloseButton onClick={handleClose} />
                        {/*<Heading>{t('security.pin.enter')}</Heading> <CloseButton />*/}
                    </Header>
                    <CreatePin onSubmit={handleSubmit} onClose={handleClose} />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
