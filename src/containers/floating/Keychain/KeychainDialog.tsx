import { PiWarning } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography.tsx';

import { CloseButton, CopyWrapper, Wrapper } from './styles.ts';

export default function KeychainDialog() {
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'keychain';

    function handleClose() {
        setDialogToShow(null);
    }
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <CloseButton onClick={handleClose}>
                        <IoClose size={18} />
                    </CloseButton>
                    <Typography variant="h3">{'Keychain Access'}</Typography>
                    <PiWarning size={24} />
                    <CopyWrapper>
                        <Typography variant="p">{`Keychain access is required for this operation.`}</Typography>
                        <Typography variant="p">{`Please try again and select "allow"`}</Typography>
                    </CopyWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
