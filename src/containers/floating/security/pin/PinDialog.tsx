import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Header, Heading, Wrapper } from './styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';

export default function PinDialog() {
    const { t } = useTranslation('wallet');
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'pin';

    function handleClose() {
        setDialogToShow(null);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <Heading>{t('security.pin.enter')}</Heading> <CloseButton />
                    </Header>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
