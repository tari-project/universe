import { useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Header, Wrapper } from '../common.styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';
import { TextWrapper } from '@app/components/sync/styles.ts';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';

export default function TappletCspDialog() {
    const { t } = useTranslation('staged-security');
    const modal = useSecurityStore((s) => s.modal);
    const tappletCsp = useSecurityStore((s) => s.tappletCsp);
    const setModal = useSecurityStore((s) => s.setModal);
    const setTappletCsp = useSecurityStore((s) => s.setTappletCsp);

    const isOpen = modal === 'allow_tapplet_csp';

    function handleClose() {
        void emit('tapplet-csp-dialog-response', { csp: '' });
        setModal(null);
        setTappletCsp('');
    }

    function handleSubmit() {
        emit('tapplet-csp-dialog-response', { csp: tappletCsp }).finally(() => {
            setModal(null);
            setTappletCsp('');
        });
    }

    // TODO add translations, designs and style
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    <TextWrapper>{tappletCsp}</TextWrapper>
                    <TextButton onClick={handleSubmit}>{'Allow CSP'}</TextButton>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
