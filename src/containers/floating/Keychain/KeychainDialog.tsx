import { PiWarning } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography.tsx';
import { emit } from '@tauri-apps/api/event';

import { CloseButton, CopyWrapper, HeaderWrapper, Wrapper } from './styles.ts';
import { useTranslation } from 'react-i18next';

export default function KeychainDialog() {
    const { t } = useTranslation('wallet');
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'keychain';

    function handleClose() {
        emit('keyring-dialog-response');
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
                        <Typography variant="h2">{t('security.keychain.enable')}</Typography>
                    </HeaderWrapper>
                    <CopyWrapper>
                        <PiWarning size={24} />
                        <Typography>{t('security.keychain.warning')}</Typography>
                    </CopyWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
