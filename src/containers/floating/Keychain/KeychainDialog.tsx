import { PiWarning } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography.tsx';

import { CloseButton, CopyWrapper, HeaderWrapper, Wrapper } from './styles.ts';

export default function KeychainDialog() {
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'keychain';

    function handleClose() {
        setDialogToShow(null);
    }
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <CloseButton onClick={handleClose}>
                    <IoClose />
                </CloseButton>
                <Wrapper>
                    <HeaderWrapper>
                        <Typography variant="h2">{'Enable Keychain Access'}</Typography>
                    </HeaderWrapper>
                    <CopyWrapper>
                        <PiWarning size={24} />
                        <Typography>{`Keychain access is required for this operation.\nPlease try again and select "allow".`}</Typography>
                    </CopyWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
