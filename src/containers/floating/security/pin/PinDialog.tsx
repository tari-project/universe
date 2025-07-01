import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Header, Wrapper } from './styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

import CreatePin from '@app/components/security/pin/CreatePin.tsx';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';
import { Input } from '@app/components/elements/inputs/Input.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export default function PinDialog() {
    // const { t } = useTranslation('wallet');
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'pin';

    function handleClose() {
        emit('pin-dialog-response', { pin: undefined });
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
                    <CreatePin onClose={handleClose} />
                </Wrapper>
                <Wrapper>
                    <Input />
                </Wrapper>
                <Wrapper>
                    <Button
                        onClick={() => {
                            emit('pin-dialog-response', 694200);
                            setDialogToShow(null);
                        }}
                    >
                        {'Submit'}
                    </Button>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
