import { emit } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import EnterPin from '@app/components/security/pin/EnterPin.tsx';
import { Header, Heading, Wrapper } from './styles.ts';

export default function EnterPinDialog() {
    const { t } = useTranslation('wallet');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);

    const isOpen = modal === 'enter_pin';

    function handleClose() {
        void emit('pin-dialog-response', { pin: undefined });
        setModal(null);
    }

    function handleSubmit(pin: string) {
        emit('pin-dialog-response', Number(pin)).finally(() => {
            setModal(null);
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <Heading>{t('security.pin.enter')}</Heading> <CloseButton onClick={handleClose} />
                    </Header>
                    <EnterPin onSubmit={handleSubmit} />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
